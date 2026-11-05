import { describe, it, expect, beforeAll } from "vitest";
import {
  prisma,
  resetDb,
  seedPlans,
  registerSalon,
  buildShop,
} from "../helpers/helpers.js";

let owner, other, shop, chair1, chair2, room;
const line = (item, staffId, quantity = 1) => ({
  key: crypto.randomUUID(),
  type: item.type,
  itemId: item.id,
  name: item.name,
  quantity,
  unitPrice: item.price,
  listPrice: item.price,
  staffId,
});
const ticket = (lines, extra = {}) => ({
  payload: { lines, offer: "NONE", couponCode: "", tip: "" },
  ...extra,
});

beforeAll(async () => {
  await resetDb();
  await seedPlans();
  owner = await registerSalon("Floor Salon");
  other = await registerSalon("Other Salon");
  shop = await buildShop(owner);
  const add = async (body) =>
    (
      await owner.post(
        `/api/v1/settings/branches/${owner.branchId}/resources`,
        body,
      )
    ).body.data;
  chair1 = await add({ name: "Chair 1", floor: "Ground floor", sortOrder: 1 });
  chair2 = await add({ name: "Chair 2", floor: "Ground floor", sortOrder: 2 });
  room = await add({ name: "Spa Room", kind: "ROOM", floor: "First floor" });
});

