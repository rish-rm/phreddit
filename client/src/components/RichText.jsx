import { useMemo } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

// Force links in user content to open safely in a new tab.
if (typeof window !== "undefined") {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
}

// Renders user-authored markdown. All HTML output is sanitized with
// DOMPurify before being injected, which strips scripts, event handlers,
// and javascript: URLs.
export default function RichText({ text }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(text || "")),
    [text]
  );
  return <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />;
}
