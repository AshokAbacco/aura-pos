/**
 * Opens Razorpay Checkout for an order the server already created, then asks the SERVER to verify
 * the signature. The browser's "success" is never trusted on its own; the webhook confirms independently.
 */
import { api } from '../../../lib/api.js';

function loadScript() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = Object.assign(document.createElement('script'), { src: 'https://checkout.razorpay.com/v1/checkout.js', onload: resolve, onerror: () => reject(new Error('Could not load the payment window. Check your connection.')) });
    document.body.appendChild(s);
  });
}

export async function payForPlan({ plan, me }) {
  const { data } = (await api.post('/billing/orders', { planId: plan.id })).data;
  await loadScript();
  await new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amountPaise,
      currency: data.currency,
      name: "Salora Glam",
      description: `${plan.name} plan for ${me.tenant.displayName}`,
      prefill: { name: me.user.name, email: me.user.email },
      theme: { color: "#a12b3c" },
      handler: async (resp) => {
        try {
          await api.post("/billing/verify", resp);
          resolve();
        } catch (e) {
          reject(e);
        }
      },
      modal: {
        ondismiss: () =>
          reject(
            new Error(
              "Payment window closed — you have not been charged for this attempt.",
            ),
          ),
      },
    });
    rzp.on('payment.failed', (r) => reject(new Error(r.error?.description ?? 'Payment failed')));
    rzp.open();
  });
}
