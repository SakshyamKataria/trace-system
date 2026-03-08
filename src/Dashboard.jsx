import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
Chart as ChartJS,
CategoryScale,
LinearScale,
PointElement,
LineElement,
Tooltip,
Legend
} from "chart.js";

ChartJS.register(
CategoryScale,
LinearScale,
PointElement,
LineElement,
Tooltip,
Legend
);

export default function Dashboard(){

const [history,setHistory] = useState([]);
useEffect(()=>{

const stored = localStorage.getItem("logHistory");

if(stored){
setHistory(JSON.parse(stored));
}

},[]);

/* -------- Metrics -------- */

const total = history.length;

const failed = history.filter(h =>
h.failure_type?.toLowerCase().includes("error") ||
h.failure_type?.toLowerCase().includes("timeout")
).length;

const passed = total - failed;

/* -------- Graph Data -------- */

const labels = history.map(h => h.time);

const data = {
labels,
datasets:[
{
label:"Build Activity",
data: history.map((_,i)=>i+1),
borderColor:"purple",
backgroundColor:"purple"
}
]
};

/* -------- Recent Failed -------- */

const recentFailed = history.slice(0,5);

return(

<div className="p-6 space-y-6">

<h1 className="text-3xl font-bold text-purple-600">
Dashboard
</h1>

{/* Metrics */}

<div className="grid grid-cols-4 gap-4">

<div className="bg-white shadow rounded p-4">
<p>Total Builds</p>
<h2 className="text-2xl font-bold">{total}</h2>
</div>

<div className="bg-white shadow rounded p-4">
<p>Failed</p>
<h2 className="text-2xl font-bold text-red-500">{failed}</h2>
</div>

<div className="bg-white shadow rounded p-4">
<p>Passed</p>
<h2 className="text-2xl font-bold text-green-500">{passed}</h2>
</div>

<div className="bg-white shadow rounded p-4">
<p>Alerts</p>
<h2 className="text-2xl font-bold text-yellow-500">{failed}</h2>
</div>

</div>

{/* Chart */}

<div className="bg-white p-6 shadow rounded">

<h2 className="font-bold mb-4">
Builds Overview
</h2>

<Line data={data}/>

</div>

{/* Recent Failed */}

<div className="bg-white shadow rounded">

<h2 className="font-bold p-4 border-b">
Recent Failed Builds
</h2>

<table className="w-full">

<thead className="bg-gray-100">
<tr>
<th className="p-3">Build ID</th>
<th className="p-3">Error Type</th>
<th className="p-3">Root Cause</th>
<th className="p-3">Time</th>
</tr>
</thead>

<tbody>

{recentFailed.map((item,index)=>(

<tr key={index} className="border-b">

<td className="p-3">#{1000+index}</td>
<td className="p-3">{item.failure_type}</td>
<td className="p-3">{item.root_cause}</td>
<td className="p-3">{item.time}</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

);

}
