/**
 * Reminds owners before their plan ends: 7 days before a paid period ends (unless cancelling) and
 * 3 days before a trial ends. One email per subscription per period end.
 * Access itself is enforced on every request — this job only sends reminders.
 */
import { prisma } from '../core/database/prisma.js';
import { env } from '../config/env.js';
import { notifyOnce, ownersOf } from './notify.js';

const DAY = 86400000;

export async function runRenewalReminders(now = new Date()) {
  const subs = await prisma.subscription.findMany({
    where: {
      currentPeriodEnd: { gt: now, lte: new Date(now.getTime() + 7 * DAY) },
      OR: [{ status: 'ACTIVE', cancelAtPeriodEnd: false }, { status: 'TRIAL' }],
      tenant: { status: 'ACTIVE' },
    },
    include: { plan: true, tenant: true },
  });
  let sent = 0;
  for (const s of subs) {
    const daysLeft = Math.ceil((s.currentPeriodEnd - now) / DAY);
    if (s.status === 'TRIAL' && daysLeft > 3) continue;
    const endDate = s.currentPeriodEnd.toISOString().slice(0, 10);
    const subject =
      s.status === "TRIAL"
        ? `Your Salora Glam trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
        : `Your ${s.plan.name} plan renews or ends on ${endDate}`;
    const text = `${s.tenant.displayName}: your ${s.status === 'TRIAL' ? 'free trial' : `${s.plan.name} plan`} ends on ${endDate}.\nRenew or choose a plan here so billing isn't interrupted: ${env.CLIENT_ORIGIN}/app/subscription\nAfter it ends, your invoices and data stay available read-only.`;
    for (const owner of await ownersOf(s.tenantId)) {
      const r = await notifyOnce({ dedupeKey: `renewal:${s.id}:${endDate}:${owner.email}`, tenantId: s.tenantId, to: owner.email, subject, text, template: 'renewal_reminder' });
      if (r.sent) sent++;
    }
  }
  return { checked: subs.length, sent };
}
