export const STATE_TONE = {
  TRIAL: "blue",
  ACTIVE: "green",
  GRACE: "amber",
  EXPIRED: "rose",
  SUSPENDED: "rose",
  NONE: "stone",
};
export const STATE_LABEL = {
  TRIAL: "Trial",
  ACTIVE: "Active",
  GRACE: "Grace period",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
  NONE: "No plan",
};
export const PAYMENT_TONE = {
  CAPTURED: "green",
  CREATED: "amber",
  FAILED: "rose",
  REFUNDED: "stone",
};
export const WEBHOOK_TONE = {
  PROCESSED: "green",
  RECEIVED: "amber",
  FAILED: "rose",
  IGNORED: "stone",
};
export const CONTACT_STATUSES = ["NEW", "IN_PROGRESS", "CLOSED", "SPAM"];
export const TABS = [
  ["overview", "Overview"],
  ["tenants", "Salons"],
  ["plans", "Plans"],
  ["payments", "Payments"],
  ["audit", "Activity log"],
  ["webhooks", "Webhooks"],
  ["contacts", "Enquiries"],
];
/** Activity-log filters: the prefix of the audited action. */
export const AUDIT_FILTERS = [
  ["", "Everything"],
  ["platform.", "Platform admin actions"],
  ["auth.", "Sign-ins & accounts"],
  ["subscription.", "Subscriptions"],
  ["invoice.", "Invoices & refunds"],
  ["settings.", "Salon settings"],
  ["users.", "Team changes"],
  ["wallet.", "Wallet"],
  ["stock.", "Stock"],
];
