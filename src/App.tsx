import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProfilePage from "./ProfilePage";
import Dashboard from "./Dashboard";




/* ------------------ Pages ------------------ */


/* ---------------- Analyzer ---------------- */

function Analyzer() {
  const [log, setLog] = useState("");
  const [result, setResult] = useState<any>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = (e:any) => {
    const file = e.target.files[0];
    if(!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event:any)=>{
      setLog(event.target.result);
    };

    reader.readAsText(file);
  };

  const analyzeLog = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log }),
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
    } catch {
      setResult({ error: "❌ Backend not connected" });
    }
  };

  return (
    <>
      <style>{`


.analyzer-bg{
  background:#020617;
  min-height:100vh;
}

/* Outer Card */

.analyzer-card{
  background:#0f172a;
  border:1px solid rgba(56,189,248,0.35);
  border-radius:12px;
  padding:28px;

  box-shadow:
    0 0 10px rgba(56,189,248,0.25),
    0 0 25px rgba(56,189,248,0.15);

  color:#e2e8f0;
}

/* Title */

.analyzer-title{
  color:#38bdf8;
  margin-bottom:22px;
}

/* Upload Section */

.upload-box{
  border:2px dashed rgba(56,189,248,0.5);
  background:transparent;
  color:#38bdf8;
  padding:18px;
  border-radius:10px;

  margin-bottom:30px; /* GAP between upload and textarea */

  transition:0.2s;
}

.upload-box:hover{
  background:rgba(56,189,248,0.05);
}

/* Textarea */

.log-textarea{
  background:#020617;
  border:1px solid #1e293b;
  color:#e2e8f0;

  padding:12px;
  border-radius:8px;

  margin-bottom:20px; /* space before button */
}

/* Button */

.analyze-btn{
  background:#020617;
  border:1px solid #38bdf8;
  color:#38bdf8;

  padding:10px 22px;
  border-radius:8px;

  box-shadow:0 0 6px rgba(56,189,248,0.4);

  transition:0.2s;
}

.analyze-btn:hover{
  box-shadow:
    0 0 12px rgba(56,189,248,0.7),
    0 0 20px rgba(56,189,248,0.4);
}

/* Results */

.result-box{
  margin-top:22px;
  background:#020617;
  border:1px solid #1e293b;
  padding:16px;
  border-radius:8px;
  color:#e2e8f0;
}


      `}</style>

      <div className="flex justify-center items-center p-10 analyzer-bg">

        <motion.div
          initial={{opacity:0, scale:0.9}}
          animate={{opacity:1, scale:1}}
          transition={{duration:0.4}}
          className="analyzer-card shadow-xl rounded-xl p-6 w-full max-w-lg text-center"
        >

          <h2 className="text-2xl font-bold mb-4 analyzer-title">
            🤖 Log Analyzer
          </h2>

          <motion.label
            whileHover={{scale:1.05}}
            className="upload-box p-4 rounded-lg mb-4 cursor-pointer"
          >
            📂 Upload Log File
            <input
              type="file"
              accept=".log,.txt"
              onChange={handleFile}
              className="hidden"
            />
            {fileName && (
              <p className="text-sm mt-2">
                Uploaded: {fileName}
              </p>
            )}
          </motion.label>

          <textarea
            className="w-full p-3 rounded mb-4 log-textarea"
            rows={6}
            placeholder="Paste logs here..."
            value={log}
            onChange={(e) => setLog(e.target.value)}
          />

          <motion.button
            whileHover={{scale:1.05}}
            whileTap={{scale:0.9}}
            onClick={analyzeLog}
            className="analyze-btn px-6 py-2 rounded transition"
          >
            Analyze
          </motion.button>

          {result && !result.error && (
            <motion.div
              initial={{opacity:0, y:30}}
              animate={{opacity:1, y:0}}
              className="mt-4 p-4 rounded text-left space-y-2 result-box"
            >
              <h2 className="font-bold text-lg">📊 Analysis Report</h2>
              <p><strong>Failure Type:</strong> {result.failure_type}</p>
              <p><strong>Root Cause:</strong> {result.root_cause}</p>
              <p><strong>Confidence:</strong> {result.confidence}%</p>

              <div>
                <strong>Summary:</strong>
                <pre className="whitespace-pre-wrap">{result.summary}</pre>
              </div>

              <p><strong>Suggested Fix:</strong> {result.fix}</p>
            </motion.div>
          )}

          {result?.error && (
            <div className="mt-4 text-red-500 font-semibold">
              {result.error}
            </div>
          )}

        </motion.div>

      </div>
    </>
  );
}



