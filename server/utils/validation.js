export const PASSWORD_MIN_LENGTH = 8;

export function validateEmail(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function emailIdPart(email) {
  if (typeof email !== "string") return "";
  return email.split("@")[0].toLowerCase();
}

export function passwordContainsForbiddenValue(password, userFields) {
  if (typeof password !== "string") return true;

  const normalizedPassword = password.toLowerCase();

  const forbiddenValues = [
    userFields?.firstName,
    userFields?.lastName,
    userFields?.displayName,
    emailIdPart(userFields?.email || "")
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())
    .filter((value) => value.length > 0);

  return forbiddenValues.some((value) => normalizedPassword.includes(value));
}

export function validateRegistrationInput(input) {
  const errors = [];

  if (!input?.firstName?.trim()) {
    errors.push("First name is required.");
  }
  if (!input?.lastName?.trim()) {
    errors.push("Last name is required.");
  }
  if (!input?.displayName?.trim()) {
    errors.push("Display name is required.");
  }
  if (!validateEmail(input?.email)) {
    errors.push("A valid email address is required.");
  }
  if (!input?.password) {
    errors.push("Password is required.");
  } else if (input.password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (input?.password !== input?.confirmPassword) {
    errors.push("Passwords must match.");
  }

  if (
    input?.password &&
    passwordContainsForbiddenValue(input.password, {
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName,
      email: input.email
    })
  ) {
    errors.push("Password cannot contain your first name, last name, display name, or email id.");
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    const error = new Error(`${fieldName} is required.`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}
