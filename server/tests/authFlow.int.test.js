import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import { createApp } from "../server.js";
import {
  clearTestDb,
  connectTestDb,
  disconnectTestDb
} from "./testHelpers.js";

test("register auto-logs-in, sessions persist, logout clears, login validates", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const app = createApp({ useSessionStore: false });
  const agent = supertest.agent(app);
  const stamp = Date.now();
  const email = `flow${stamp}@example.com`;
  const password = "SafePassword123!";

  const shortPassword = await agent.post("/api/auth/register").send({
    firstName: "Flow",
    lastName: "Tester",
    email,
    displayName: `flowuser${stamp}`,
    password: "Zx1!",
    confirmPassword: "Zx1!"
  });
  assert.equal(shortPassword.status, 400);
  assert.ok(
    shortPassword.body.errors.some((message) => message.includes("at least 8 characters"))
  );

  const registered = await agent.post("/api/auth/register").send({
    firstName: "Flow",
    lastName: "Tester",
    email,
    displayName: `flowuser${stamp}`,
    password,
    confirmPassword: password
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.body.user.email, email);
  assert.equal(registered.body.user.passwordHash, undefined);

  // Registration should have started a session (auto-login).
  const meAfterRegister = await agent.get("/api/auth/me");
  assert.equal(meAfterRegister.status, 200);
  assert.equal(meAfterRegister.body.user.email, email);

  const loggedOut = await agent.post("/api/auth/logout");
  assert.equal(loggedOut.status, 200);

  const meAfterLogout = await agent.get("/api/auth/me");
  assert.equal(meAfterLogout.body.user, null);

  const badLogin = await agent.post("/api/auth/login").send({
    email,
    password: "WrongPassword123!"
  });
  assert.equal(badLogin.status, 401);

  const goodLogin = await agent.post("/api/auth/login").send({ email, password });
  assert.equal(goodLogin.status, 200);

  const meAfterLogin = await agent.get("/api/auth/me");
  assert.equal(meAfterLogin.body.user.email, email);
});
