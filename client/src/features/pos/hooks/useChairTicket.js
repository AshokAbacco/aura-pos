/**
 * One chair's open ticket, kept in sync with the server.
 * Edits update the screen immediately and are saved after a short pause (one save at a time,
 * each carrying the version it was based on). If another screen changed the ticket meanwhile,
 * the server answers 409 and we reload the latest version.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRefreshListener } from "../../../hooks/useApi.js";
import { api, errorMessage } from "../../../lib/api.js";
import { emptyCart } from "../utils/posDraft.js";

const toCart = (ticket) =>
  ticket
    ? { ...emptyCart(), ...ticket.payload, customerId: ticket.customerId ?? "" }
    : emptyCart();
const toBody = (cart, version) => ({
  customerId: cart.customerId || null,
  ...(version ? { version } : {}),
  payload: {
    lines: cart.lines.map((l) => ({
      key: l.key,
      type: l.type,
      itemId: l.itemId ?? null,
      name: l.name,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice || 0),
      listPrice: Number(l.listPrice ?? l.unitPrice ?? 0),
      staffId: l.staffId || "",
      addedAt: l.addedAt,
    })),
    offer: cart.offer ?? "NONE",
    couponCode: cart.couponCode ?? "",
    tip: cart.tip === "" || cart.tip == null ? "" : Number(cart.tip),
    note: cart.note ?? "",
    appointmentId: cart.appointmentId ?? null,
  },
});

export function useChairTicket(chairId, { toast } = {}) {
  const [chair, setChair] = useState(null);
  const [cart, setCartState] = useState(emptyCart);
  const [status, setStatus] = useState("loading"); // loading | saved | dirty | saving | error
  const [error, setError] = useState(null);
  const latest = useRef(cart);
  const version = useRef(null);
  const ticketId = useRef(null);
  const queue = useRef(Promise.resolve());
  const timer = useRef(null);
  const dirty = useRef(false);

  const apply = (data) => {
    setChair(data);
    version.current = data.ticket?.version ?? null;
    ticketId.current = data.ticket?.id ?? null;
    const c = toCart(data.ticket);
    latest.current = c;
    setCartState(c);
    dirty.current = false;
    setStatus("saved");
  };

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/pos/chairs/${chairId}`);
      apply(r.data.data);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chairId]);
  useEffect(() => {
    setStatus("loading");
    load();
  }, [load]);

  /** Save the newest edits (queued so saves never overlap). Resolves when the server has them. */
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    queue.current = queue.current.then(async () => {
      if (!dirty.current) return;
      dirty.current = false;
      setStatus("saving");
      try {
        const r = await api.put(
          `/pos/chairs/${chairId}/ticket`,
          toBody(latest.current, version.current),
        );
        version.current = r.data.data?.version ?? null;
        ticketId.current = r.data.data?.id ?? null;
        setStatus(dirty.current ? "dirty" : "saved");
      } catch (e) {
        if (e.response?.status === 409) {
          toast?.(errorMessage(e), "error");
          await load();
        } else {
          dirty.current = true;
          setStatus("error");
          toast?.(errorMessage(e), "error");
        }
      }
    });
    return queue.current;
  }, [chairId, load, toast]);

  const setCart = useCallback(
    (updater) => {
      setCartState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        latest.current = next;
        return next;
      });
      dirty.current = true;
      setStatus("dirty");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        flush();
      }, 600);
    },
    [flush],
  );

  // Save pending edits when leaving the screen.
  useEffect(
    () => () => {
      if (dirty.current) flush();
    },
    [flush],
  );

  /** For checkout: make sure the server has our edits, then give the ticket id + version to close. */
  const closeArgs = useCallback(async () => {
    await flush();
    return ticketId.current
      ? { chairTicketId: ticketId.current, chairTicketVersion: version.current }
      : {};
  }, [flush]);

  // Pull to refresh: save what is typed first, then fetch the latest ticket.
  useRefreshListener(async () => {
    await flush();
    await load();
  });

  return {
    chair,
    cart,
    setCart,
    status,
    error,
    reload: load,
    flush,
    closeArgs,
    hasTicket: () => !!ticketId.current,
  };
}
