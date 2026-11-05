/**
 * All billing state in one place: the cart, live server quote, payments and checkout.
 * Components receive what they need from this hook; none of them calculate money themselves.
 *
 * Two modes:
 *  - Quick sale (default): the hook owns the cart and keeps a draft in sessionStorage.
 *  - Controlled (floor plan): pass `cart` + `setCart` (the chair's ticket) and `extraBody`
 *    (chairTicketId/version); the ticket is closed by checkout on the server.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, errorMessage } from "../../../lib/api.js";
import { emptyCart, loadDraft, saveDraft } from "../utils/posDraft.js";
import { emptyPayment } from "../utils/pos.constants.js";

export function usePosCart({
  toast,
  onSettled,
  cart: extCart,
  setCart: extSetCart,
  extraBody,
  beforeCheckout,
}) {
  const controlled = extCart !== undefined;
  const [ownCart, setOwnCart] = useState(controlled ? emptyCart : loadDraft);
  const cart = controlled ? extCart : ownCart;
  const setCart = controlled ? extSetCart : setOwnCart;
  const [quote, setQuote] = useState(null);
  const [quoteErr, setQuoteErr] = useState(null);
  const [payments, setPayments] = useState([emptyPayment()]);
  const [split, setSplit] = useState(false);
  const [busy, setBusy] = useState(false);
  const idemKey = useRef(null);

  // Persist the draft; any change means a new checkout attempt (new idempotency key).
  useEffect(() => {
    if (!controlled) saveDraft(cart);
    idemKey.current = null;
  }, [cart, controlled]);

  /** What the API receives: item ids, quantities and (permitted) prices — never totals. */
  const body = useMemo(
    () => ({
      customerId: cart.customerId || undefined,
      appointmentId: cart.appointmentId || undefined,
      lines: cart.lines.map((l) => ({
        type: l.type,
        itemId: l.itemId,
        quantity: l.quantity,
        staffId: l.staffId || undefined,
        description: l.type === "CUSTOM" ? l.name : undefined,
        unitPrice:
          l.type === "CUSTOM" || String(l.unitPrice) !== String(l.listPrice)
            ? l.unitPrice
            : undefined,
      })),
      offer:
        cart.offer === "COUPON"
          ? { kind: "COUPON", couponCode: cart.couponCode }
          : { kind: cart.offer },
      tip: cart.tip || 0,
    }),
    [cart],
  );

  // Live totals from the server's calculation engine (debounced).
  useEffect(() => {
    if (!cart.lines.length) {
      setQuote(null);
      setQuoteErr(null);
      return undefined;
    }
    if (cart.offer === "COUPON" && !cart.couponCode) return undefined;
    const t = setTimeout(() => {
      api
        .post("/pos/quote", body)
        .then((r) => {
          setQuote(r.data.data);
          setQuoteErr(null);
        })
        .catch((e) => {
          setQuote(null);
          setQuoteErr(errorMessage(e));
        });
    }, 250);
    return () => clearTimeout(t);
  }, [body, cart.lines.length, cart.offer, cart.couponCode]);

  // Single payment follows the total automatically.
  useEffect(() => {
    if (!split && quote)
      setPayments((p) => [{ ...p[0], amount: quote.grandTotal }]);
  }, [quote, split]);

  const addItem = useCallback(
    (item) =>
      setCart((c) => {
        const existing = c.lines.find(
          (l) => l.itemId === item.id && l.type === item.type,
        );
        if (existing)
          return {
            ...c,
            lines: c.lines.map((l) =>
              l === existing ? { ...l, quantity: l.quantity + 1 } : l,
            ),
          };
        return {
          ...c,
          lines: [
            ...c.lines,
            {
              key: crypto.randomUUID(),
              type: item.type,
              itemId: item.id,
              name: item.name,
              quantity: 1,
              unitPrice: item.price,
              listPrice: item.price,
              staffId: "",
            },
          ],
        };
      }),
    [setCart],
  );
  const addLine = useCallback(
    (line) => setCart((c) => ({ ...c, lines: [...c.lines, line] })),
    [setCart],
  );
  const updateLine = useCallback(
    (key, patch) =>
      setCart((c) => ({
        ...c,
        lines: c.lines
          .map((l) => (l.key === key ? { ...l, ...patch } : l))
          .filter((l) => l.quantity > 0),
      })),
    [setCart],
  );
  const setField = useCallback(
    (patch) => setCart((c) => ({ ...c, ...patch })),
    [setCart],
  );
  const reset = useCallback((next = emptyCart()) => setCart(next), [setCart]);

  const toggleSplit = () => {
    setSplit(!split);
    setPayments([emptyPayment(payments[0].method, quote?.grandTotal ?? "")]);
  };
  const paid = payments.reduce((a, p) => a + Number(p.amount || 0), 0);
  const due = quote ? Number(quote.grandTotal) - paid : 0;

  async function checkout() {
    if (!quote) return;
    setBusy(true);
    idemKey.current ??= crypto.randomUUID(); // reused on retry → server returns the same invoice
    try {
      const extra = beforeCheckout ? await beforeCheckout() : extraBody;
      const r = await api.post(
        "/pos/checkout",
        {
          ...body,
          ...(extra ?? {}),
          payments: payments
            .filter((p) => Number(p.amount) > 0)
            .map((p) => ({
              method: p.method,
              amount: p.amount,
              reference: p.reference || undefined,
            })),
        },
        { headers: { "Idempotency-Key": idemKey.current } },
      );
      if (!controlled) setCart(emptyCart());
      setSplit(false);
      setPayments([emptyPayment()]);
      toast(`Invoice ${r.data.data.number} settled`);
      onSettled(r.data.data);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }

  async function park(label) {
    try {
      await api.post("/pos/parked", { label, cart });
      setCart(emptyCart());
      toast(`Parked "${label}"`);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  }

  return {
    cart,
    quote,
    quoteErr,
    payments,
    setPayments,
    split,
    toggleSplit,
    due,
    busy,
    addItem,
    addLine,
    updateLine,
    setField,
    reset,
    checkout,
    park,
  };
}
