import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { isPostSavedByUser } from "../utils/posts.js";

export default function SavePostButton({ user, postId, showMessage, onUserRefresh }) {
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
      showMessage(data.message, "success");
      onUserRefresh?.();
    } catch (error) {
      showMessage(error.message, "error");
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
