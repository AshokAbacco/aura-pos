/**
 * Legal pages of the website (/terms, /refunds, /privacy). Edit the words here; LegalPage.jsx lays them out.
 *
 * Each document: { title, updated, intro: [blocks], sections: [{ id, heading, body: [blocks] }] }
 * A block is a paragraph (string), a bullet list ({ list: [...] }), a sub-heading ({ h: '...' }),
 * or a highlighted note ({ note: '...' }).
 *
 * Have a qualified lawyer review any change before publishing it.
 */

export const LEGAL_CONTACT = {
  company: "Abacco Technology",
  platform: "SALORA GLAM",
  address:
    "No 12, 13 & 12/A, Kirthan Arcade, 3rd Floor, Aditya Nagar, Sandeep Unnikrishnan Road, Bangalore - 560097",
  email: "support@saloraglam.com",
};

const contactBlocks = [
  {
    list: [
      `Company name: ${LEGAL_CONTACT.company}`,
      `Platform: ${LEGAL_CONTACT.platform}`,
      `Address: ${LEGAL_CONTACT.address}`,
      `Email: ${LEGAL_CONTACT.email}`,
    ],
  },
];

/** Shared by the Terms and the Refund policy, so the two always say the same thing. */
const salonServicePayments = [
  "Customers pay salons directly for services booked through SALORA GLAM.",
  "SALORA GLAM does not collect, hold or process payments for salon services. Therefore:",
  {
    list: [
      "Any refund for a salon service must be requested directly from the respective salon.",
      "The salon is responsible for its cancellation, refund and service-related policies.",
      "Customers should confirm the salon’s cancellation and refund conditions before making a booking.",
      "If a salon cancels a confirmed appointment, the customer should contact the salon to arrange an alternative appointment or any applicable refund.",
      "SALORA GLAM may assist in communicating booking-related complaints to the salon.",
    ],
  },
  "This policy does not affect any consumer rights available under applicable law.",
];

