import { useState,useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

  /* -------- NEW ANALYTICS DATA (NO LOGIC CHANGED) -------- */

  const errorCounts:any = {};
  history.forEach(h=>{
    errorCounts[h.error_type]=(errorCounts[h.error_type]||0)+1;
  });

  const confidenceBuckets={
    "90+": history.filter(h=>h.confidence>=90).length,
    "70-89": history.filter(h=>h.confidence>=70 && h.confidence<90).length,
    "50-69": history.filter(h=>h.confidence>=50 && h.confidence<70).length
  };

  return(
    <div className="p-6 bg-black min-h-screen text-white font-sans">

      <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-[0_0_4px_#00f6ff]">Dashboard</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">

        <select
          className="border border-blue-400 bg-black text-white p-2 rounded-md shadow-[0_0_4px_#00f6ff]"
          onChange={(e)=>setProject(e.target.value)}
        >
          <option value="All">Select Project</option>
          <option value="Example Project">Example Project</option>
          <option value="AI Log Analyzer">AI Log Analyzer</option>
        </select>

        <select className="border border-blue-400 bg-black text-white p-2 rounded-md shadow-[0_0_4px_#00f6ff]">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>

        <select
          className="border border-blue-400 bg-black text-white p-2 rounded-md shadow-[0_0_4px_#00f6ff]"
          onChange={(e)=>setStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Timeout">Timeout</option>
          <option value="Compilation Error">Compilation Error</option>
        </select>

        <select
          className="border border-blue-400 bg-black text-white p-2 rounded-md shadow-[0_0_4px_#00f6ff]"
          onChange={(e)=>setConfidence(e.target.value)}
        >
          <option value="All">Confidence %</option>
          <option value="50">50+</option>
          <option value="70">70+</option>
          <option value="90">90+</option>
        </select>

        <input
          placeholder="Search"
          className="border border-blue-400 bg-black text-white p-2 rounded-md ml-auto shadow-[0_0_4px_#00f6ff]"
          onChange={(e)=>setSearch(e.target.value)}
        />

      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400">
          <p>Total Builds</p>
          <h2 className="text-2xl font-bold">{totalBuilds}</h2>
        </div>

        <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400">
          <p>Failed</p>
          <h2 className="text-2xl font-bold">{failed}</h2>
        </div>

        <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400">
          <p>Passed</p>
          <h2 className="text-2xl font-bold">{passed}</h2>
        </div>

        <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400">
          <p>Alerts</p>
          <p className="text-sm">System monitoring active</p>
        </div>

      </div>

      {/* EXISTING GRAPH SECTION (UNCHANGED) */}
      <div className="grid grid-cols-3 gap-6 mb-6">
  <div className="bg-black p-6 rounded-md border border-blue-400 col-span-2">
    <h3 className="font-semibold mb-4">Build Failure Trends</h3>

    <div className="flex">

      {/* Y AXIS */}
      <div className="flex flex-col justify-between text-xs text-gray-400 mr-3 h-40">
        <span>100%</span>
        <span>80%</span>
        <span>60%</span>
        <span>40%</span>
        <span>20%</span>
        <span>0%</span>
      </div>

      <div className="flex flex-col">

        {/* GRAPH */}
        <div className="flex items-end gap-6 h-40 border-l border-b border-blue-400 pl-3">
          <div className="bg-blue-400 w-6 h-20"></div>
          <div className="bg-blue-400 w-6 h-32"></div>
          <div className="bg-blue-400 w-6 h-28"></div>
          <div className="bg-blue-400 w-6 h-36"></div>
          <div className="bg-blue-400 w-6 h-24"></div>
          <div className="bg-blue-400 w-6 h-40"></div>
        </div>

        {/* X AXIS */}
        <div className="flex gap-6 mt-2 text-xs text-gray-400 pl-3">
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

  <div className="flex flex-col gap-6">

    <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400">
      <h3 className="font-semibold mb-3">Tasks</h3>
      <ul className="list-disc ml-5 text-sm space-y-1">
        <li>Investigate DB timeout</li>
        <li>Improve log parser</li>
        <li>Document failure engine</li>
      </ul>
    </div>

  </div>
</div>

      {/* -------- NEW GRAPHS -------- */}
<div className="grid grid-cols-2 gap-6 mb-6">

  {/* Error Frequency */}
  <div className="bg-black p-6 rounded-md border border-blue-400 shadow-[0_0_6px_#00f6ff]">
    <h3 className="font-semibold mb-3">Error Frequency</h3>

    <select
      className="mb-4 bg-black border border-blue-400 p-1 text-sm rounded"
      onChange={(e)=>setStatus(e.target.value)}
    >
      <option value="All">All Errors</option>
      <option value="Compilation Error">Compilation Error</option>
      <option value="Test Failure">Test Failure</option>
      <option value="Dependency Error">Dependency Error</option>
      <option value="Configuration Error">Configuration Error</option>
      <option value="Runtime Error">Runtime Error</option>
      <option value="Infrastructure Error">Infrastructure Error</option>
      <option value="Deployment Error">Deployment Error</option>
    </select>

    {/* Graph Data */}
    {(() => {

      const realData = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=>({
        day,
        value: history.filter(
          h =>
            (status==="All" || h.error_type===status) &&
            h.time.toLowerCase().includes(day.toLowerCase())
        ).length
      }));

      const hasRealData = realData.some(d => d.value > 0);

      const demoData = [
        {day:"Sun",value:4},
        {day:"Mon",value:7},
        {day:"Tue",value:5},
        {day:"Wed",value:9},
        {day:"Thu",value:6},
        {day:"Fri",value:8},
        {day:"Sat",value:3}
      ];

      const data = hasRealData ? realData : demoData;

      return (

        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>

            <CartesianGrid stroke="#333" />

            <XAxis dataKey="day" stroke="#aaa" />

            <YAxis stroke="#aaa" />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              fill="#22d3ee44"
              strokeWidth={3}
              dot={{ r:4 }}
            />

          </AreaChart>
        </ResponsiveContainer>

      );

    })()}

  </div>


  {/* Confidence Distribution */}
  {/* Confidence Distribution */}
<div className="bg-black p-6 rounded-md border border-blue-400 shadow-[0_0_6px_#00f6ff]">
  <h3 className="font-semibold mb-3">Confidence Distribution</h3>

  {/* Error Selector */}
  <select
    className="mb-4 bg-black border border-blue-400 p-1 text-sm rounded"
    onChange={(e)=>setStatus(e.target.value)}
  >
    <option value="All">All Errors</option>
    <option value="Compilation Error">Compilation Error</option>
    <option value="Test Failure">Test Failure</option>
    <option value="Dependency Error">Dependency Error</option>
    <option value="Configuration Error">Configuration Error</option>
    <option value="Runtime Error">Runtime Error</option>
    <option value="Infrastructure Error">Infrastructure Error</option>
    <option value="Deployment Error">Deployment Error</option>
  </select>

  {(() => {

    const realData = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=>{

      const items = history.filter(h =>
        (status==="All" || h.error_type===status) &&
        h.time.toLowerCase().includes(day.toLowerCase())
      )

      const avg =
        items.length>0
          ? items.reduce((a,b)=>a+b.confidence,0)/items.length
          : 0

      return { day, confidence: avg }
    })

    const hasRealData = realData.some(d => d.confidence > 0)

    const demoData = [
      {day:"Sun",confidence:72},
      {day:"Mon",confidence:81},
      {day:"Tue",confidence:76},
      {day:"Wed",confidence:88},
      {day:"Thu",confidence:79},
      {day:"Fri",confidence:91},
      {day:"Sat",confidence:84}
    ]

    const data = hasRealData ? realData : demoData

    return (

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>

          <CartesianGrid stroke="#333" />

          <XAxis dataKey="day" stroke="#aaa" />

          <YAxis
            domain={[0,100]}
            stroke="#aaa"
            tickFormatter={(v)=>`${v}%`}
          />

          <Tooltip formatter={(v)=>`${v.toFixed(1)}%`} />

          <Area
            type="monotone"
            dataKey="confidence"
            stroke="#22c55e"
            fill="#22c55e44"
            strokeWidth={3}
            dot={{ r:4 }}
          />

        </AreaChart>
      </ResponsiveContainer>

    )

  })()}

</div>

</div>
      {/* TABLE (UNCHANGED) */}

      <div className="bg-black p-4 rounded-md shadow-[0_0_6px_#00f6ff] border border-blue-400 overflow-x-auto">

        <h3 className="font-semibold mb-3">Recent Failed Builds</h3>

        <table className="w-full text-sm text-white border-collapse">
          <thead>
            <tr className="border-b border-blue-400 text-left">
              <th className="py-2 px-2">Build ID</th>
              <th>Project</th>
              <th>Error Type</th>
              <th>Failed Step</th>
              <th>Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item,index)=>( 
              <tr key={index} className="border-b border-blue-700 hover:bg-blue-900/20">
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
export default History;
