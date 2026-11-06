/** The salon's own Aura POS plan (not client memberships): status, renew/switch via Razorpay, history. */
import { useState } from 'react';
import { api, errorMessage } from '../../lib/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PageHeader, ErrorNote, Skeleton } from '../../components/ui';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ConfirmDialog } from '../../components/modals';
import { payForPlan } from './utils/razorpayCheckout.js';
import { CurrentPlanCard } from './components/CurrentPlanCard.jsx';
import { PlanOptionCard } from './components/PlanOptionCard.jsx';
import { PaymentHistory } from './components/PaymentHistory.jsx';

export default function SubscriptionPage() {
  const { me, can, reload } = useAuth();
  const toast = useToast();
  const status = useApi('/billing/status');
  const plans = useApi('/public/plans');
  const payments = useApi(can('billing.manage') ? '/billing/payments' : null);
  const [paying, setPaying] = useState(null);
  const st = status.data;
  const e = st?.entitlement;

  async function buy(plan) {
    setPaying(plan.id);
    try {
      await payForPlan({ plan, me });
      toast('Payment verified — your plan is active');
      await Promise.all([reload(), status.reload(), payments.reload()]);
    } catch (err) { toast(err.response ? errorMessage(err) : err.message, 'error'); }
    finally { setPaying(null); }
  }

  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancel = async () => {
    try { await api.post('/billing/cancel'); toast('Your plan will end at the close of this period'); setConfirmCancel(false); status.reload(); reload(); }
    catch (err) { toast(errorMessage(err), 'error'); }
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Subscription"
        subtitle="Your Salora Glam plan. Separate from the memberships you sell to clients."
      />
      {status.error && (
        <ErrorNote onRetry={status.reload}>{status.error}</ErrorNote>
      )}
      {status.loading ? (
        <Skeleton rows={3} />
      ) : (
        e && (
          <CurrentPlanCard
            entitlement={e}
            onCancel={() => setConfirmCancel(true)}
            canCancel={
              can("billing.manage") &&
              st.subscription?.status === "ACTIVE" &&
              !st.subscription.cancelAtPeriodEnd
            }
          />
        )
      )}
      {st && !st.paymentsConfigured && (
        <ErrorNote>
          Online payments are not configured on this server yet. Contact support
          to renew.
        </ErrorNote>
      )}
      {!me?.user.emailVerified && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Verify your email address before paying — check your inbox for the
          link.{" "}
          <button
            className="font-semibold underline"
            onClick={() =>
              api
                .post("/auth/resend-verification")
                .then(() => toast("Verification email sent"))
            }
          >
            Resend email
          </button>
        </div>
      )}
      <h2 className="mb-3 text-sm font-semibold text-stone-700">Plans</h2>
      {plans.loading ? (
        <Skeleton rows={3} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(plans.data ?? []).map((p) => (
            <PlanOptionCard
              key={p.id}
              plan={p}
              canBuy={can("billing.manage")}
              hasPlan={!!e?.planCode}
              loading={paying === p.id}
              current={
                e?.planCode === p.code && ["ACTIVE", "GRACE"].includes(e.state)
              }
              disabled={
                !!paying ||
                !st?.paymentsConfigured ||
                !me?.user.emailVerified ||
                e?.state === "SUSPENDED"
              }
              onBuy={buy}
            />
          ))}
        </div>
      )}
      {e?.planCode && (
        <p className="mt-3 text-xs text-stone-500">
          Renewing the same plan adds a full period after your current end date.
          Switching plan starts the new plan immediately.
        </p>
      )}
      {payments.data?.length > 0 && <PaymentHistory payments={payments.data} />}
      {confirmCancel && (
        <ConfirmDialog
          title="Cancel at the end of this period?"
          description="You keep full access until the period ends. After that your data stays available read-only."
          confirmLabel="Cancel plan"
          cancelLabel="Keep plan"
          danger
          onClose={() => setConfirmCancel(false)}
          onConfirm={cancel}
        />
      )}
    </div>
  );
}
