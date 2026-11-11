import { LuSearch, LuUserRound, LuScissors, LuQrCode } from "react-icons/lu";
import { Avatar } from "./MockParts.jsx";

const CATALOG = [
  ["Hair Cut", "Cuts", "₹600"],
  ["Hair Spa", "Hair", "₹1,500"],
  ["Facial", "Skin", "₹1,200"],
  ["D-Tan", "Skin", "₹1,000"],
  ["Shampoo", "Retail", "₹300"],
];
const CART = [
  ["Hair Spa", "₹1,500"],
  ["Facial", "₹1,200"],
  ["Shampoo", "₹300"],
];
// ₹3,000 − 10% = ₹2,700; CGST 9% ₹243 + SGST 9% ₹243 → ₹3,186
const TOTALS = [
  ["Subtotal", "₹3,000"],
  ["Discount", "−₹300"],
  ["CGST (9%)", "₹243"],
  ["SGST (9%)", "₹243"],
];

/** Billing counter + printed receipt (features page, section 01). */
export function FeatureBillMock({ avatars }) {
  return (
    <div className="relative pr-14 md:pr-24">
      <div className="site-card grid grid-cols-[1fr_1.05fr] gap-3 p-3 text-left text-[10px]">
        <div>
          <p className="mb-2 text-xs font-semibold text-ink">New Bill</p>
          <div className="mb-2 flex items-center gap-1.5 rounded-md border border-stone-200 px-2 py-1 text-stone-400">
            <LuSearch size={10} />
            Search services or products…
          </div>
          <ul className="space-y-1.5">
            {CATALOG.map(([n, c, p], i) => (
              <li
                key={n}
                className="flex items-center gap-2 rounded-md border border-stone-100 p-1.5"
              >
                <Avatar src={avatars[i % avatars.length]} className="h-6 w-6" />
                <span className="flex-1">
                  <b className="block text-ink">{n}</b>
                  <span className="text-stone-400">{c}</span>
                </span>
                <b className="text-ink">{p}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-[#fcfafa] p-2">
          <div className="mb-2 flex gap-1.5 text-[9px] font-semibold text-mauve">
            <span className="flex items-center gap-1">
              <LuUserRound size={10} />
              Select Client
            </span>
            <span className="flex items-center gap-1">
              <LuScissors size={10} />
              Select Stylist
            </span>
          </div>
          <p className="mb-1 font-semibold text-ink">Cart (3)</p>
          <ul className="space-y-1">
            {CART.map(([n, p], i) => (
              <li key={n} className="flex items-center gap-1.5">
                <Avatar
                  src={avatars[(i + 1) % avatars.length]}
                  className="h-5 w-5"
                />
                <span className="flex-1 text-ink">{n}</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between rounded bg-white px-1.5 py-1 text-stone-500">
            <span>Discount</span>
            <span>10%</span>
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-y-0.5 text-stone-500">
            {TOTALS.map(([l, v]) => [
              <dt key={l}>{l}</dt>,
              <dd key={`${l}v`} className="text-right">
                {v}
              </dd>,
            ])}
            <dt className="font-bold text-ink">Total</dt>
            <dd className="text-right font-bold text-ink">₹3,186</dd>
          </dl>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[9px] font-semibold">
            <span className="rounded bg-mauve py-1 text-white">Cash</span>
            <span className="rounded bg-stone-100 py-1">Card</span>
            <span className="rounded bg-stone-100 py-1">UPI</span>
          </div>
        </div>
      </div>
      <div className="float-slow absolute -right-1 top-6 w-28 rounded-sm bg-white p-2.5 font-mono text-[7px] leading-tight text-stone-700 shadow-xl md:w-36">
        <p className="text-center font-sans text-[9px] font-bold text-ink">
          Salora Glam
        </p>
        <p className="mb-1 text-center">Salon &amp; Spa</p>
        {[
          ["Hair Spa", "1,500.00"],
          ["Facial", "1,200.00"],
          ["Shampoo", "300.00"],
        ].map(([n, v]) => (
          <p key={n} className="flex justify-between">
            <span>{n}</span>
            <span>{v}</span>
          </p>
        ))}
        <hr className="my-1 border-dashed border-stone-300" />
        {[
          ["Subtotal", "3,000.00"],
          ["Discount", "-300.00"],
          ["CGST 9%", "243.00"],
          ["SGST 9%", "243.00"],
        ].map(([n, v]) => (
          <p key={n} className="flex justify-between">
            <span>{n}</span>
            <span>{v}</span>
          </p>
        ))}
        <p className="mt-1 flex justify-between font-bold text-ink">
          <span>Total</span>
          <span>₹3,186.00</span>
        </p>
        <LuQrCode size={34} className="mx-auto mt-1.5 text-ink" aria-hidden />
      </div>
    </div>
  );
}
