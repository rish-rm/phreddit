export default function EditableItemRow({ title, subtitle, onEdit, onDelete }) {
  return (
    <div className="row-card">
      <div className="row-card-text">
        <span className="row-card-title">{title}</span>
        {subtitle && <span className="row-card-subtitle">{subtitle}</span>}
      </div>
      <div className="row-card-actions">
        <button onClick={onEdit}>Edit</button>
        <button className="danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
