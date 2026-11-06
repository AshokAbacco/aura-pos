-- New public pricing (Nov 2026): Starter ₹500, Professional ₹799, Customize ₹1,500 per month.
-- Data-only migration: updates existing databases. Plan codes stay the same so current
-- subscriptions keep pointing at their plan; the new price applies from their next payment.
-- Keep in step with the PLANS list in prisma/seed.js.

INSERT INTO "SubscriptionPlan" ("id", "code", "name", "description", "interval", "price", "currency", "trialDays", "graceDays", "maxStaff", "maxBranches", "features", "isActive", "isPublic", "sortOrder", "updatedAt")
VALUES
  (gen_random_uuid(), 'starter-monthly', 'Starter', 'Single-branch salon essentials.', 'MONTHLY', 500.00, 'INR', 0, 3, 5, 1,
   ARRAY['pos','appointments','inventory','reports','app_listing']::text[], true, true, 1, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'pro-monthly', 'Professional', 'Payroll, advanced reports and reminders.', 'MONTHLY', 799.00, 'INR', 0, 5, 15, 5,
   ARRAY['pos','appointments','inventory','payroll','reports','app_listing','multibranch']::text[], true, true, 2, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'business-monthly', 'Customize', '5-page website & own brand app.', 'MONTHLY', 1500.00, 'INR', 0, 7, 100, 10,
   ARRAY['pos','appointments','inventory','payroll','reports','reports.advanced','notifications','multibranch']::text[], true, true, 4, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name", "description" = EXCLUDED."description", "interval" = EXCLUDED."interval", "price" = EXCLUDED."price",
  "graceDays" = EXCLUDED."graceDays", "maxStaff" = EXCLUDED."maxStaff", "maxBranches" = EXCLUDED."maxBranches",
  "features" = EXCLUDED."features", "isActive" = true, "isPublic" = true, "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = CURRENT_TIMESTAMP;

-- The yearly Professional plan is no longer sold (existing annual subscriptions continue until they end).
UPDATE "SubscriptionPlan" SET "isActive" = false, "isPublic" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "code" = 'pro-annual';