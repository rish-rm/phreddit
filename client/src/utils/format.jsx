export function displayNameOfUser(user) {
  if (!user) return "Unknown";
  if (typeof user === "string") return user;
  return user.displayName || user.email || "Unknown";
}

export function userIdOf(user) {
  if (!user) return null;
  if (typeof user === "string") return user;
  return user._id || null;
}

export function flairContentOf(linkFlair) {
  if (!linkFlair || typeof linkFlair === "string") return "";
  return linkFlair.content || "";
}

function plural(count, unit) {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

export function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffDay < 1) {
    if (diffMin < 1) return plural(Math.max(diffSec, 0), "second");
    if (diffHour < 1) return plural(diffMin, "minute");
    return plural(diffHour, "hour");
  }
  if (diffDay < 30) return plural(diffDay, "day");
  if (diffDay < 365) return plural(diffMonth, "month");
  return plural(diffYear, "year");
}
