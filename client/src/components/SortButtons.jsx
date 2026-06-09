export default function SortButtons({ currentSort, onSortChange }) {
  return (
    <div className="action-row">
      <button
        className={currentSort === "newest" ? "active" : ""}
        onClick={() => onSortChange("newest")}
      >
        Newest
      </button>
      <button
        className={currentSort === "oldest" ? "active" : ""}
        onClick={() => onSortChange("oldest")}
      >
        Oldest
      </button>
      <button
        className={currentSort === "active" ? "active" : ""}
        onClick={() => onSortChange("active")}
      >
        Active
      </button>
    </div>
  );
}
