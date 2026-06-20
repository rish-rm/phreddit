import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { isPostSavedByUser } from "../utils/posts.js";

export default function SavePostButton({ user, postId, setMessage, onUserRefresh }) {
  const [isSaved, setIsSaved] = useState(() => isPostSavedByUser(user, postId));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsSaved(isPostSavedByUser(user, postId));
  }, [postId, user]);

  if (!user) return null;

  async function toggleSaved() {
    try {
      setIsSaving(true);
      const data = isSaved
        ? await api.unsavePost(postId)
        : await api.savePost(postId);

      setIsSaved(!isSaved);
      setMessage(data.message);
      onUserRefresh?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      type="button"
      className={isSaved ? "active" : ""}
      disabled={isSaving}
      onClick={toggleSaved}
      aria-pressed={isSaved}
    >
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}
