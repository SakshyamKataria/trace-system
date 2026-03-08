import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home() {

  const navigate = useNavigate();

  const [chatOpen, setChatOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I am your AI assistant. Ask me anything about the AI Log Analyzer." }
  ]);

  const askQuestion = (q: string, a: string) => {
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: q },
      { sender: "bot", text: a }
    ]);
    setSearch("");
  };

  const questions = [
    { q: "What does this app do?", a: "This app analyzes logs and detects system failures automatically using AI." },
    { q: "How do I start analysis?", a: "Click the Start Analyzing button and paste your logs." },
    { q: "What logs are supported?", a: "Most system, application and server logs are supported." },
    { q: "Is analysis fast?", a: "Yes. Logs are processed within seconds depending on size." },
    { q: "Where is history stored?", a: "History is stored in the dashboard and saved locally." },
    { q: "What errors can be detected?", a: "Timeout errors, compilation failures, server crashes and parser errors." },
    { q: "How accurate is the AI?", a: "The AI gives confidence scores for each analysis." },
    { q: "Can I view past reports?", a: "Yes, all reports are stored in the History dashboard." }
  ];

  const filteredQuestions = questions.filter((q) =>
    q.q.toLowerCase().includes(search.toLowerCase())
  );

  const [showTitle, setShowTitle] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowTitle(true), 200);
    setTimeout(() => setShowText(true), 800);
    setTimeout(() => setShowButton(true), 1400);
    setTimeout(() => setShowCards(true), 2000);
  }, []);

  return (
    <>
      {/* HOME PAGE */}

      <div className="flex flex-col items-center text-center p-10 space-y-10 min-h-screen bg-[#050b18] text-cyan-100">

        {/* Title */}

        <div className={`transition-all duration-700 ${showTitle ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}>

          <h1 className="text-5xl font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] flex items-center gap-3">

            🤖 AI Log Analyzer

          </h1>

        </div>

        {/* Description */}

        <div className={`max-w-2xl transition-all duration-700 ${showText ? "opacity-100" : "opacity-0"}`}>

          <p className="text-lg text-cyan-200">

            Automatically analyze system logs, detect errors, and get meaningful insights using AI.
            Save time debugging and focus on building better applications.

          </p>

        </div>

        {/* Button */}

        <div className={`transition-all duration-700 ${showButton ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>

          <button
            onClick={() => navigate("/analyzer")}
            className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-3 rounded-lg text-lg transition shadow-lg shadow-cyan-500/40"
          >
            Start Analyzing
          </button>

        </div>

        {/* Cards */}

        {showCards && (

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl">

            <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:shadow-[0_0_30px_rgba(34,211,238,0.9)] rounded-xl p-6 hover:scale-105 transition">

              <h3 className="text-xl font-semibold mb-2 text-cyan-300">
                Fast Analysis
              </h3>

              <p className="text-cyan-200">
                Instantly process large logs and detect issues in seconds.
              </p>

            </div>

            <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:shadow-[0_0_30px_rgba(34,211,238,0.9)] rounded-xl p-6 hover:scale-105 transition">

              <h3 className="text-xl font-semibold mb-2 text-cyan-300">
                Smart Insights
              </h3>

              <p className="text-cyan-200">
                AI identifies patterns, errors and possible root causes.
              </p>

            </div>

            <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:shadow-[0_0_30px_rgba(34,211,238,0.9)] rounded-xl p-6 hover:scale-105 transition">

              <h3 className="text-xl font-semibold mb-2 text-cyan-300">
                History Tracking
              </h3>

              <p className="text-cyan-200">
                Save and review previous analysis reports anytime.
              </p>

            </div>

          </div>

        )}

      </div>


      {/* ROBOT BUTTON */}

      <div
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 cursor-pointer"
      >

        <img
  src="https://static.vecteezy.com/system/resources/previews/038/049/146/large_2x/ai-generated-cute-robot-kids-with-isolated-transparant-background-png.png"
  alt="AI Robot"
  className="w-20 animate-bounce drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
/>

        <div className="text-xs text-center bg-[#0b1426] border border-cyan-400/20 shadow px-2 py-1 rounded mt-1 text-cyan-200">
          Hi 👋
        </div>

      </div>


      {/* CHATBOT */}

      {chatOpen && (

        <div className="fixed bottom-24 right-6 w-80 bg-[#0b1426] border border-cyan-400/20 shadow-xl rounded-xl flex flex-col text-cyan-100">

          {/* Header */}

          <div className="bg-cyan-500 text-black p-3 rounded-t-xl flex justify-between">

            <span>AI Assistant</span>

            <button onClick={() => setChatOpen(false)}>✕</button>

          </div>

          {/* Messages */}

          <div className="p-3 h-60 overflow-y-auto space-y-2 text-sm">

            {messages.map((msg, index) => (

              <div
                key={index}
                className={
                  msg.sender === "bot"
                    ? "bg-[#111f3b] p-2 rounded-lg text-left"
                    : "bg-cyan-500/20 p-2 rounded-lg text-right"
                }
              >

                {msg.text}

              </div>

            ))}

          </div>

          {/* Search */}

          <div className="p-2 border-t border-cyan-400/20">

            <input
              type="text"
              placeholder="Search question..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111f3b] border border-cyan-400/20 rounded p-2 text-sm mb-2"
            />

            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">

              {(search ? filteredQuestions : questions.slice(0,4)).map((item, index) => (

                <button
                  key={index}
                  onClick={() => askQuestion(item.q, item.a)}
                  className="text-xs bg-cyan-500/20 px-2 py-1 rounded hover:bg-cyan-500/40"
                >

                  {item.q}

                </button>

              ))}

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default Home;