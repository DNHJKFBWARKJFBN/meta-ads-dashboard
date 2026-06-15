"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

export default function Memo() {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(localStorage.getItem("dashboard_memo") ?? "");
  }, []);

  function handleChange(v: string) {
    setText(v);
    localStorage.setItem("dashboard_memo", v);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <FileText size={15} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">메모장</h3>
      </div>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="자유롭게 메모를 입력하세요..."
        className="w-full p-5 text-sm text-gray-700 resize-none outline-none min-h-[120px] placeholder-gray-300"
      />
    </div>
  );
}
