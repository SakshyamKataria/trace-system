import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";
import History from "./History";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProfilePage from "./ProfilePage";
import Dashboard from "./Dashboard";
import Analyzer from "./Analyzer";

/* -------- NEW PAGES -------- */
import AutoFetch from "./AutoFetch";
import UploadLog from "./UploadLog";
import ManualLog from "./ManualLog";

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

          {/* -------- NEW ANALYZER ROUTES -------- */}

          <Route path="/auto-fetch" element={<AutoFetch />} />
          <Route path="/upload-log" element={<UploadLog />} />
          <Route path="/manual-log" element={<ManualLog />} />

        </Routes>
      </div>

      <Footer />
    </Router>
  );
}

export default App;