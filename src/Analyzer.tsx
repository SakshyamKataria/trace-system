import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Analyzer() {

  const navigate = useNavigate();

  return (
    <>
      <style>{`

.analyzer-bg{
  background:#020617;
  min-height:100vh;
}

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

.analyzer-title{
  color:#38bdf8;
  margin-bottom:22px;
}

.log-textarea{
  background:#020617;
  border:1px solid #38bdf8;
  color:#e2e8f0;

  padding:12px;
  border-radius:8px;

  margin-bottom:20px;

  box-shadow:
    0 0 8px rgba(56,189,248,0.6),
    0 0 16px rgba(56,189,248,0.4),
    0 0 25px rgba(56,189,248,0.25);

  transition:0.2s;
}

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

.result-box{
  margin-top:22px;
  background:#020617;
  border:1px solid #1e293b;
  padding:16px;
  border-radius:8px;
  color:#e2e8f0;
}

.dev-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  gap:20px;
}

.dev-box{
  cursor:pointer;
  transition:0.2s;
}

.dev-box:hover{
  transform:scale(1.03);
}

      `}</style>

      <div className="flex justify-center items-center p-10 analyzer-bg">

        <motion.div
          initial={{opacity:0, scale:0.9}}
          animate={{opacity:1, scale:1}}
          transition={{duration:0.4}}
          className="w-full max-w-5xl"
        >

          <h2 className="text-3xl font-bold text-center analyzer-title">
            🤖 Log Analyzer
          </h2>

          <div className="dev-grid mt-10">

            {/* AUTO FETCH LOGS */}

            <motion.div
              whileHover={{scale:1.05}}
              whileTap={{scale:0.95}}
              className="analyzer-card dev-box text-center"
              onClick={() => navigate("/auto-fetch")}
            >

              <h3 className="text-xl font-bold analyzer-title">
                ⚡ Auto Fetch Logs
              </h3>

              <p className="text-sm mt-3">
                Automatically fetch logs directly from the backend server.
              </p>

              <p className="text-sm mt-2">
                The system will instantly analyze failures and detect root causes.
              </p>

            </motion.div>


            {/* UPLOAD FILE */}

            <motion.div
              whileHover={{scale:1.05}}
              whileTap={{scale:0.95}}
              className="analyzer-card dev-box text-center"
              onClick={() => navigate("/upload-log")}
            >

              <h3 className="text-xl font-bold analyzer-title">
                📂 Upload Log File
              </h3>

              <p className="text-sm mt-3">
                Upload a log file from your local system.
              </p>

              <p className="text-sm mt-2">
                The analyzer will parse the file and detect any system failures.
              </p>

            </motion.div>


            {/* MANUAL LOG */}

            <motion.div
              whileHover={{scale:1.05}}
              whileTap={{scale:0.95}}
              className="analyzer-card dev-box text-center"
              onClick={() => navigate("/manual-log")}
            >

              <h3 className="text-xl font-bold analyzer-title">
                📝 Paste Logs Manually
              </h3>

              <p className="text-sm mt-3">
                Manually paste logs from any application or service.
              </p>

              <p className="text-sm mt-2">
                The analyzer will evaluate the logs and generate a failure report.
              </p>

            </motion.div>

          </div>

        </motion.div>

      </div>
    </>
  );
}

export default Analyzer;