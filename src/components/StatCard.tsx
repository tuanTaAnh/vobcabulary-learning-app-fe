type Props = {
  label: string;
  value: string | number;
  icon: string;
};

function StatCard({ label, value, icon }: Props) {
  return (
    <div className="stat-card cute-card">
      <span className="stat-icon">{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

export default StatCard;