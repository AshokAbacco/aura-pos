import { useState } from "react";
import { FiPrinter } from "react-icons/fi";
import { Button } from "../ui";
import { Modal } from "../modals";
import { cx } from "../../utils/cx.js";
import { money, dateTime } from "../../utils/format.js";
import { printPage } from "../../lib/native.js";

/**
 * Renders an invoice / credit note from its stored snapshot (seller, customer, lines, taxes,
 * payments) — so a reprint matches the original even if prices, tax or branding changed later.
 * Printing never creates or modifies an invoice.
 */
export function ReceiptBody({ inv, format = "thermal" }) {
  const s = inv.sellerSnapshot ?? {};
  const c = inv.customerSnapshot;
  const credit = inv.kind === "CREDIT_NOTE";
  const row = (label, value, strong) => (
    <div
      className={cx("flex justify-between gap-4", strong && "font-semibold")}
    >
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  );
  const thermal = format === "thermal";
  // Narrow 80 mm columns drop the ₹ sign on line items (the header states INR via totals).
  const amt = (v) =>
    thermal
      ? Number(v).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : money(v);
  return (
    <div
      className={cx(
        "print-area bg-white text-stone-900",
        thermal
          ? "thermal mx-auto w-[80mm] font-mono text-[11px] leading-snug"
          : "mx-auto max-w-[190mm] p-2 text-sm",
      )}
    >
      <div
        className={cx(
          "text-center",
          thermal
            ? "border-b border-dashed border-stone-400 pb-2"
            : "border-b border-stone-300 pb-4",
        )}
      >
        <p
          className={cx("font-bold", thermal ? "text-sm uppercase" : "text-xl")}
        >
          {s.displayName}
        </p>
        {s.legalName && s.legalName !== s.displayName && <p>{s.legalName}</p>}
        <p>{s.branchName}</p>
        {s.address && <p>{s.address}</p>}
        <p>
          {[s.phone && `Tel ${s.phone}`, s.gstin && `GSTIN ${s.gstin}`]
            .filter(Boolean)
            .join(" | ")}
        </p>
        {s.tagline && <p className="italic">{s.tagline}</p>}
      </div>
      <div
        className={cx(
          "py-2",
          thermal
            ? "border-b border-dashed border-stone-400"
            : "grid grid-cols-2 gap-2 border-b border-stone-300 py-3",
        )}
      >
        <p className="font-bold">
          {credit ? "CREDIT NOTE" : "TAX INVOICE"} {inv.number}
        </p>
        <p>{dateTime(inv.issuedAt)}</p>
        {c && (
          <p>
            Customer: {c.name}
            {c.phone ? ` (${c.phone})` : ""}
            {c.membership ? ` · ${c.membership}` : ""}
          </p>
        )}
        {inv.placeOfSupply && <p>Place of supply: {inv.placeOfSupply}</p>}
        {inv.status === "VOID" && (
          <p className="font-bold">VOID — {inv.voidReason}</p>
        )}
      </div>
      <table className="w-full border-b border-dashed border-stone-400 py-2 text-left">
        <thead>
          <tr className="border-b border-stone-300">
            <th className="py-1">Item</th>
            <th className="py-1 px-1 text-center">Qty</th>
            <th className="py-1 pl-1 text-right">Rate</th>
            <th className="py-1 pl-2 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l) => (
            <tr key={l.id} className="align-top">
              <td className="py-1 pr-1">
                <div>{l.description}</div>
                <div className="text-[0.85em] text-stone-500">
                  {[
                    l.sacHsn && `SAC/HSN ${l.sacHsn}`,
                    `GST ${Number(l.taxRate)}%`,
                    l.staffName && `by ${l.staffName.split(" ")[0]}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {Number(l.discountAmount) > 0 && (
                  <div className="text-[0.85em]">
                    Discount −{money(l.discountAmount)}
                  </div>
                )}
              </td>
              <td className="num py-1 px-1 text-center">{l.quantity}</td>
              <td className="num whitespace-nowrap py-1 pl-1 text-right">
                {amt(l.unitPrice)}
              </td>
              <td className="num whitespace-nowrap py-1 pl-2 text-right">
                {amt(l.grossAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        className={cx(
          "space-y-0.5 py-2",
          thermal
            ? "border-b border-dashed border-stone-400"
            : "ml-auto max-w-xs",
        )}
      >
        {row("Subtotal", money(inv.subtotal))}
        {Number(inv.discountTotal) > 0 &&
          row("Discount", `−${money(inv.discountTotal)}`)}
        {row("Taxable value", money(inv.taxableTotal))}
        {Number(inv.cgstTotal) > 0 && row("CGST", money(inv.cgstTotal))}
        {Number(inv.sgstTotal) > 0 && row("SGST", money(inv.sgstTotal))}
        {Number(inv.igstTotal) > 0 && row("IGST", money(inv.igstTotal))}
        {Number(inv.tip) > 0 && row("Gratuity (not taxed)", money(inv.tip))}
        {Number(inv.roundOff) !== 0 && row("Round-off", money(inv.roundOff))}
        {row(credit ? "Total refunded" : "Total", money(inv.grandTotal), true)}
        {inv.payments?.map((p) => (
          <div key={p.id}>
            {row(
              `${credit ? "Refunded via" : "Paid by"} ${p.method}${p.reference ? ` (${p.reference})` : ""}`,
              money(Math.abs(Number(p.amount))),
            )}
          </div>
        ))}
        {Number(inv.amountDue) > 0 &&
          row("Balance due", money(inv.amountDue), true)}
      </div>
      <div className="pt-2 text-center text-[0.9em] text-stone-600">
        {s.upiId && <p>UPI: {s.upiId}</p>}
        {s.receiptFooter && <p>{s.receiptFooter}</p>}
        <p>Thank you for visiting {s.displayName}.</p>
      </div>
    </div>
  );
}

export function ReceiptModal({ invoice, onClose }) {
  const [format, setFormat] = useState("thermal");
  if (!invoice) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title={`${invoice.kind === "CREDIT_NOTE" ? "Credit note" : "Invoice"} ${invoice.number}`}
      wide={format === "a4"}
      footer={
        <>
          <div
            className="mr-auto flex rounded-lg border border-stone-300 p-0.5 text-xs"
            role="group"
            aria-label="Paper size"
          >
            {["thermal", "a4"].map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className={cx(
                  "rounded-md px-3 py-1 font-semibold",
                  format === f ? "bg-stone-900 text-white" : "text-stone-600",
                )}
              >
                {f === "thermal" ? "80 mm" : "A4"}
              </button>
            ))}
          </div>
          <Button onClick={onClose}>Close</Button>
          <Button variant="dark" onClick={() => printPage("Receipt")}>
            <FiPrinter /> Print
          </Button>
        </>
      }
    >
      <div className="rounded-lg border border-dashed border-stone-300 p-2">
        <ReceiptBody inv={invoice} format={format} />
      </div>
    </Modal>
  );
}
