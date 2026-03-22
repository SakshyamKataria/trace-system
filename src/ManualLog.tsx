import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ManualLog(){

const navigate = useNavigate();

const [log,setLog] = useState("");
const [result,setResult] = useState<any>(null);

/* NEW: build ID */
const [buildId,setBuildId] = useState("");

const analyze = async()=>{

let failure="Unknown";
let root="Unknown issue in logs";
let confidence=60;

const lowerLog = log.toLowerCase();

/* simple fake log analysis */

if(lowerLog.includes("timeout")){
failure="Timeout";
root="Service took too long to respond";
confidence=88;
}
else if(lowerLog.includes("compilation")){
failure="Compilation Error";
root="Build failed during compilation";
confidence=92;
}
else if(lowerLog.includes("database")){
failure="Database Error";
root="Database connection failure";
confidence=84;
}
else if(lowerLog.includes("dependency")){
failure="Dependency Error";
root="Missing or incompatible dependency";
confidence=80;
}

/* result object */

const fakeResult={
failure_type:failure,
root_cause:root,
confidence:confidence
};

setResult(fakeResult);

/* save result to localStorage for History page */

const stored = localStorage.getItem("logHistory");
const history = stored ? JSON.parse(stored) : [];

history.unshift({
/* NEW: store buildId */
build_id: buildId,
failure_type:fakeResult.failure_type,
root_cause:fakeResult.root_cause,
confidence:fakeResult.confidence,
time:new Date().toLocaleString()
});

localStorage.setItem("logHistory",JSON.stringify(history));

/* redirect to History dashboard */

setTimeout(()=>{
navigate("/history");
},1000);

};

return(
<>
<style>{`

.analyzer-bg{
background:#020617;
min-height:100vh;
position:relative;
}

.back-arrow{
position:absolute;
top:20px;
left:20px;
font-size:26px;
color:#38bdf8;
cursor:pointer;
}

.analyzer-card{
background:#0f172a;
border:1px solid rgba(56,189,248,0.35);
border-radius:12px;
padding:28px;
color:#e2e8f0;
}

.analyzer-title{
color:#38bdf8;
margin-bottom:20px;
}

.log-textarea{
background:#020617;
border:1px solid #38bdf8;
color:#e2e8f0;
padding:12px;
border-radius:8px;
margin-bottom:20px;
}

.analyze-btn{
background:#020617;
border:1px solid #38bdf8;
color:#38bdf8;
padding:10px 22px;
border-radius:8px;
cursor:pointer;
}

.result-box{
margin-top:20px;
background:#020617;
border:1px solid #1e293b;
padding:16px;
border-radius:8px;
}

`}</style>

<div className="analyzer-bg flex justify-center items-center p-10">

<div className="back-arrow" onClick={()=>navigate("/analyzer")}>←</div>

<div className="analyzer-card max-w-lg w-full text-center">

<h2 className="analyzer-title text-2xl font-bold">📝 Paste Logs</h2>

{/* NEW: Build ID input */}
<input
type="text"
placeholder="Enter Jenkins Build ID"
value={buildId}
onChange={(e)=>setBuildId(e.target.value)}
className="w-full log-textarea"
/>

<textarea
rows={6}
value={log}
onChange={(e)=>setLog(e.target.value)}
placeholder="Paste logs here..."
className="w-full log-textarea"
/>

<button onClick={analyze} className="analyze-btn">
Analyze Logs
</button>

{result && (

<div className="result-box">

<p><strong>Build ID:</strong> {buildId}</p>
<p><strong>Failure:</strong> {result.failure_type}</p>
<p><strong>Root Cause:</strong> {result.root_cause}</p>
<p><strong>Confidence:</strong> {result.confidence}%</p>

</div>

)}

</div>

</div>
</>
);
}

export default ManualLog;