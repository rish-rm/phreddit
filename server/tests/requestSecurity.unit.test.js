import test from "node:test";
import assert from "node:assert/strict";
import { createTrustedOriginGuard } from "../middleware/requestSecurity.js";

function makeRequest(method, origin = null) {
  return {
    method,
    protocol: "https",
    get(name) {
      if (name === "origin") return origin;
      if (name === "host") return "api.example.com";
      return undefined;
    }
  };
}

function makeResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test("trusted origin guard allows safe requests and configured browser origins", () => {
  const guard = createTrustedOriginGuard({
    allowedOrigins: new Set(["https://client.example.com"]),
    enforce: true
  });
  let nextCalls = 0;

  guard(makeRequest("GET"), makeResponse(), () => { nextCalls += 1; });
  guard(
    makeRequest("POST", "https://client.example.com"),
    makeResponse(),
    () => { nextCalls += 1; }
  );
  guard(
    makeRequest("DELETE", "https://api.example.com"),
    makeResponse(),
    () => { nextCalls += 1; }
  );

  assert.equal(nextCalls, 3);
});

test("trusted origin guard rejects unsafe requests without an allowed origin", () => {
  const guard = createTrustedOriginGuard({
    allowedOrigins: new Set(["https://client.example.com"]),
    enforce: true
  });

  for (const origin of [null, "https://malicious.example"]) {
    const response = makeResponse();
    guard(makeRequest("POST", origin), response, () => {
      assert.fail("Untrusted request should not continue.");
    });
    assert.equal(response.statusCode, 403);
    assert.equal(response.body.error, "Request origin is not allowed.");
  }
});
