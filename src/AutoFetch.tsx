import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function AutoFetch(){

const navigate = useNavigate();

const [log,setLog] = useState("");
const [result,setResult] = useState<any>(null);

const analyzeLog = async()=>{

try{

const logRes = await fetch("http://127.0.0.1:8000/get-logs");
const backendLogs = await logRes.json();

const logData = backendLogs.log;
setLog(logData);

const res = await fetch("http://127.0.0.1:8000/analyze",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({log:logData})
});

const data = await res.json();
setResult(data.result);

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

.analyzer-title{color:#38bdf8;margin-bottom:20px;}

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

<motion.div className="analyzer-card max-w-lg w-full text-center">

<h2 className="analyzer-title text-2xl font-bold">⚡ Auto Fetch Logs</h2>

<p>Logs will be automatically fetched from backend.</p>

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

<div className="result-box">

<p><strong>Failure Type:</strong> {result.failure_type}</p>
<p><strong>Root Cause:</strong> {result.root_cause}</p>
<p><strong>Confidence:</strong> {result.confidence}%</p>

</div>

)}

{result?.error && <p style={{color:"red"}}>{result.error}</p>}

</motion.div>

</div>
</>
);
}

export default AutoFetch;