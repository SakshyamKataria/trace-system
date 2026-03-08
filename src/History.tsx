
import { useEffect, useState } from "react";

function History() {

  const hardcodedLogs = [
    { id: 2456, project: "Example Project", failure_type: "Timeout", step: "Parse", confidence: 91, time: "5 mins ago" },
    { id: 2413, project: "Example Project", failure_type: "Compilation Error", step: "Test Server", confidence: 87, time: "22 mins ago" },
    { id: 2401, project: "Example Project", failure_type: "Timeout", step: "Build", confidence: 72, time: "33 mins ago" },
    { id: 2392, project: "Example Project", failure_type: "Compilation Error", step: "Deploy", confidence: 82, time: "45 mins ago" },
  ];

  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {

    const stored = localStorage.getItem("logHistory");

    if (stored) {
      const parsed = JSON.parse(stored);

      if (parsed.length > 0) {
        setLogs(parsed);
        return;
      }
    }

    setLogs(hardcodedLogs);

  }, []);

  const total = logs.length;
  const failed = logs.length;
  const passed = 250;

  return (

    <div className="p-8 bg-[#050b18] min-h-screen text-cyan-100">

      <h1 className="text-2xl font-semibold mb-6 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]">
        Dashboard
      </h1>

      {/* Filters */}

      <div className="flex gap-4 mb-6 flex-wrap">

        <select className="bg-[#0f1b33] border border-cyan-400/20 p-2 rounded">
          <option>Select Project</option>
        </select>

        <select className="bg-[#0f1b33] border border-cyan-400/20 p-2 rounded">
          <option>Last 7 Days</option>
        </select>

        <select className="bg-[#0f1b33] border border-cyan-400/20 p-2 rounded">
          <option>All Statuses</option>
        </select>

        <select className="bg-[#0f1b33] border border-cyan-400/20 p-2 rounded">
          <option>Confidence %</option>
        </select>

        <input
          type="text"
          placeholder="Search"
          className="bg-[#0f1b33] border border-cyan-400/20 p-2 rounded ml-auto"
        />

      </div>

      {/* Stats Cards */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/20 p-5 rounded shadow-lg">
          <p className="text-cyan-300">Total Builds</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>

        <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/20 p-5 rounded shadow-lg">
          <p className="text-cyan-300">Failed</p>
          <h2 className="text-2xl font-bold">{failed}</h2>
        </div>

        <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/20 p-5 rounded shadow-lg">
          <p className="text-cyan-300">Passed</p>
          <h2 className="text-2xl font-bold">{passed}</h2>
        </div>

        <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/20 p-5 rounded shadow-lg">
          <p className="text-cyan-300">Alerts</p>
          <p className="text-sm mt-1">System monitoring active</p>
        </div>

      </div>

      {/* Graph + Tasks */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Graph */}

        <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/20 p-6 rounded shadow-lg col-span-2">

          <div className="flex justify-between mb-4">
            <h2 className="font-semibold text-cyan-300">Builds Overview</h2>
            <button className="border border-cyan-400/20 px-3 py-1 rounded text-sm">
              View All
            </button>
          </div>

          <div className="h-48 flex items-end gap-4">

            <div className="bg-cyan-400 w-8 h-24 rounded"></div>
            <div className="bg-cyan-400 w-8 h-32 rounded"></div>
            <div className="bg-cyan-400 w-8 h-20 rounded"></div>
            <div className="bg-cyan-400 w-8 h-36 rounded"></div>
            <div className="bg-cyan-400 w-8 h-28 rounded"></div>
            <div className="bg-cyan-400 w-8 h-40 rounded"></div>

          </div>

        </div>

        {/* Tasks */}

        <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/20 p-6 rounded shadow-lg">

          <h2 className="font-semibold mb-3 text-cyan-300">Tasks</h2>

          <ul className="list-disc ml-4 text-sm space-y-1">
            <li>Investigate DB timeout</li>
            <li>Improve log parser</li>
            <li>Document failure engine</li>
          </ul>

        </div>

      </div>

      {/* Table */}

      <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/20 p-6 rounded shadow-lg">

        <div className="flex justify-between mb-4">
          <h2 className="font-semibold text-cyan-300">Recent Failed Builds</h2>
          <button className="border border-cyan-400/20 px-3 py-1 rounded text-sm">
            View All
          </button>
        </div>

        <table className="w-full text-left">

          <thead className="border-b border-cyan-400/20 text-cyan-300">

            <tr>
              <th className="py-2">Build ID</th>
              <th>Project</th>
              <th>Error Type</th>
              <th>Failed Step</th>
              <th>Timestamp</th>
            </tr>

          </thead>

          <tbody>

            {logs.map((log, i) => (

              <tr key={i} className="border-b border-cyan-400/10">

                <td className="py-2">#{log.id}</td>
                <td>{log.project}</td>
                <td>{log.failure_type}</td>
                <td>{log.step}</td>
                <td className="text-cyan-400">{log.time}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default History;

