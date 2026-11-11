/**
 * All words on the public website live here, so copy can be edited without touching layout.
 * Prices and plan limits are NOT here: they come from the server (/public/plans).
 */

// ───────────── Brand, company and contact ─────────────
import { BRAND as CORE } from "../../../config/brand.js";

export const BRAND = {
  ...CORE,
  tagline: "Billing, appointments and accounts for salons and spas in India.",
};

export const COMPANY = {
  name: "Abacco Technology",
  website: "https://www.abaccotech.com/",
  logo: "/abacco.png", // client/public/abacco.png (square or round logo, at least 96×96)
  email: "support@saloraglam.com",
  phone: "+91 99724 52044",
  phoneHref: "+919972452044",
  hours: "Mon - Sat, 9:30 AM - 6:30 PM",
  address: [
    "No 12, 13 & 12/A, Kirthan Arcade,",
    "3rd Floor, Aditya Nagar, Sandeep Unnikrishnan",
    "Road, Bangalore - 560097",
  ],
  mapQuery: "Kirthan Arcade, Aditya Nagar, Bengaluru, Karnataka 560097",
};

/** Social profiles. Leave url empty to hide an icon. */
export const SOCIAL = [
  { id: "instagram", label: "Instagram", url: "" },
  { id: "facebook", label: "Facebook", url: "" },
  { id: "linkedin", label: "LinkedIn", url: "" },
  { id: "youtube", label: "YouTube", url: "" },
];

