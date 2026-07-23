import test from "node:test";
import assert from "node:assert/strict";
import { ensureConfiguredAdmin } from "../utils/adminBootstrap.js";

test("admin bootstrap is inert when ADMIN_EMAIL is not configured", async () => {
  let called = false;
  const result = await ensureConfiguredAdmin({
    adminEmail: "",
    userModel: {
      async updateOne() {
        called = true;
      }
    }
  });

  assert.deepEqual(result, { configured: false, reason: "not-configured" });
  assert.equal(called, false);
});

test("admin bootstrap rejects an invalid configured email", async () => {
  await assert.rejects(
    ensureConfiguredAdmin({ adminEmail: "not-an-email", userModel: {} }),
    /ADMIN_EMAIL must be a valid email address/
  );
});

test("admin bootstrap promotes an existing account and raises its reputation floor", async () => {
  let receivedFilter;
  let receivedUpdate;
  const result = await ensureConfiguredAdmin({
    adminEmail: "  Owner@Example.com ",
    userModel: {
      async updateOne(filter, update) {
        receivedFilter = filter;
        receivedUpdate = update;
        return { matchedCount: 1 };
      }
    }
  });

  assert.deepEqual(receivedFilter, { email: "owner@example.com" });
  assert.deepEqual(receivedUpdate, {
    $set: { isAdmin: true },
    $max: { reputation: 1000 }
  });
  assert.deepEqual(result, { configured: true });
});

test("admin bootstrap reports when the configured account does not exist", async () => {
  const result = await ensureConfiguredAdmin({
    adminEmail: "owner@example.com",
    userModel: {
      async updateOne() {
        return { matchedCount: 0 };
      }
    }
  });

  assert.deepEqual(result, { configured: false, reason: "not-found" });
});
