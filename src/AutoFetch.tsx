import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function AutoFetch(){

const navigate = useNavigate();

const [log,setLog] = useState("");
const [result,setResult] = useState<any>(null);

/* NEW: build ID */
const [buildId,setBuildId] = useState("");

const analyzeLog = async()=>{

try{

const logRes = await fetch("http://127.0.0.1:8000/get-logs");
const backendLogs = await logRes.json();

const logData = backendLogs.log;
setLog(logData);

const res = await fetch("http://127.0.0.1:8000/analyze",{
method:"POST",
headers:{"Content-Type":"application/json"},
/* NEW: send buildId */
body:JSON.stringify({log:logData, buildId})
});

const data = await res.json();
setResult(data.result);

/* NEW: save to history */

const stored = localStorage.getItem("logHistory");
const history = stored ? JSON.parse(stored) : [];

history.unshift({
build_id: buildId,
failure_type:data.result.failure_type,
root_cause:data.result.root_cause,
confidence:data.result.confidence,
time:new Date().toLocaleString()
});

localStorage.setItem("logHistory",JSON.stringify(history));

/* redirect to dashboard only after button fetch */
setTimeout(()=>{
navigate("/dashboard");
},1000);

}catch{

setResult({error:"❌ Backend not connected"});

}

};

return(
<>
<style>{`

.analyzer-bg{
background:#020617;
min-height:100vh;
position:relative;
display:flex;
justify-content:center;
align-items:center;
}

/* back arrow */

.back-arrow{
position:absolute;
top:20px;
left:20px;
font-size:26px;
color:#38bdf8;
cursor:pointer;
transition:0.25s;
}

.back-arrow:hover{
transform:translateX(-4px);
text-shadow:0 0 6px rgba(56,189,248,0.5);
}

/* card */

.analyzer-card{
background:#0f172a;
border:1px solid rgba(56,189,248,0.25);
border-radius:12px;
padding:28px;
color:#e2e8f0;

box-shadow:
0 0 6px rgba(56,189,248,0.25),
0 0 12px rgba(56,189,248,0.15);

transition:0.3s;
}

.analyzer-card:hover{
box-shadow:
0 0 10px rgba(56,189,248,0.35),
0 0 18px rgba(56,189,248,0.2);
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
resize:none;
}

.analyze-btn{
background:#020617;
border:1px solid #38bdf8;
color:#38bdf8;
padding:10px 22px;
border-radius:8px;
cursor:pointer;
transition:0.25s;
}

.analyze-btn:hover{
background:#38bdf8;
color:#020617;
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

{/* Arrow goes back to analyzer options */}
<div className="back-arrow" onClick={()=>navigate("/analyzer")}>←</div>

<motion.div
className="analyzer-card max-w-lg w-full text-center"
initial={{opacity:0,y:30}}
animate={{opacity:1,y:0}}
transition={{duration:0.5}}
>

<h2 className="analyzer-title text-2xl font-bold">⚡ Auto Fetch Logs</h2>

<p>Logs will be automatically fetched from backend.</p>

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
readOnly
className="w-full log-textarea"
/>

<button onClick={analyzeLog} className="analyze-btn">
Fetch & Analyze
</button>

{result && !result.error && (

<motion.div
className="result-box"
initial={{opacity:0}}
animate={{opacity:1}}
>

<p><strong>Build ID:</strong> {buildId}</p>
<p><strong>Failure Type:</strong> {result.failure_type}</p>
<p><strong>Root Cause:</strong> {result.root_cause}</p>
<p><strong>Confidence:</strong> {result.confidence}%</p>

</motion.div>

)}

{result?.error && <p style={{color:"red"}}>{result.error}</p>}

</motion.div>

</div>
</>
);
}

export default AutoFetch;