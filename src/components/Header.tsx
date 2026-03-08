import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const location = useLocation();
  const [clickedLink, setClickedLink] = useState<string | null>(null);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Log Analyzer", path: "/analyzer" },
    { name: "History", path: "/history" },
    { name: "Profile", path: "/profile" },
  ];

  const handleClick = (name: string) => {
    setClickedLink(name);
    // Remove click effect after short delay
    setTimeout(() => setClickedLink(null), 200);
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-black border-b border-blue-400 shadow-[0_0_12px_#00f6ff]">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">

        {/* Logo */}
        <h1 className="text-2xl font-bold tracking-wide text-cyan-300 transition duration-300 hover:drop-shadow-[0_0_15px_#00f6ff]">
          Log Analyzer 🚀
        </h1>

        {/* Navigation */}
        <nav className="flex gap-8 text-lg">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const isClicked = clickedLink === link.name;

            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => handleClick(link.name)}
                className={`
                  text-cyan-200 transition duration-300
                  hover:text-cyan-100 hover:drop-shadow-[0_0_15px_#00f6ff]
                  ${isActive ? "text-cyan-100 drop-shadow-[0_0_20px_#00f6ff]" : ""}
                  ${isClicked ? "scale-110 drop-shadow-[0_0_25px_#00f6ff]" : "scale-100"}
                  transform
                `}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}