/* ---------------- History Dashboard ---------------- */




function History() {

  const hardcodedLogs = [
    { build_id:"#2456", project:"Example Project", error_type:"Timeout", failed_step:"Parse", time:"5 mins ago", confidence:91 },
    { build_id:"#2413", project:"Example Project", error_type:"Compilation Error", failed_step:"Test Server", time:"22 mins ago", confidence:87 },
    { build_id:"#2402", project:"Example Project", error_type:"Timeout", failed_step:"Parser Send", time:"33 mins ago", confidence:72 },
    { build_id:"#2401", project:"Example Project", error_type:"Compilation Error", failed_step:"Test Server", time:"45 mins ago", confidence:82 }
  ];

  const [history,setHistory] = useState<any[]>([]);
  const [filtered,setFiltered] = useState<any[]>([]);

  const [project,setProject] = useState("All");
  const [status,setStatus] = useState("All");
  const [confidence,setConfidence] = useState("All");
  const [search,setSearch] = useState("");

  useEffect(()=>{
    const stored = localStorage.getItem("logHistory");
    if(stored){
      const parsed = JSON.parse(stored);
      if(parsed.length>0){
        const formatted = parsed.map((item:any,index:number)=>({
          build_id:`#${2500+index}`,
          project:"AI Log Analyzer",
          error_type:item.failure_type,
          failed_step:item.root_cause,
          time:item.time,
          confidence:item.confidence
        }));
        setHistory(formatted);
        setFiltered(formatted);
        return;
      }
    }
    setHistory(hardcodedLogs);
    setFiltered(hardcodedLogs);
  },[]);

  useEffect(()=>{
    let data=[...history];

    if(project!=="All"){
      data=data.filter(d=>d.project===project);
    }
    if(status!=="All"){
      data=data.filter(d=>d.error_type===status);
    }
    if(confidence!=="All"){
      const c=parseInt(confidence);
      data=data.filter(d=>d.confidence>=c);
    }
    if(search){
      data=data.filter(d=>
        d.project.toLowerCase().includes(search.toLowerCase()) ||
        d.error_type.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(data);
  },[project,status,confidence,search,history]);

  const totalBuilds = history.length;
  const failed = history.length;
  const passed = 254 - failed;

  return(
    <div className="p-6 bg-black min-h-screen text-white font-sans">

      <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-[0_0_4px_#00f6ff]">Dashboard</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">

        <select
          className="border border-blue-400 bg-black text-white p-2 rounded-md focus:ring-1 focus:ring-blue-400 shadow-[0_0_4px_#00f6ff] hover:shadow-[0_0_10px_#00f6ff] transition"
          onChange={(e)=>setProject(e.target.value)}
        >
          <option value="All">Select Project</option>
          <option value="Example Project">Example Project</option>
          <option value="AI Log Analyzer">AI Log Analyzer</option>
        </select>

        <select className="border border-blue-400 bg-black text-white p-2 rounded-md focus:ring-1 focus:ring-blue-400 shadow-[0_0_4px_#00f6ff] hover:shadow-[0_0_10px_#00f6ff] transition">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>

        <select
          className="border border-blue-400 bg-black text-white p-2 rounded-md focus:ring-1 focus:ring-blue-400 shadow-[0_0_4px_#00f6ff] hover:shadow-[0_0_10px_#00f6ff] transition"
          onChange={(e)=>setStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Timeout">Timeout</option>
          <option value="Compilation Error">Compilation Error</option>
        </select>

        <select
          className="border border-blue-400 bg-black text-white p-2 rounded-md focus:ring-1 focus:ring-blue-400 shadow-[0_0_4px_#00f6ff] hover:shadow-[0_0_10px_#00f6ff] transition"
          onChange={(e)=>setConfidence(e.target.value)}
        >
          <option value="All">Confidence %</option>
          <option value="50">50+</option>
          <option value="70">70+</option>
          <option value="90">90+</option>
        </select>

        <input
          placeholder="Search"
          className="border border-blue-400 bg-black text-white p-2 rounded-md ml-auto focus:ring-1 focus:ring-blue-400 shadow-[0_0_4px_#00f6ff] hover:shadow-[0_0_10px_#00f6ff] transition"
          onChange={(e)=>setSearch(e.target.value)}
        />

      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400 hover:shadow-[0_0_10px_#00f6ff] transition">
          <p className="text-white">Total Builds</p>
          <h2 className="text-2xl font-bold text-white">{totalBuilds}</h2>
        </div>

        <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400 hover:shadow-[0_0_10px_#00f6ff] transition">
          <p className="text-white">Failed</p>
          <h2 className="text-2xl font-bold text-white">{failed}</h2>
        </div>

        <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400 hover:shadow-[0_0_10px_#00f6ff] transition">
          <p className="text-white">Passed</p>
          <h2 className="text-2xl font-bold text-white">{passed}</h2>
        </div>

        <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400 hover:shadow-[0_0_10px_#00f6ff] transition">
          <p className="text-white">Alerts</p>
          <p className="text-sm text-white">System monitoring active</p>
        </div>

      </div>

      {/* Graph + Tasks + Trends */}
      <div className="grid grid-cols-3 gap-6 mb-6">

        {/* Graph */}
        <div className="bg-black p-6 rounded-md border border-blue-400 col-span-2">

          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-white">Build Failure Trends</h3>
            <button className="border border-blue-400 px-3 py-1 rounded text-sm text-white hover:bg-blue-900/50 transition">
              View All
            </button>
          </div>

          <div className="flex">

            {/* Y Axis */}
            <div className="flex flex-col justify-between text-xs text-white mr-2 h-40">
              <span>100</span>
              <span>80</span>
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>

            {/* Bars + X Axis */}
            <div className="flex flex-col flex-1">
              <div className="flex items-end gap-6 h-40 border-l border-b border-blue-400 pl-4">
                <div className="bg-blue-400 w-6 h-20"></div>
                <div className="bg-blue-400 w-6 h-32"></div>
                <div className="bg-blue-400 w-6 h-28"></div>
                <div className="bg-blue-400 w-6 h-36"></div>
                <div className="bg-blue-400 w-6 h-24"></div>
                <div className="bg-blue-400 w-6 h-40"></div>
              </div>

              <div className="flex gap-6 text-xs text-white mt-2 pl-4">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col gap-6">

          {/* Tasks */}
          <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400 hover:shadow-[0_0_10px_#00f6ff] transition">
            <h3 className="font-semibold mb-3 text-white">Tasks</h3>
            <ul className="list-disc ml-5 text-sm text-white space-y-1">
              <li>Investigate DB timeout</li>
              <li>Improve log parser</li>
              <li>Document failure engine</li>
            </ul>
          </div>

          {/* Trends */}
          <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400 hover:shadow-[0_0_10px_#00f6ff] transition">
            <h3 className="font-semibold mb-3 text-white">Trends</h3>
            <ul className="list-disc ml-5 text-sm text-white space-y-1">
              <li>Timeout errors increased</li>
              <li>Compilation failures trending</li>
            </ul>
            <button className="mt-3 border border-blue-400 px-3 py-1 rounded text-sm text-white hover:bg-blue-900/50 transition">
              View Details
            </button>
          </div>

        </div>

      </div>

      {/* Table */}
      <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400 overflow-x-auto">

        <h3 className="font-semibold mb-3 text-white">Recent Failed Builds</h3>

        <table className="w-full text-sm text-white border-collapse">
          <thead>
            <tr className="border-b border-blue-400 text-left text-white">
              <th className="py-2 px-2">Build ID</th>
              <th>Project</th>
              <th>Error Type</th>
              <th>Failed Step</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item,index)=>( 
              <tr key={index} className="border-b border-blue-700 hover:bg-blue-900/20 transition">
                <td className="py-2 px-2">{item.build_id}</td>
                <td>{item.project}</td>
                <td>{item.error_type}</td>
                <td>{item.failed_step}</td>
                <td>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
}



/* ---------------- App ---------------- */

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState("login");

  const handleLogin = (status: boolean) => {
    setIsLoggedIn(status);
    localStorage.setItem("isLoggedIn", status.toString());
  };

  /* -------- Login / Signup Screen -------- */
  if (!isLoggedIn) {
    if (page === "signup") return <Signup goToLogin={() => setPage("login")} />;
    return <Login onLogin={handleLogin} goToSignup={() => setPage("signup")} />;
  }

  /* -------- Main App -------- */
  return (
    <Router>
      <Header />
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyzer" element={<Analyzer />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;