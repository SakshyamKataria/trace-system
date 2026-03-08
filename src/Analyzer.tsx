import { useState } from "react";
import { motion } from "framer-motion";

function Analyzer() {
  const [log, setLog] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyzeLog = async () => {
    try {
      setLoading(true);

      // Fetch logs automatically from backend
      const logRes = await fetch("http://127.0.0.1:8000/get-logs");
      const fetched = await logRes.json();

      const logData = fetched.log;
      setLog(logData);

      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log: logData }),
      });

      const data = await res.json();
      setResult(data.result);

      const previous = JSON.parse(localStorage.getItem("logHistory") || "[]");

      const newEntry = {
        time: new Date().toLocaleString(),
        failure_type: data.result.failure_type,
        root_cause: data.result.root_cause,
        confidence: data.result.confidence,
        fix: data.result.fix,
      };

      previous.unshift(newEntry);
      localStorage.setItem("logHistory", JSON.stringify(previous));

      setLoading(false);
    } catch {
      setResult({ error: "❌ Backend not connected" });
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-6 bg-[#050b18]">

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/20 shadow-2xl rounded-xl p-6 w-full max-w-lg text-center"
      >

        <h2 className="text-2xl font-bold mb-6 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
          🤖 Log Analyzer
        </h2>

        {/* Neon Textarea */}
        <textarea
          className="w-full p-3 bg-[#0f1b33] border border-cyan-400/30 rounded mb-4 text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
          rows={6}
          placeholder="Logs will be fetched automatically from backend..."
          value={log}
          readOnly
        />

        {/* Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={analyzeLog}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-2 rounded transition shadow-lg shadow-cyan-500/30"
        >
          {loading ? "Analyzing..." : "Fetch & Analyze Logs"}
        </motion.button>

        {/* Loading */}
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="mt-4 text-cyan-400 text-xl"
          >
            ⏳
          </motion.div>
        )}

        {/* Results */}
        {result && !result.error && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-[#0f1b33] border border-cyan-400/20 rounded text-left space-y-2 text-cyan-100"
          >
            <h2 className="font-bold text-lg text-cyan-300">
              📊 Analysis Report
            </h2>

            <p><strong>Failure Type:</strong> {result.failure_type}</p>
            <p><strong>Root Cause:</strong> {result.root_cause}</p>
            <p><strong>Confidence:</strong> {result.confidence}%</p>

            <div>
              <strong>Summary:</strong>
              <pre className="whitespace-pre-wrap text-sm">{result.summary}</pre>
            </div>

            <p><strong>Suggested Fix:</strong> {result.fix}</p>
          </motion.div>
        )}

        {result?.error && (
          <div className="mt-4 text-red-400 font-semibold">
            {result.error}
          </div>
        )}

      </motion.div>
    </div>
  );
}

export default Analyzer;