import { useState, useEffect } from "react";

type FormData = {
  name: string;
  email: string;
  phone: string;
  location: string;
};

export default function ProfilePage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  const [savedData, setSavedData] = useState<FormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
      const parsed = JSON.parse(stored);
      setFormData(parsed);
      setSavedData(parsed);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("userProfile", JSON.stringify(formData));
    setSavedData(formData);
    setIsEditing(false);
    alert("Profile Updated Successfully");
  };

  const handleUpdateClick = () => setIsEditing(true);

  const handleBack = () => {
    if (savedData) setFormData(savedData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050b18] text-cyan-100 p-4">
      <div
        className={`bg-[#0b1426]/80 backdrop-blur-lg border border-cyan-400
        shadow-[0_0_25px_rgba(34,211,238,0.9)]
        p-8 rounded-xl w-full max-w-md
        transform transition-all duration-500
        ${isEditing ? "scale-105" : "scale-100"}`}
      >
        <h2 className="text-2xl font-bold text-center mb-4 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          {isEditing ? "Update Your Profile" : "User Profile"}
        </h2>

        <form onSubmit={handleSave} className="flex flex-col gap-4">

          {/* Update Fields */}
          {isEditing && (
            <>
              <div>
                <label className="text-cyan-300 text-sm">Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[#111f3b] border border-cyan-400/20 mt-1 focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-cyan-300 text-sm">Email</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[#111f3b] border border-cyan-400/20 mt-1 focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-cyan-300 text-sm">Phone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[#111f3b] border border-cyan-400/20 mt-1 focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-cyan-300 text-sm">Location</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[#111f3b] border border-cyan-400/20 mt-1 focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>
            </>
          )}

          {/* Profile Summary */}
          {!isEditing && savedData && (
            <div className="mt-4 p-4 bg-[#111f3b] rounded border border-cyan-400/20">
              <h3 className="font-semibold text-cyan-300 mb-2">
                Profile Summary
              </h3>
              <p><span className="font-bold">Name:</span> {savedData.name}</p>
              <p><span className="font-bold">Email:</span> {savedData.email}</p>
              <p><span className="font-bold">Phone:</span> {savedData.phone}</p>
              <p><span className="font-bold">Location:</span> {savedData.location}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-3">
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleUpdateClick}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded font-semibold transition shadow-lg shadow-cyan-500/40"
                >
                  Update
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2 rounded font-semibold transition"
                >
                  Logout →
                </button>
              </>
            )}

            {isEditing && (
              <>
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-400 text-black py-2 rounded font-semibold transition"
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-500 hover:bg-gray-400 text-white py-2 rounded font-semibold transition"
                >
                  Back
                </button>
              </>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}