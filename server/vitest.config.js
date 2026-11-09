import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Integration tests share one Postgres test database; run files serially.
    fileParallelism: false,
    globalSetup: ["./tests/helpers/global-setup.js"],
    testTimeout: 20000,
    // Test-only configuration. Razorpay calls go to an in-process stub (test/integration/helpers.js).
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ||
        "postgresql://aura:aura@localhost:5432/aura_test",
      JWT_ACCESS_SECRET: "integration-test-secret-integration-test-secret",
      CLIENT_ORIGIN: "http://localhost:5173",
      EXTRA_CORS_ORIGINS: "https://localhost",
      RAZORPAY_KEY_ID: "rzp_test_dummykey",
      RAZORPAY_KEY_SECRET: "rzp_test_dummy_secret",
      RAZORPAY_WEBHOOK_SECRET: "whsec_dummy_for_tests",
      RAZORPAY_API_BASE: "http://127.0.0.1:45991/v1",
      SMTP_URL: "",
    },
    hookTimeout: 60000,
  },
});
