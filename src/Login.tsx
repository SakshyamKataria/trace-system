import { useState } from "react";

type Props = {
  onLogin: (status: boolean) => void;
  goToSignup: () => void;
};

function Login({ onLogin, goToSignup }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const stored = localStorage.getItem("userProfile");

    if (!stored) {
      alert("No user found. Please signup.");
      return;
    }

    const user = JSON.parse(stored);

    if (username === user.username && password === user.password) {
      onLogin(true);
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center text-cyan-100 bg-cover bg-center"
      style={{
        backgroundImage:
          "url(https://cdn.staticcrate.com/stock-hd/effects/footagecrate-4k-looping-network-tech-background-blue-1-prev-full.png)"
      }}
    >

      <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/20 p-8 rounded-2xl shadow-[0_0_35px_rgba(34,211,238,0.7)] hover:shadow-[0_0_55px_rgba(34,211,238,0.9)] transition w-80 text-center">

        <h2 className="text-3xl font-bold text-cyan-300 mb-6 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          Login
        </h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 mb-3 rounded bg-[#111f3b] border border-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 rounded bg-[#111f3b] border border-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded font-semibold transition shadow-lg shadow-cyan-500/40"
        >
          Login
        </button>

        <p className="text-cyan-200 mt-4">
          No account?{" "}
          <span
            className="underline cursor-pointer text-cyan-300 hover:text-cyan-200"
            onClick={goToSignup}
          >
            Signup
          </span>
        </p>

      </div>

    </div>
  );
}

export default Login;