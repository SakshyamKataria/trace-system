import { useState } from "react";

type Props = {
  goToLogin: () => void;
};

function Signup({ goToLogin }: Props) {

  const [user, setUser] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: ""
  });

  const handleChange = (e: any) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSignup = () => {

    if (
      !user.username ||
      !user.password ||
      !user.name ||
      !user.email ||
      !user.phone
    ) {
      alert("Please fill all fields");
      return;
    }

    localStorage.setItem("userProfile", JSON.stringify(user));

    alert("Signup successful");

    goToLogin();
  };

  return (

    <div
      className="h-screen flex items-center justify-center text-cyan-100 bg-cover bg-center"
      style={{
        backgroundImage:
          "url(https://cdn.staticcrate.com/stock-hd/effects/footagecrate-4k-looping-network-tech-background-blue-1-prev-full.png)"
      }}
    >

      <div className="bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400/40 p-8 rounded-xl w-96 shadow-[0_0_25px_rgba(34,211,238,0.7)] hover:shadow-[0_0_40px_rgba(34,211,238,0.9)] transition">

        <h2 className="text-2xl mb-6 text-center font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          Signup
        </h2>

        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          className="w-full p-2 mb-2 rounded bg-[#111f3b] border border-cyan-400/20 focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-2 mb-2 rounded bg-[#111f3b] border border-cyan-400/20 focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          className="w-full p-2 mb-2 rounded bg-[#111f3b] border border-cyan-400/20 focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full p-2 mb-2 rounded bg-[#111f3b] border border-cyan-400/20 focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          className="w-full p-2 mb-2 rounded bg-[#111f3b] border border-cyan-400/20 focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <button
          onClick={handleSignup}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded mt-4 font-semibold transition shadow-lg shadow-cyan-500/40"
        >
          Signup
        </button>

        <p className="text-center text-sm text-cyan-200 mt-4">
          Already have an account?{" "}
          <span
            onClick={goToLogin}
            className="cursor-pointer underline text-cyan-300 hover:text-cyan-200"
          >
            Login
          </span>
        </p>

      </div>

    </div>

  );
}

export default Signup;