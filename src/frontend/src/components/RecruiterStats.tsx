type Props = { total: number; active: number; closed: number };

export default function RecruiterStats({ total, active, closed }: Props) {
  const cards = [
    { label: "Total Jobs", value: total, className: "text-gray-900" },
    { label: "Active Jobs", value: active, className: "text-emerald-600" },
    { label: "Closed Jobs", value: closed, className: "text-gray-600" },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{card.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${card.className}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
