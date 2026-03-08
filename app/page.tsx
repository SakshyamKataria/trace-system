"use client";

import { useState } from "react";

export default function Home() {
  const [log, setLog] = useState("");
  const [result, setResult] = useState("");

  const analyzeLog = async () => {
    const res = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ log }),
    });

    const data = await res.json();
    setResult(data.result);
  };

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Log Analyzer</h1>

      <textarea
        className="w-full border p-2 mb-4"
        rows={6}
        placeholder="Paste your logs here..."
        value={log}
        onChange={(e) => setLog(e.target.value)}
      />

      <button
        onClick={analyzeLog}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Analyze
      </button>

      {result && (
        <div className="mt-4 p-3 border rounded bg-gray-100">
          <strong>Result:</strong> {result}
        </div>
      )}
    </div>
  );
}