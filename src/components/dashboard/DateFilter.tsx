"use client";

interface DateFilterProps {
  value: string;
  onChange: (v: string) => void;
}

const options = [
  { value: "today", label: "오늘" },
  { value: "yesterday", label: "어제" },
  { value: "last_7d", label: "최근 7일" },
  { value: "last_14d", label: "최근 14일" },
  { value: "last_30d", label: "최근 30일" },
  { value: "this_month", label: "이번 달" },
  { value: "last_month", label: "지난 달" },
];

export default function DateFilter({ value, onChange }: DateFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
