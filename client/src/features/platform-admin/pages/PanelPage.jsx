import { PageTitle } from "../components/PageTitle.jsx";
import { PlansPanel } from "../components/PlansPanel.jsx";
import { PaymentsPanel } from "../components/PaymentsPanel.jsx";
import { AuditPanel } from "../components/AuditPanel.jsx";
import { WebhooksPanel } from "../components/WebhooksPanel.jsx";
import { ContactsPanel } from "../components/ContactsPanel.jsx";

const PANELS = {
  plans: [
    "Plans",
    "What salons can buy. Changing a price affects new purchases and renewals.",
    PlansPanel,
  ],
  payments: [
    "Payments",
    "Subscription payments verified by the server (Razorpay signature or webhook).",
    PaymentsPanel,
  ],
  activity: [
    "Activity log",
    "Everything audited across all salons and the platform team.",
    AuditPanel,
  ],
  webhooks: [
    "Webhooks",
    "Events received from Razorpay. A failed event can be retried by Razorpay.",
    WebhooksPanel,
  ],
  enquiries: [
    "Website enquiries",
    "Messages sent from the website contact form.",
    ContactsPanel,
  ],
};

export default function PanelPage({ panel }) {
  const [title, sub, Panel] = PANELS[panel];
  return (
    <>
      <PageTitle title={title} sub={sub} />
      <Panel />
    </>
  );
}
