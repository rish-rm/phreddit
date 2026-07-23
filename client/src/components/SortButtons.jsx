export default function SortButtons({ currentSort, onSortChange }) {
  return (
    <div className="action-row">
      <button
        type="button"
        aria-pressed={currentSort === "newest"}
        className={currentSort === "newest" ? "active" : ""}
        onClick={() => onSortChange("newest")}
      >
        Newest
      </button>
      <button
        type="button"
        aria-pressed={currentSort === "oldest"}
        className={currentSort === "oldest" ? "active" : ""}
        onClick={() => onSortChange("oldest")}
      >
        Oldest
      </button>
      <button
        type="button"
        aria-pressed={currentSort === "active"}
        className={currentSort === "active" ? "active" : ""}
        onClick={() => onSortChange("active")}
      >
        Active
      </button>
    </div>
  );
}
