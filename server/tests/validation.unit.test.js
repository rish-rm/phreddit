import test from "node:test";
import assert from "node:assert/strict";
import {
  validateEmail,
  passwordContainsForbiddenValue,
  validateRegistrationInput,
  requireNonEmptyString
} from "../utils/validation.js";

test("validateEmail accepts valid email addresses", () => {
  assert.equal(validateEmail("student@example.com"), true);
});

test("validateEmail rejects invalid email addresses", () => {
  assert.equal(validateEmail("studentexample.com"), false);
  assert.equal(validateEmail("student@"), false);
  assert.equal(validateEmail(""), false);
});

test("passwordContainsForbiddenValue rejects first name, last name, display name, and email id", () => {
  const userFields = {
    firstName: "Avery",
    lastName: "Stone",
    displayName: "averystone",
    email: "avery@example.com"
  };

  assert.equal(passwordContainsForbiddenValue("abcAvery123", userFields), true);
  assert.equal(passwordContainsForbiddenValue("abcStone123", userFields), true);
  assert.equal(passwordContainsForbiddenValue("abcaverystone123", userFields), true);
  assert.equal(passwordContainsForbiddenValue("abcavery123", userFields), true);
  assert.equal(passwordContainsForbiddenValue("SafePassword123!", userFields), false);
});

test("validateRegistrationInput returns all important registration validation errors", () => {
  const result = validateRegistrationInput({
    firstName: "Ava",
    lastName: "Stone",
    displayName: "avastone",
    email: "bad-email",
    password: "Ava123",
    confirmPassword: "Different123"
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 2);
});

test("requireNonEmptyString reports client input errors as bad requests", () => {
  assert.equal(requireNonEmptyString("  hello  ", "Greeting"), "hello");

  assert.throws(
    () => requireNonEmptyString("  ", "Greeting"),
    (error) => error.message === "Greeting is required." && error.status === 400
  );
});
