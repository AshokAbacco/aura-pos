import { LuLayoutDashboard, LuCalendarDays, LuUsers, LuReceiptText, LuPackage, LuUserCog, LuChartColumnIncreasing, LuSettings, LuSearch, LuBell } from 'react-icons/lu';

const NAV = [[LuLayoutDashboard, 'Dashboard'], [LuCalendarDays, 'Appointments'], [LuUsers, 'Clients'], [LuReceiptText, 'Billing'], [LuPackage, 'Products'], [LuUserCog, 'Staff'], [LuChartColumnIncreasing, 'Reports'], [LuSettings, 'Settings']];

/** Miniature app sidebar used inside the illustrated screens. */
export function MockSidebar({ active = 'Dashboard' }) {
  return (
    <aside className="w-[27%] shrink-0 border-r border-stone-100 bg-white p-2.5">
      <p className="mb-3 px-1 font-display text-[11px] font-semibold text-ink">
        Salora Glam
      </p>
      <ul className="space-y-0.5">
        {NAV.map(([Icon, l]) => (
          <li
            key={l}
            className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[8px] ${l === active ? "bg-petal font-semibold text-mauve" : "text-stone-500"}`}
          >
            <Icon size={9} aria-hidden />
            {l}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function MockTopBar({ user = 'Sarah', role = 'Owner' }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-2">
      <div className="flex flex-1 items-center gap-1 rounded-md bg-stone-50 px-2 py-1 text-[7px] text-stone-400"><LuSearch size={8} aria-hidden />Search client, service or product…</div>
      <LuBell size={9} className="text-stone-400" aria-hidden />
      <div className="flex items-center gap-1"><span className="h-4 w-4 rounded-full bg-gradient-to-br from-blush to-mauve/50" /><span className="text-[7px] leading-tight"><b className="block text-ink">{user}</b><span className="text-stone-400">{role}</span></span></div>
    </div>
  );
}

const TONE = { green: 'bg-emerald-50 text-emerald-700', blue: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700', stone: 'bg-stone-100 text-stone-600' };
export const Pill = ({ tone = 'stone', children }) => <span className={`inline-block rounded px-1.5 py-0.5 text-[7px] font-semibold ${TONE[tone]}`}>{children}</span>;

export const Avatar = ({ src, className = 'h-5 w-5' }) => <img src={src} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />;
