export function displayNameOfUser(user) {
  if (!user) return "Unknown";
  if (typeof user === "string") return user;
  return user.displayName || user.email || "Unknown";
}

export function flairContentOf(linkFlair) {
  if (!linkFlair || typeof linkFlair === "string") return "";
  return linkFlair.content || "";
}

export function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffDay < 1) {
    if (diffMin < 1) return `${diffSec} seconds ago`;
    if (diffHour < 1) return `${diffMin} minutes ago`;
    return `${diffHour} hours ago`;
  }
  if (diffDay < 30) return `${diffDay} days ago`;
  if (diffDay < 365) return `${diffMonth} month(s) ago`;
  return `${diffYear} year(s) ago`;
}

export function renderTextWithLinks(text) {
  if (!text || typeof text !== "string") return text;
  const parts = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a key={`link-${key++}`} href={match[2]} target="_blank" rel="noopener noreferrer">
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
}
