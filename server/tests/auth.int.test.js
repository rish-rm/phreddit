import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import { createApp } from "../server.js";
import {
  clearTestDb,
  connectTestDb,
  disconnectTestDb
} from "./testHelpers.js";

test("register, login, me, and logout use session cookies", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const app = createApp({ useSessionStore: false });
  const agent = supertest.agent(app);
  const credentials = {
    firstName: "Olive",
    lastName: "River",
    displayName: "oliveboard",
    email: "olive@example.com",
    password: "StrongPass123!",
    confirmPassword: "StrongPass123!"
  };

  const registerResponse = await agent.post("/api/auth/register").send(credentials);
  assert.equal(registerResponse.status, 201);

  const loggedOutMeResponse = await agent.get("/api/auth/me");
  assert.equal(loggedOutMeResponse.status, 200);
  assert.equal(loggedOutMeResponse.body.user, null);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: credentials.email,
    password: credentials.password
  });
  assert.equal(loginResponse.status, 200);
  assert.equal(loginResponse.body.user.email, credentials.email);

  const loggedInMeResponse = await agent.get("/api/auth/me");
  assert.equal(loggedInMeResponse.status, 200);
  assert.equal(loggedInMeResponse.body.user.displayName, credentials.displayName);

  const logoutResponse = await agent.post("/api/auth/logout");
  assert.equal(logoutResponse.status, 200);

  const loggedOutAgainResponse = await agent.get("/api/auth/me");
  assert.equal(loggedOutAgainResponse.status, 200);
  assert.equal(loggedOutAgainResponse.body.user, null);
});

test("register rejects weak short passwords", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const app = createApp({ useSessionStore: false });
  const response = await supertest(app)
    .post("/api/auth/register")
    .send({
      firstName: "Short",
      lastName: "Password",
      displayName: "shortpassword",
      email: "short@example.com",
      password: "S7!pass",
      confirmPassword: "S7!pass"
    });

  assert.equal(response.status, 400);
  assert.ok(response.body.errors.includes("Password must be at least 8 characters."));
});