// ───────────────────────────── Terms and Conditions ─────────────────────────────
export const TERMS = {
  title: "Salon Partner Terms and Conditions",
  short: "Terms & Conditions",
  updated: "11 November 2026",
  hero: {
    titleLines: ["Terms &", "Conditions"],
    summary:
      "The rules for salon owners, spas and beauty businesses that register and use SALORA GLAM — written to be clear and fair.",
    audience: "Salon Partners",
    highlights: [
      [
        "rupee",
        "Fixed subscription",
        "No commission on your appointments or services.",
      ],
      ["wallet", "Your revenue is yours", "Customers pay your salon directly."],
      [
        "shield",
        "Your data, protected",
        "Customer records stay private to your salon.",
      ],
      [
        "refresh",
        "Export anytime",
        "Request your business records when you need them.",
      ],
    ],
  },
  intro: [
    "These Terms and Conditions govern the registration and use of SALORA GLAM by salon owners, beauty parlours, spas and other beauty and grooming service providers (“Salon Partners”).",
    "By registering or using SALORA GLAM’s salon management platform, you agree to these Terms and Conditions.",
  ],
  sections: [
    {
      id: "about",
      heading: "About SALORA GLAM",
      body: [
        "SALORA GLAM is a technology platform that enables salon businesses to:",
        {
          list: [
            "Create and manage their salon profiles.",
            "Display services, prices and availability.",
            "Receive and manage customer appointments.",
            "Manage customer records and booking history.",
            "Manage employees, staff schedules and attendance.",
            "Generate bills and invoices.",
            "Track business performance and reports.",
            "Access subscription-based salon management features.",
          ],
        },
        "SALORA GLAM may also provide a customer-facing application through which customers can discover salons and book appointments.",
      ],
    },
    {
      id: "registration",
      heading: "Salon Registration",
      body: [
        "To register as a Salon Partner, you must:",
        {
          list: [
            "Provide accurate salon and business information.",
            "Provide a valid mobile number and email address.",
            "Submit business verification documents when requested.",
            "Provide correct service descriptions and pricing.",
            "Maintain updated business hours and appointment availability.",
            "Have the legal authority to operate the salon.",
          ],
        },
        "SALORA GLAM reserves the right to verify registration details and reject or suspend registrations containing false or misleading information.",
      ],
    },
    {
      id: "responsibilities",
      heading: "Salon Partner Responsibilities",
      body: [
        "Salon Partners are responsible for:",
        {
          list: [
            "Delivering services professionally and safely.",
            "Maintaining appropriate hygiene and cleanliness standards.",
            "Employing qualified and appropriately trained staff.",
            "Providing accurate service information and prices.",
            "Honouring confirmed customer appointments.",
            "Communicating cancellations or schedule changes promptly.",
            "Obtaining necessary licences, registrations and permissions.",
            "Complying with applicable consumer protection, tax, employment and other laws.",
          ],
        },
        "SALORA GLAM does not directly provide salon or beauty services unless expressly agreed otherwise.",
      ],
    },
    {
      id: "appointments",
      heading: "Appointment Management",
      body: [
        "Salon Partners agree to:",
        {
          list: [
            "Accept or reject appointment requests promptly.",
            "Maintain accurate availability.",
            "Avoid accepting overlapping appointments.",
            "Notify customers about delays or cancellations.",
            "Honour confirmed bookings wherever reasonably possible.",
            "Inform customers before making changes to booked services or prices.",
          ],
        },
        "Repeated failure to honour confirmed bookings may result in account restrictions.",
      ],
    },
    {
      id: "billing",
      heading: "Billing and Payment Management",
      body: [
        "SALORA GLAM may provide digital billing, invoice generation and payment tracking features.",
        "Salon Partners are responsible for:",
        {
          list: [
            "Entering accurate service and product prices.",
            "Generating accurate bills and invoices.",
            "Maintaining appropriate financial records.",
            "Complying with applicable GST and taxation requirements.",
            "Issuing refunds to customers where required.",
            "Resolving billing disputes relating to their services.",
          ],
        },
        "SALORA GLAM is a software platform and does not independently guarantee the accuracy of financial information entered by salon users.",
      ],
    },
    {
      id: "fees",
      heading: "Subscription Fees and Business Model",
      body: [
        "SALORA GLAM operates on a fixed subscription-fee model for Salon Partners.",
        {
          list: [
            "Salon Partners pay a fixed subscription fee to access the selected software plan.",
            "Subscription fees may be charged monthly or annually, depending on the selected plan.",
            "SALORA GLAM does not charge commission on individual customer appointments or salon service transactions.",
            "Customers pay salon service charges directly to the respective salon.",
            "Salon Partners are responsible for collecting payments, issuing receipts and handling customer refunds for services.",
            "SALORA GLAM subscription fees are separate from all revenue earned by the salon.",
          ],
        },
        "Any additional paid features or services will be communicated separately before purchase.",
        { h: "Subscription plans" },
        {
          list: [
            "Available plans and their prices will be displayed before purchase.",
            "Subscription periods and included features will be clearly communicated.",
            "Payments must be completed through the available payment methods.",
            "Subscription renewals, if applicable, will follow the terms disclosed during purchase.",
            "Changes to subscription plans or pricing will be communicated to affected partners in advance, where required.",
            "Access to paid features may be restricted if payment is not received.",
          ],
        },
        "Refunds of subscription fees are covered by our Subscription and Refund Policy.",
      ],
    },
    {
      id: "salon-payments",
      heading: "Payments and Refunds for Salon Services",
      body: salonServicePayments,
    },
    {
      id: "privacy",
      heading: "Customer Information and Privacy",
      body: [
        "Salon Partners may receive customer information necessary to manage appointments and provide services.",
        "Salon Partners agree to:",
        {
          list: [
            "Use customer information only for legitimate salon-related purposes.",
            "Keep customer information confidential.",
            "Avoid selling, sharing or misusing customer information.",
            "Protect customer records from unauthorised access.",
            "Honour customer privacy requests and applicable legal requirements.",
            "Avoid using customer details for unrelated promotional campaigns without the required consent.",
          ],
        },
        "SALORA GLAM and Salon Partners must comply with their respective obligations under applicable data-protection laws. How SALORA GLAM handles personal data is described in our Privacy Policy.",
      ],
    },
    {
      id: "staff",
      heading: "Staff Management",
      body: [
        "SALORA GLAM may provide features to manage staff profiles, roles, schedules, attendance and performance.",
        "Salon Partners are responsible for:",
        {
          list: [
            "Obtaining appropriate staff permissions and information.",
            "Maintaining accurate staff records.",
            "Assigning suitable access permissions.",
            "Removing access when an employee leaves the business.",
            "Ensuring staff members use the platform appropriately.",
          ],
        },
      ],
    },
    {
      id: "availability",
      heading: "Platform Availability and Support",
      body: [
        "SALORA GLAM will make reasonable efforts to maintain platform availability and provide technical support.",
        "Temporary interruptions may occur due to maintenance, internet connectivity, server issues, security updates or circumstances beyond our reasonable control.",
      ],
    },
    {
      id: "ip",
      heading: "Intellectual Property",
      body: [
        "The SALORA GLAM name, logo, application, software, design, features and related materials are owned by or licensed to SALORA GLAM.",
        "Salon Partners may not copy, modify, distribute, reverse engineer or commercially exploit the platform without written permission.",
        "Salon Partners retain ownership of their own business names, logos, photographs and other content they upload, while granting SALORA GLAM permission to display and use that content to operate and promote the platform as authorised.",
      ],
    },
    {
      id: "prohibited",
      heading: "Prohibited Activities",
      body: [
        "Salon Partners must not:",
        {
          list: [
            "Create fake appointments or customer accounts.",
            "Upload misleading salon information.",
            "Misuse customer information.",
            "Manipulate ratings or reviews.",
            "Use the platform for unlawful activities.",
            "Attempt to access another salon’s account.",
            "Distribute harmful software or content.",
            "Misrepresent SALORA GLAM or its services.",
          ],
        },
      ],
    },
    {
      id: "suspension",
      heading: "Account Suspension and Termination",
      body: [
        "SALORA GLAM may suspend or terminate a Salon Partner account in cases involving:",
        {
          list: [
            "Fraudulent registration or payment activity.",
            "Serious violations of these Terms.",
            "Misuse of customer information.",
            "Repeated customer complaints involving misconduct.",
            "Unlawful activity.",
            "Unpaid subscription fees after applicable notice.",
          ],
        },
        "Where reasonably possible, we will notify the Salon Partner and provide an opportunity to resolve the issue.",
      ],
    },
    {
      id: "export",
      heading: "Data Export and Account Closure",
      body: [
        "Salon Partners may request access to or export of eligible business records, subject to technical availability, identity verification and applicable law.",
        "Upon account closure, data will be retained or deleted in accordance with our Privacy Policy, contractual obligations and applicable legal requirements.",
      ],
    },
    {
      id: "liability",
      heading: "Limitation of Liability",
      body: [
        "SALORA GLAM provides software and technology services. Salon Partners remain responsible for their business operations, employees, service quality, customer interactions, pricing and legal compliance.",
        "Nothing in these Terms excludes liability or consumer rights that cannot legally be excluded under applicable law.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to Terms",
      body: [
        "SALORA GLAM may update these Terms from time to time. Material changes will be communicated through the app, website or registered contact details where appropriate.",
      ],
    },
    {
      id: "law",
      heading: "Governing Law",
      body: [
        "These Terms are governed by the laws of India. Courts having appropriate jurisdiction in Bangalore, Karnataka shall have jurisdiction, subject to applicable law.",
      ],
    },
    { id: "contact", heading: "Contact Information", body: contactBlocks },
  ],
};

// ───────────────────────────── Subscription and Refund Policy ─────────────────────────────
export const REFUNDS = {
  title: "Subscription and Refund Policy",
  short: "Subscription & Refunds",
  updated: "11 November 2026",
  hero: {
    titleLines: ["Subscription &", "Refund Policy"],
    summary:
      "How plans, renewals, cancellations and refunds work for your SALORA GLAM subscription — and who to contact about a salon service.",
    audience: "Salon Partners",
    highlights: [
      [
        "card",
        "Pay for the plan only",
        "A fixed monthly or annual fee, shown before you buy.",
      ],
      [
        "clock",
        "Cancel anytime",
        "Access continues until the end of the paid period.",
      ],
      [
        "refresh",
        "Fair refunds",
        "Duplicate or wrong charges are always refunded.",
      ],
      [
        "store",
        "Salon services",
        "Refunds for services are handled by the salon.",
      ],
    ],
  },
  intro: [
    "This policy applies to paid subscriptions and software services purchased by salon owners and business partners through SALORA GLAM.",
    "It also explains how payments and refunds for salon services work. SALORA GLAM does not charge commission on salon services; customers pay the salon directly.",
  ],
  sections: [
    {
      id: "plans",
      heading: "Subscription Plans",
      body: [
        "SALORA GLAM may offer different subscription plans, including free trials, monthly plans, quarterly plans and annual plans.",
        "Each plan may include different features, such as:",
        {
          list: [
            "Salon profile management.",
            "Appointment and booking management.",
            "Billing and invoice generation.",
            "Customer management.",
            "Staff management.",
            "Sales and business reports.",
            "Promotional and customer communication tools.",
            "Additional premium features.",
          ],
        },
        "The features, subscription duration and applicable price will be displayed before purchase.",
      ],
    },
    {
      id: "fees",
      heading: "Subscription Fees and Business Model",
      body: [
        "SALORA GLAM operates on a fixed subscription-fee model. Salon Partners pay a fixed fee, monthly or annually depending on the selected plan, to access the selected software plan.",
        {
          list: [
            "SALORA GLAM does not charge commission on individual customer appointments or salon service transactions.",
            "Subscription fees are separate from all revenue earned by the salon.",
            "Any additional paid features or services will be communicated separately before purchase.",
          ],
        },
      ],
    },
    {
      id: "activation",
      heading: "Subscription Activation",
      body: [
        {
          list: [
            "Subscription access will generally be activated after successful payment confirmation.",
            "Activation may be delayed due to payment gateway or technical issues.",
            "Salon Partners should contact support if payment is successful but subscription access is not activated.",
            "The subscription validity period will be communicated in the app or purchase confirmation.",
          ],
        },
      ],
    },
    {
      id: "renewal",
      heading: "Automatic Renewal",
      body: [
        "If automatic renewal is offered:",
        {
          list: [
            "The renewal frequency and amount will be disclosed before activation.",
            "The Salon Partner must authorise recurring payments.",
            "Renewal reminders will be provided where required.",
            "Salon Partners may disable automatic renewal through the available settings or by contacting support.",
            "Disabling renewal will generally prevent the next subscription charge but will not automatically refund the current subscription.",
          ],
        },
      ],
    },
    {
      id: "cancellation",
      heading: "Cancellation of Subscription",
      body: [
        "Salon Partners may request subscription cancellation at any time through the available account settings or customer support.",
        "Unless otherwise stated:",
        {
          list: [
            "Cancellation stops future renewals.",
            "Existing paid access continues until the end of the current subscription period.",
            "Cancellation does not automatically qualify the user for a refund.",
          ],
        },
      ],
    },
    {
      id: "eligibility",
      heading: "Refund Eligibility",
      body: [
        "Refund requests will be reviewed under the following circumstances:",
        { h: "A. Duplicate payment" },
        "If a Salon Partner is charged more than once for the same subscription, the confirmed duplicate payment will be refunded.",
        { h: "B. Payment successful but subscription not activated" },
        "If payment is successfully deducted but subscription access is not activated, SALORA GLAM will investigate and provide access or arrange an eligible refund.",
        { h: "C. Technical issues" },
        "If a major technical issue prevents access to paid subscription features and cannot reasonably be resolved, an appropriate refund or alternative remedy may be considered.",
        { h: "D. Incorrect subscription charge" },
        "If a confirmed billing error results in an incorrect charge, the excess amount will be refunded.",
        { h: "E. Other valid requests" },
        "Other refund requests will be reviewed individually, considering the services provided, the circumstances and applicable law.",
      ],
    },
    {
      id: "non-refundable",
      heading: "Non-Refundable Situations",
      body: [
        "Subject to applicable law and statutory rights, refunds may generally not be available for:",
        {
          list: [
            "Subscription periods already fully or partially used.",
            "Change of mind after successful activation.",
            "Failure to use the platform during the subscription period.",
            "Failure to cancel an authorised automatic renewal before the renewal date.",
            "Suspension resulting from serious violations of the Terms and Conditions.",
          ],
        },
        "This section does not remove any refund rights available under applicable law.",
      ],
    },
    {
      id: "processing",
      heading: "Refund Processing",
      body: [
        "Once a refund is approved:",
        {
          list: [
            "The refund will generally be initiated through the original payment method.",
            "Processing time depends on the payment gateway, bank or financial institution.",
            "The Salon Partner may receive a refund reference or transaction confirmation.",
            "Any applicable payment-provider procedures will be followed.",
          ],
        },
      ],
    },
    {
      id: "trials",
      heading: "Free Trials and Promotional Offers",
      body: [
        {
          list: [
            "Free trials may be offered for a limited period.",
            "Trial duration and included features will be disclosed before activation.",
            "A free trial does not guarantee a permanent free subscription.",
            "Any conversion from a free trial to a paid subscription must be clearly disclosed and authorised.",
            "Promotional offers may have additional eligibility and validity conditions.",
          ],
        },
      ],
    },
    {
      id: "plan-changes",
      heading: "Subscription Plan Upgrades and Downgrades",
      body: [
        "Salon Partners may be allowed to upgrade or downgrade their subscription plans.",
        "The applicable price difference, feature access and effective date will be communicated before the change is confirmed.",
        "Any credit, adjustment or refund arising from a plan change will be handled according to the terms disclosed during the transaction and applicable law.",
      ],
    },
    {
      id: "salon-payments",
      heading: "Payments and Refunds for Salon Services",
      body: salonServicePayments,
    },
    {
      id: "request",
      heading: "How to Request a Refund",
      body: [
        "Please contact SALORA GLAM support with:",
        {
          list: [
            "Salon or business name.",
            "Registered mobile number or email address.",
            "Subscription plan.",
            "Payment transaction ID.",
            "Date of payment.",
            "Reason for requesting the refund.",
          ],
        },
        `Email: ${LEGAL_CONTACT.email}`,
        {
          note: "This is for SALORA GLAM subscription fees only. For a refund of a salon service, please contact the salon directly.",
        },
      ],
    },
    {
      id: "updates",
      heading: "Policy Updates",
      body: [
        "SALORA GLAM may update this policy from time to time. The applicable policy and subscription terms will be communicated to Salon Partners, subject to applicable law.",
      ],
    },
    { id: "contact", heading: "Contact Information", body: contactBlocks },
  ],
};

// ───────────────────────────── Privacy Policy ─────────────────────────────
// Describes what this software actually stores and who it shares data with. If you add an
// analytics tool, a new provider (SMS, WhatsApp) or change hosting, update this page too.
export const PRIVACY = {
  title: "Privacy Policy",
  short: "Privacy Policy",
  updated: "11 November 2026",
  hero: {
    titleLines: ["Privacy", "Policy"],
    summary:
      "What information SALORA GLAM keeps, why we keep it, who can see it, and the choices you have.",
    audience: "Salons, staff, customers & visitors",
    highlights: [
      [
        "lock",
        "Never sold",
        "We do not sell personal data or use your clients for our marketing.",
      ],
      [
        "shield",
        "Kept separate",
        "One salon can never see another salon’s data.",
      ],
      [
        "card",
        "No card details",
        "Payments are handled by Razorpay; we never see your card.",
      ],
      [
        "user",
        "Your rights",
        "Access, correct or erase your data under Indian law.",
      ],
    ],
  },
  intro: [
    "This Privacy Policy explains how Abacco Technology (“we”, “us”), which operates SALORA GLAM, collects, uses, shares and protects personal data when you use the SALORA GLAM website, web application and mobile apps (the “Platform”).",
    "It applies to salon owners and their staff who use the Platform (“Salon Partners”), to visitors of our website, and to the salon customers and employees whose details Salon Partners record on the Platform.",
  ],
  sections: [
    {
      id: "roles",
      heading: "Our Role",
      body: [
        {
          list: [
            "For Salon Partner accounts, subscriptions, website enquiries and our own business records, we decide how the data is used and are responsible for it.",
            "For the customer and staff records a salon enters (for example client profiles, appointments, invoices and staff details), the salon decides why and how that data is collected. We process it on the salon’s behalf, only to provide the Platform to that salon.",
          ],
        },
        "If you are a customer of a salon and have questions about your records, please contact that salon first. We will help the salon respond to your request.",
      ],
    },
    {
      id: "collect",
      heading: "Information We Collect",
      body: [
        { h: "Salon Partner accounts" },
        {
          list: [
            "Name, email address, mobile number and role of each user.",
            "Password, stored only in a protected (hashed) form that we cannot read.",
            "Business details such as salon and branch names, address, GSTIN, phone number, UPI ID and receipt settings.",
            "The date and time you accepted our Terms and verified your email.",
          ],
        },
        { h: "Records salons keep on the Platform" },
        {
          list: [
            "Salon customers: name, phone, email, birthday, gender, visit and appointment history, invoices, wallet and membership details, preferences and notes.",
            "Where a salon chooses to record them: hair-colour formulas, allergies and patch-test results. These can relate to health, so access is limited to salon staff with the relevant permission.",
            "Whether the customer agreed to receive marketing or WhatsApp messages from the salon.",
            "Salon staff: name, contact details, address, role, branch, joining date, salary, attendance, commissions and payouts. For identity and payroll only masked details are stored (masked PAN, last 4 digits of Aadhaar and of the bank account, IFSC and bank name), not the full numbers.",
          ],
        },
        { h: "Subscription payments" },
        "Subscription payments are processed by Razorpay. We receive the order and payment reference, amount, status and plan. We do not receive or store card numbers, CVV, UPI PIN or net-banking passwords.",
        { h: "Website enquiries" },
        "When you use our contact form: your name, email, phone number, subject, message and your consent to be contacted.",
        { h: "Technical and security information" },
        {
          list: [
            "Sign-in sessions: browser or device type and a one-way (hashed) form of your IP address, used to keep you signed in and to detect misuse.",
            "An activity log of important actions (for example bills, refunds, voids, price overrides, wallet adjustments, settings and permission changes), recording who did what and when.",
          ],
        },
      ],
    },
    {
      id: "cookies",
      heading: "Cookies and Device Storage",
      body: [
        {
          list: [
            "The website uses one essential cookie to keep you signed in securely. It cannot be read by page scripts and is not used for advertising.",
            "The mobile apps keep your sign-in in the app’s private storage on your device until you sign out.",
            "We do not use advertising or tracking cookies.",
            "When you pay for a subscription, the payment page loads Razorpay’s checkout, which receives your IP address under Razorpay’s own privacy policy.",
          ],
        },
      ],
    },
    {
      id: "use",
      heading: "How We Use Information",
      body: [
        {
          list: [
            "To create and manage accounts and provide the Platform’s features.",
            "To process subscription payments, activate plans and send renewal, trial-ending and billing notices.",
            "To send service emails, such as invitations to join a salon team, password resets and low-stock alerts.",
            "To keep the Platform secure, prevent fraud and investigate misuse.",
            "To answer enquiries and provide support.",
            "To meet legal, tax and accounting obligations.",
            "To understand how the Platform is used in aggregate so we can improve it.",
          ],
        },
        "We do not sell personal data. We do not use salon customer records for our own marketing.",
      ],
    },
    {
      id: "sharing",
      heading: "Sharing of Information",
      body: [
        "We share personal data only as needed to run the Platform:",
        {
          list: [
            "Service providers who work for us under contract: cloud hosting and database providers, email delivery providers and Razorpay for payments.",
            "Within a salon: users of a salon account see the data their role and permissions allow, as set by the salon owner.",
            "Authorities, when required by law or to protect rights, safety and security.",
            "A buyer or successor, if our business is reorganised or transferred, subject to this policy.",
          ],
        },
        "Information about one salon is never shown to another salon.",
      ],
    },
    {
      id: "security",
      heading: "How We Protect Information",
      body: [
        {
          list: [
            "Encrypted connections (HTTPS) between your device and our servers.",
            "Passwords stored only in hashed form; sign-in tokens that expire and rotate.",
            "Each salon’s data is kept separate and checked on every request.",
            "Role-based permissions, and an activity log of sensitive actions.",
            "Regular backups of the database.",
          ],
        },
        "No system is completely secure. If a breach affects your personal data, we will notify you and the authorities as required by law.",
      ],
    },
    {
      id: "location",
      heading: "Where Data Is Stored",
      body: [
        "Data is stored with our hosting providers, whose servers may be in India or in other countries. Where data is stored outside India, we do so only as permitted by Indian law and with providers that protect it.",
      ],
    },
    {
      id: "retention",
      heading: "How Long We Keep Information",
      body: [
        {
          list: [
            "Account and business records are kept while the salon’s account is active.",
            "After an account is closed, data is deleted or anonymised within a reasonable period, except records we must keep by law.",
            "Invoices and financial records are kept for as long as tax and accounting laws require.",
            "A salon can anonymise a customer’s profile at the customer’s request; past invoices are kept without the customer’s identity where the law allows.",
            "Website enquiries are kept as long as needed to respond and follow up.",
          ],
        },
      ],
    },
    {
      id: "rights",
      heading: "Your Rights",
      body: [
        "Subject to applicable law, including the Digital Personal Data Protection Act, 2023, you may:",
        {
          list: [
            "Ask for a summary of the personal data we hold about you and how it is used.",
            "Ask us to correct, complete or update it.",
            "Ask us to erase it when it is no longer needed, unless we must keep it by law.",
            "Withdraw consent you have given, for example to marketing messages.",
            "Nominate another person to exercise your rights in case of death or incapacity.",
            "Raise a grievance with us, and if it is not resolved, with the Data Protection Board of India.",
          ],
        },
        "Salon customers and staff should first contact the salon that holds their records. Salon Partners and website visitors can contact us using the details below. We may need to verify your identity before acting on a request.",
      ],
    },
    {
      id: "children",
      heading: "Children",
      body: [
        "Salon Partner accounts are for adults only. If a salon records details of a customer under 18, the salon is responsible for obtaining the consent of a parent or guardian.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to This Policy",
      body: [
        "We may update this Privacy Policy from time to time. The date at the top shows the latest version. Material changes will be communicated through the app, website or registered contact details.",
      ],
    },
    {
      id: "contact",
      heading: "Contact and Grievances",
      body: [
        "For privacy questions, requests or grievances, please write to our Grievance Officer:",
        ...contactBlocks,
      ],
    },
  ],
};

export const LEGAL_DOCS = { terms: TERMS, refunds: REFUNDS, privacy: PRIVACY };
