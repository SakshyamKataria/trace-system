import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UploadLog(){

const navigate = useNavigate();

const [log,setLog] = useState("");
const [result,setResult] = useState<any>(null);

const handleFile = async(e:any)=>{

const file = e.target.files[0];
const text = await file.text();
setLog(text);

};

const analyze = async()=>{

const res = await fetch("http://127.0.0.1:8000/analyze",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({log})
});

const data = await res.json();
setResult(data.result);

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

<div className="analyzer-card max-w-lg w-full text-center">

<h2 className="analyzer-title text-2xl font-bold">📂 Upload Log File</h2>

<input type="file" onChange={handleFile}/>

<textarea
rows={6}
value={log}
className="w-full log-textarea"
/>

<button onClick={analyze} className="analyze-btn">
Analyze
</button>

{result && (

<div className="result-box">

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

export default UploadLog;