describe("floor plan and chair tickets", () => {
  it("lists chairs grouped by floor with no tickets at first", async () => {
    const r = await owner.get("/api/v1/pos/floor");
    expect(r.status).toBe(200);
    expect(r.body.data.chairs.map((c) => [c.floor, c.name])).toEqual([
      ["Ground floor", "Chair 1"],
      ["Ground floor", "Chair 2"],
      ["First floor", "Spa Room"],
    ]);
    expect(r.body.data.chairs.every((c) => c.ticket === null)).toBe(true);
  });

  it("opens a ticket, prices it with the real engine and guards against stale writes", async () => {
    const created = await owner.put(
      `/api/v1/pos/chairs/${chair1.id}/ticket`,
      ticket([line(shop.haircut, shop.staff.id)], {
        customerId: shop.customer.id,
      }),
    );
    expect(created.status).toBe(200);
    expect(created.body.data.version).toBe(1);

    const floor = (await owner.get("/api/v1/pos/floor")).body.data.chairs.find(
      (c) => c.id === chair1.id,
    );
    expect(floor.ticket).toMatchObject({
      itemCount: 1,
      estimate: "1121.00",
      stylists: ["Vikram"],
      customer: { name: "Pooja" },
    });

    const updated = await owner.put(
      `/api/v1/pos/chairs/${chair1.id}/ticket`,
      ticket([line(shop.haircut, shop.staff.id), line(shop.shampoo)], {
        customerId: shop.customer.id,
        version: 1,
      }),
    );
    expect(updated.body.data.version).toBe(2);
    // another screen still holding version 1
    const stale = await owner.put(
      `/api/v1/pos/chairs/${chair1.id}/ticket`,
      ticket([], { version: 1 }),
    );
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe("TICKET_CHANGED");
  });

  it("bills the chair: invoice created and the ticket closed in the same transaction; a second bill is refused", async () => {
    const t = (await owner.get(`/api/v1/pos/chairs/${chair1.id}`)).body.data
      .ticket;
    const body = {
      customerId: shop.customer.id,
      chairTicketId: t.id,
      lines: [
        {
          type: "SERVICE",
          itemId: shop.haircut.id,
          quantity: 1,
          staffId: shop.staff.id,
        },
        { type: "PRODUCT", itemId: shop.shampoo.id, quantity: 1 },
      ],
    };
    const first = await owner.checkout({
      ...body,
      payments: [{ method: "CASH", amount: 2478 }],
    });
    expect(first.status).toBe(201);
    expect(
      await prisma.chairTicket.count({ where: { resourceId: chair1.id } }),
    ).toBe(0);

    const second = await owner.checkout({
      ...body,
      payments: [{ method: "CASH", amount: 2478 }],
    });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("TICKET_CLOSED");
    expect(
      await prisma.invoice.count({ where: { tenantId: owner.tenantId } }),
    ).toBe(1);
  });

  it("moves a ticket to a free chair, refuses a busy one, and clears with an audit entry", async () => {
    await owner.put(
      `/api/v1/pos/chairs/${chair2.id}/ticket`,
      ticket([line(shop.spa, shop.staff.id)]),
    );
    await owner.put(
      `/api/v1/pos/chairs/${room.id}/ticket`,
      ticket([line(shop.haircut)]),
    );
    expect(
      (
        await owner.post(`/api/v1/pos/chairs/${chair2.id}/move`, {
          toResourceId: room.id,
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await owner.post(`/api/v1/pos/chairs/${chair2.id}/move`, {
          toResourceId: chair1.id,
        })
      ).status,
    ).toBe(200);
    expect(
      (await owner.get(`/api/v1/pos/chairs/${chair1.id}`)).body.data.ticket
        .payload.lines[0].name,
    ).toBe("Hair Spa");

    expect(
      (
        await owner
          .del(`/api/v1/pos/chairs/${chair1.id}/ticket`)
          .send({ reason: "Client left" })
      ).status,
    ).toBe(204);
    expect(
      await prisma.auditLog.count({
        where: { tenantId: owner.tenantId, action: "pos.chair_cleared" },
      }),
    ).toBe(1);
  });

  it("saving an empty ticket frees the chair", async () => {
    const t = (await owner.get(`/api/v1/pos/chairs/${room.id}`)).body.data
      .ticket;
    const r = await owner.put(
      `/api/v1/pos/chairs/${room.id}/ticket`,
      ticket([], { version: t.version }),
    );
    expect(r.status).toBe(200);
    expect(r.body.data).toBeNull();
  });

  it("another salon cannot see or edit these chairs", async () => {
    expect((await other.get(`/api/v1/pos/chairs/${chair2.id}`)).status).toBe(
      404,
    );
    expect(
      (await other.put(`/api/v1/pos/chairs/${chair2.id}/ticket`, ticket([])))
        .status,
    ).toBe(404);
    expect((await other.get("/api/v1/pos/floor")).body.data.chairs).toEqual([]);
  });

  it("settings: rename, move floor, and refuse to deactivate a chair with an open ticket", async () => {
    await owner.put(
      `/api/v1/pos/chairs/${chair2.id}/ticket`,
      ticket([line(shop.haircut)]),
    );
    const moved = await owner.patch(`/api/v1/settings/resources/${chair2.id}`, {
      floor: "First floor",
      name: "Chair 2A",
    });
    expect(moved.status).toBe(200);
    expect(moved.body.data).toMatchObject({
      floor: "First floor",
      name: "Chair 2A",
    });
    expect(
      (
        await owner.patch(`/api/v1/settings/resources/${chair2.id}`, {
          isActive: false,
        })
      ).body.error.code,
    ).toBe("CHAIR_BUSY");
    expect(
      (
        await other.patch(`/api/v1/settings/resources/${chair2.id}`, {
          name: "X",
        })
      ).status,
    ).toBe(404);
  });
});

describe("billing a chair whose ticket changed elsewhere", () => {
  it("refuses checkout when the ticket version is stale", async () => {
    const r1 = await owner.put(
      `/api/v1/pos/chairs/${room.id}/ticket`,
      ticket([line(shop.haircut)]),
    );
    const t = r1.body.data;
    await owner.put(
      `/api/v1/pos/chairs/${room.id}/ticket`,
      ticket([line(shop.haircut), line(shop.spa)], { version: t.version }),
    );
    const res = await owner.checkout({
      chairTicketId: t.id,
      chairTicketVersion: t.version,
      lines: [{ type: "SERVICE", itemId: shop.haircut.id, quantity: 1 }],
      payments: [{ method: "CASH", amount: 1121 }],
    });
    expect(res.status).toBe(409);
    expect(await prisma.chairTicket.count({ where: { id: t.id } })).toBe(1);
  });
});