export const NAV_LINKS = [
  ["/", "Home"],
  ["/features", "Features"],
  ["/pricing", "Pricing"],
  ["/about", "About"],
  ["/products", "Products"],
  ["/contact", "Contact"],
];
/** Footer link columns. */
export const FOOTER_GROUPS = [
  [
    "Product",
    [
      ["/features", "Features"],
      ["/pricing", "Pricing"],
      ["/products", "Our products"],
      ["/register", "Start free trial"],
    ],
  ],
  [
    "Company",
    [
      ["/about", "About us"],
      ["/contact", "Contact"],
      ["/login", "Sign in"],
    ],
  ],
  [
    "Legal",
    [
      ["/terms", "Terms & Conditions"],
      ["/privacy", "Privacy Policy"],
      ["/refunds", "Subscription & Refunds"],
    ],
  ],
];
export const FOOTER_LINKS = [
  ["/features", "Features"],
  ["/pricing", "Pricing"],
  ["/about", "About"],
  ["/products", "Products"],
  ["/contact", "Contact"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/refunds", "Subscription & refunds"],
];

// ───────────── Home ─────────────
export const HOME_TICKS = [
  "No card needed",
  "Setup in minutes",
  "GST-ready invoices",
];

export const RIBBON = [
  ["Creative haircut", "serviceHaircut"],
  ["Moroccan oil hair spa", "serviceHairSpa"],
  ["Balayage", "serviceBalayage"],
  ["Hydra-glow facial", "serviceFacial"],
  ["Aroma body massage", "serviceMassage"],
  ["Gel spa pedicure", "servicePedicure"],
];

export const WORKFLOW = [
  {
    icon: "calendar",
    title: "Book",
    body: "Take appointments online or at the front desk in seconds.",
  },
  {
    icon: "bill",
    title: "Bill",
    body: "Add services and products — the bill is created for you.",
  },
  {
    icon: "card",
    title: "Pay",
    body: "Accept cash, card, UPI or wallet with a single click.",
  },
  {
    icon: "chart",
    title: "Report",
    body: "Track daily sales, staff performance and more.",
  },
];

export const HOME_MODULES = [
  {
    icon: "bill",
    title: "Billing",
    body: "GST-ready invoices and 80 mm or A4 receipts.",
  },
  {
    icon: "calendar",
    title: "Appointments",
    body: "Online & walk-in booking with notifications.",
  },
  {
    icon: "user",
    title: "Clients",
    body: "Client profiles, history and preferences.",
  },
  {
    icon: "stock",
    title: "Stock",
    body: "Product inventory and low stock alerts.",
  },
  {
    icon: "staff",
    title: "Commission",
    body: "Staff commission and performance reports.",
  },
  {
    icon: "pnl",
    title: "Profit & loss",
    body: "Daily, monthly and yearly reports.",
  },
];

export const MORE_TIME = [
  ["bolt", "Faster billing"],
  ["heart", "Happier clients"],
  ["chart", "Better insights"],
  ["rupee", "More revenue"],
];

export const FAQ = [
  [
    "What happens when my subscription ends?",
    "Your account becomes read-only. You can still open and print past invoices, look up clients and export your data. You just can’t create new bills until you renew.",
  ],
  [
    "Can I use it for more than one branch?",
    "Yes. Professional covers up to 5 branches and Customize up to 10. Each branch has its own invoice numbering, stock and staff, and you can see reports for one branch or all of them.",
  ],
  [
    "Do I need special hardware?",
    "No. It runs in the browser on a laptop, tablet or phone. Receipts print on any 80 mm thermal printer or a normal A4 printer.",
  ],
  [
    "Is my data separate from other salons?",
    "Yes. Every request is checked against your account on the server, and your staff only see what their role allows.",
  ],
  [
    "Can I import my existing clients and products?",
    "Yes. Send us your client list and price list as a spreadsheet and our team will help you bring them in during setup.",
  ],
];

// ───────────── Features ─────────────
export const FEATURE_ICONS = [
  ["bill", "Billing"],
  ["calendar", "Appointments"],
  ["users", "Clients"],
  ["card", "Memberships"],
  ["stock", "Inventory"],
  ["staff", "Staff"],
  ["chart", "Reports"],
  ["branch", "Multi-branch"],
];

export const FEATURE_SECTIONS = [
  {
    id: "billing",
    no: "01",
    eyebrow: "Smart POS & billing",
    title: ["Complete customer", "checkout and salon billing", "in one place."],
    mock: "bill",
    items: [
      "Service & product billing",
      "Searchable catalogue",
      "Cart management",
      "Quantity adjustments",
      "Customer selection",
      "Stylist assignment",
      "Discounts and coupons",
      "Membership discounts",
      "GST calculations",
      "Cash, UPI and card payments",
      "Split payments",
      "80 mm receipt printing",
      "A4 invoice printing",
      "Invoice generation",
      "Invoice history",
      "Authorized refunds and voids",
    ],
  },
  {
    id: "appointments",
    no: "02",
    eyebrow: "Appointment & queue management",
    title: ["A smarter way to manage", "your salon schedule."],
    mock: "calendar",
    items: [
      "Online & walk-in bookings",
      "Appointment calendar",
      "Staff & stylist assignment",
      "Chair & resource allocation",
      "Available slot checking",
      "Rescheduling and cancellation",
      "Queue status",
      "Check-in and service status",
      "No-show tracking",
      "Appointment to billing",
      "Automated reminders (email/SMS/WhatsApp)",
    ],
  },
  {
    id: "crm",
    no: "03",
    eyebrow: "Customer CRM",
    title: ["Know your customers", "better and keep them coming back."],
    mock: "client",
    items: [
      "Customer profiles",
      "Contact information",
      "Visit history",
      "Purchase & invoice history",
      "Customer preferences",
      "Lifetime spending summary",
      "Treatment notes",
      "Hair colour formulations",
      "Allergy records",
      "Patch-test history",
      "Membership details",
      "Communication preferences",
      "Permission-based access",
    ],
  },
  {
    id: "memberships",
    no: "04",
    eyebrow: "Memberships & loyalty programs",
    title: ["Turn first-time clients", "into loyal members."],
    mock: "tiers",
    items: [
      "Membership tiers",
      "Membership pricing & validity",
      "Member-only discounts",
      "Prepaid service packages",
      "Session tracking",
      "Customer wallet credits",
      "Wallet transaction history",
      "Gift cards",
      "Loyalty rewards",
      "Membership expiry tracking",
      "Renewal & redemption records",
    ],
  },
  {
    id: "inventory",
    no: "05",
    eyebrow: "Inventory & stock management",
    title: ["Stay in control of your", "products and stock."],
    mock: "products",
    items: [
      "Service & product catalogue",
      "Product categories",
      "SKU & barcode support",
      "Stock tracking",
      "Supplier management",
      "Purchase orders",
      "Goods received",
      "Stock adjustments",
      "Low-stock alerts",
      "Wastage tracking",
      "Batch & expiry tracking",
      "Inventory valuation",
      "Branch-to-branch transfers",
    ],
  },
  {
    id: "staff",
    no: "06",
    eyebrow: "Staff & commission management",
    title: ["Manage your team with clarity."],
    mock: "staff",
    items: [
      "Employee profiles",
      "Role & branch assignment",
      "Stylist assignment",
      "Service & product commissions",
      "Commission calculation rules",
      "Attendance & leave management",
      "Salary configuration",
      "Payroll periods",
      "Payroll approvals",
      "Salary advances & adjustments",
      "Staff performance reports",
    ],
  },
  {
    id: "reports",
    no: "07",
    eyebrow: "Financial reports & profit/loss",
    title: ["Get clear insights into", "your business performance."],
    mock: "pnl",
    items: [
      "Daily & monthly revenue",
      "Service sales",
      "Retail product sales",
      "Discounts and refunds",
      "Expense tracking",
      "Salary and commission costs",
      "Gross revenue & operating profit/loss",
      "Profit margin",
      "Date-range filters",
      "Branch comparisons",
      "Financial charts",
      "CSV exports",
      "Printable reports",
    ],
  },
];

// ───────────── Pricing ─────────────
export const PRICING_PERKS = [
  ["wallet", "No hidden fees"],
  ["gear", "Setup in minutes"],
  ["headset", "Dedicated support"],
  ["refresh", "Cancel anytime"],
];
export const PRICING_STRIP = [
  ["cloud", "Cloud based", "Access from any device, anywhere"],
  ["shield", "Secure & reliable", "Your data is safe and backed up"],
  ["refresh", "Regular updates", "New features at no extra cost"],
  ["headset", "Expert support", "We’re here to help you succeed"],
];
/** Plan feature codes (set per plan in Platform admin) → how they read on the website. */
export const PLAN_FEATURE_LABELS = {
  pos: "POS & GST billing",
  appointments: "Appointment & queue management",
  inventory: "Inventory & stock management",
  payroll: "Staff commission & payroll",
  reports: "Financial reports & profit/loss",
  app_listing: "Salora Glam App display",
  "reports.advanced": "Payroll, advanced reports and reminders",
  // Codes without a label here (multibranch, notifications, online_booking) still work but don't get a tick of their
  // own: branches already have their own line, and reminders are covered by the line above.
};
/** Included in every plan (not gated by a feature code). */
export const ALWAYS_INCLUDED = [
  "Customer CRM",
  "Memberships & loyalty programs",
  "Role-based access & permissions",
];

export const PRICING_FAQ = [
  [
    "Can I change my plan later?",
    "Yes. You can move to another plan from the Subscription page at any time. The new plan starts as soon as the payment is confirmed.",
  ],
  [
    "Is GST included in the price?",
    "Plan prices are shown as charged, including applicable GST.",
  ],
  [
    "Is there a setup fee?",
    "No. You can set up your salon yourself in an afternoon, and every plan starts with a 14-day free trial.",
  ],
  [
    "Do you offer refunds?",
    "Please see our Refund and Cancellation Policy for details on cancelling and refunds.",
  ],
];

// ───────────── About ─────────────
export const ABOUT_ICONS = [
  ["bill", "Billing"],
  ["calendar", "Appointments"],
  ["users", "Clients"],
  ["stock", "Inventory"],
  ["staff", "Staff"],
  ["chart", "Reports"],
  ["branch", "Multi-branch"],
];
export const VALUES = [
  [
    "bulb",
    "Innovation",
    "We embrace new technologies and creative ideas to build better solutions.",
  ],
  [
    "award",
    "Quality",
    "We focus on delivering reliable, scalable and high-quality software.",
  ],
  [
    "users",
    "Collaboration",
    "We believe in working together with our clients as a team.",
  ],
  [
    "shield",
    "Integrity",
    "We maintain transparency, honesty and a strong commitment to our clients.",
  ],
];
export const ABOUT_PRODUCT_POINTS = [
  "Easy billing with GST support",
  "Appointment and queue management",
  "Customer CRM and membership programs",
  "Inventory and stock management",
  "Staff and commission management",
  "Detailed reports and profit/loss",
  "Multi-branch support",
  "Simple and modern interface",
];
export const APPROACH = [
  [
    "chat",
    "Understand",
    "We learn about your business challenges and requirements.",
  ],
  ["bill", "Plan", "We plan the right solution with the best approach."],
  [
    "code",
    "Design & Develop",
    "We design and develop a reliable and user-friendly solution.",
  ],
  [
    "rocket",
    "Test, Deploy & Support",
    "We test thoroughly, deploy the solution and provide ongoing support.",
  ],
];

// ───────────── Products ─────────────
export const INDUSTRIES = [
  { id: "all", label: "All Products", icon: null },
  { id: "automotive", label: "Automotive", icon: "car" },
  { id: "education", label: "Education", icon: "grad" },
  { id: "restaurant", label: "Restaurant & Hospitality", icon: "fork" },
  { id: "retail", label: "Retail", icon: "cart" },
  { id: "custom", label: "Custom Solutions", icon: "gear" },
];

/** `url`: the product's own website (opens in a new tab). If left empty, "Visit Website" opens the contact form for that product instead. */
export const PRODUCTS = [
  {
    id: "motor-desk",
    name: "The Motor Desk",
    industry: "automotive",
    industryLabel: "Automotive",
    icon: "car",
    img: "productMotorDesk",
    url: "https://themotordesk.com/",
    subtitle: "Garage & Workshop Management Software",
    purpose: "Garage and workshop management software",
    body: "A complete garage and workshop management system to efficiently manage vehicle service operations, customers, invoicing, inventory and more.",
    points: [
      "Service scheduling & job cards",
      "Customer management",
      "Spare parts inventory",
      "Invoicing and billing",
      "Service history & reminders",
      "Reports and business insights",
    ],
  },
  {
    id: "motor-konnect",
    name: "Motor Konnect",
    industry: "automotive",
    industryLabel: "Automotive",
    icon: "car",
    img: "productMotorKonnect",
    url: "https://www.motorkonnect.com/",
    subtitle: "Automotive Service Platform",
    purpose:
      "Automotive service platform connecting vehicle owners with trusted garages",
    body: "A platform that connects vehicle owners with trusted garages and service providers. Simplifies vehicle service booking and helps users find reliable workshops.",
    points: [
      "Find nearby service centers",
      "Vehicle service booking",
      "Multiple service categories",
      "Service tracking",
      "Trusted workshops",
      "Easy and convenient experience",
    ],
  },
  {
    id: "education-erp",
    name: "Abacco Education ERP",
    industry: "education",
    industryLabel: "Education",
    icon: "grad",
    img: "productEducationErp",
    url: "https://eduabaccotech.com/",
    subtitle: "School & Educational Institution Management",
    purpose: "School and educational institution management system",
    body: "A comprehensive education management system to manage academic and administrative operations for schools and educational institutions.",
    points: [
      "Student information management",
      "Attendance and exams",
      "Fee collection and accounting",
      "Timetable and class management",
      "Staff and HR management",
      "Reports and analytics",
    ],
  },
  {
    id: "restaurant-billing",
    name: "Restaurant Billing",
    industry: "restaurant",
    industryLabel: "Restaurant & Hospitality",
    icon: "fork",
    img: "productRestaurant",
    url: "https://www.restaurantsbilling.com/",
    subtitle: "Restaurant & Hospitality Management",
    purpose: "Restaurant billing and management software",
    body: "An easy-to-use restaurant billing software to manage billing, orders, tables and daily operations for restaurants, cafes and food businesses.",
    points: [
      "Table and order management",
      "Kitchen order printing (KOT)",
      "Menu and item management",
      "Billing and payments",
      "Daily reports and sales",
      "Multiple user roles",
    ],
  },
  {
    id: "super-market-billing",
    name: "Super Market Billing",
    industry: "retail",
    industryLabel: "Retail",
    icon: "cart",
    img: "productSupermarket",
    url: "https://www.supermarketbilling.com/",
    subtitle: "Retail & Supermarket Management",
    purpose: "Retail and supermarket billing and inventory management",
    body: "A complete billing and inventory management solution for supermarkets, grocery stores and retail businesses.",
    points: [
      "Fast and easy billing (POS)",
      "Product and inventory management",
      "Barcode and SKU support",
      "Supplier management",
      "Multi-user and roles",
      "Reports and stock analytics",
    ],
  },
];

export const CUSTOM_SOLUTION_CHIPS = [
  ["crm", "CRM Systems"],
  ["erp", "ERP Applications"],
  ["gear", "Workflow Automation"],
  ["chart", "Custom Dashboards"],
];

// ───────────── Contact ─────────────
export const CONTACT_PERKS = [
  ["clock", "Quick Response"],
  ["calendar", "Expert Consultation"],
  ["gear", "Tailored Solutions"],
];
export const INTEREST_OPTIONS = [
  "Salora Glam (Salon & Spa)",
  "The Motor Desk",
  "Motor Konnect",
  "Abacco Education ERP",
  "Restaurant Billing",
  "Super Market Billing",
  "Custom Solution",
  "Other",
];
export const BUDGET_OPTIONS = [
  "Below ₹50,000",
  "₹50,000 - ₹2,00,000",
  "₹2,00,000 - ₹5,00,000",
  "Above ₹5,00,000",
  "Not sure yet",
];
export const CONTACT_PRODUCTS = [
  ["car", "The Motor Desk"],
  ["car", "Motor Konnect"],
  ["grad", "Education ERP"],
  ["fork", "Restaurant Billing"],
  ["cart", "Super Market Billing"],
  ["box", "Custom Solutions"],
];
export const CONTACT_FAQ = [
  [
    "How can I request a demo of Salora Glam?",
    "Send us a message using the form on this page and choose “Salora Glam” — our team will get in touch to arrange a demo. You can also start the 14-day free trial straight away.",
  ],
  [
    "Which plan is right for my salon or spa?",
    "Starter suits a single salon, Professional adds staff commission and payroll for up to 5 branches, and Customize adds advanced reports, reminders and your own 5-page website and brand app. The Pricing page compares them side by side.",
  ],
  [
    "Do you provide support after purchase?",
    "Yes. Contact us by email or phone during business hours and our team will help you.",
  ],
  [
    "Can I customize Salora Glam for my business?",
    "Services, prices, tax rates, receipts, roles and permissions are all set by you. For larger changes, tell us what you need and we’ll discuss it.",
  ],
  [
    "How long does it take to get started?",
    "Most salons add their services and staff and start billing in an afternoon.",
  ],
  [
    "Do you offer training for my staff?",
    "Ask us when you get in touch and we’ll discuss onboarding and training options for your team.",
  ],
  [
    "Can I upgrade my plan later?",
    "Yes, you can change your plan from the Subscription page whenever you need to.",
  ],
];
