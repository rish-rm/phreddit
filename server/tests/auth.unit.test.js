import test from "node:test";
import assert from "node:assert/strict";
import { allowsTestAuthHeader } from "../middleware/auth.js";

test("test auth header is disabled outside test or explicit opt-in environments", () => {
  assert.equal(allowsTestAuthHeader({ NODE_ENV: "production" }), false);
  assert.equal(allowsTestAuthHeader({ NODE_ENV: "development" }), false);
  assert.equal(allowsTestAuthHeader({}), false);
});

test("test auth header can be enabled for tests and trusted local harnesses", () => {
  assert.equal(allowsTestAuthHeader({ NODE_ENV: "test" }), true);
  assert.equal(allowsTestAuthHeader({ ENABLE_TEST_AUTH_HEADER: "true" }), true);
});
