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
export const ROLE_LABEL = {
  OWNER: "Owner",
  MANAGER: "Manager",
  RECEPTIONIST: "Front desk",
  STYLIST: "Stylist",
  INVENTORY_MANAGER: "Inventory",
  ACCOUNTANT: "Accountant",
};
export const ADMIN_ROLE_LABEL = {
  SUPER_ADMIN: "Super admin",
  SUPPORT: "Support",
};

/** Activity-log filters: the prefix of the audited action. */
export const AUDIT_FILTERS = [
  ["", "Everything"],
  ["platform.", "Platform team actions"],
  ["auth.", "Sign-ins & accounts"],
  ["subscription.", "Subscriptions"],
  ["invoice.", "Invoices & refunds"],
  ["settings.", "Salon settings"],
  ["users.", "Team changes"],
  ["wallet.", "Wallet"],
  ["stock.", "Stock"],
];

export const NOTE_KINDS = {
  NOTE: "Note",
  CALL: "Call",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  ISSUE: "Issue",
};
export const MESSAGE_KINDS = {
  RENEWAL: "Renewal reminder",
  NEW_PLAN: "New plan alert",
  ANNOUNCEMENT: "Announcement",
  CUSTOM: "Custom message",
};

/** Ready-made messages; the team edits them before sending. */
export const MESSAGE_TEMPLATES = {
  RENEWAL: {
    title: "Your Salora Glam plan ends soon",
    body: "Your plan ends shortly. Renew now to keep billing, appointments and reports running without a break.",
    link: "/app/subscription",
  },
  NEW_PLAN: {
    title: "New plan available",
    body: "We have launched a new plan with more features. See the details and switch any time from your subscription page.",
    link: "/app/subscription",
  },
  ANNOUNCEMENT: { title: "What’s new in Salora Glam", body: "", link: "" },
  CUSTOM: { title: "", body: "", link: "" },
};

export const SALON_SORTS = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["name", "Name A–Z"],
  ["expiry", "Plan ends soonest"],
  ["active", "Recently active"],
  ["revenue", "Most billed (30 days)"],
];

export const daysLabel = (n) =>
  n == null
    ? "—"
    : n < 0
    ? `${-n} day${n === -1 ? "" : "s"} ago`
    : n === 0
    ? "today"
    : `in ${n} day${n === 1 ? "" : "s"}`;
