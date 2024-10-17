import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation

function Navbar({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState();
  // Logout function
  const handleLogout = async () => {
    try {
      // Call the logout API to clear the HttpOnly cookie from the backend
      const response = await fetch(
        "https://samvaad-chat-app.onrender.com/auth/logout",
        {
          method: "POST",
          credentials: "include", // Include cookies in the request
        }
      );

      if (response.ok) {
        alert("Logged out successfully");
        // Redirect to the login page or home page
        setIsAuthenticated(false);
        navigate("/auth");
      } else {
        alert("Failed to log out");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Navigate to the user profile page
  const goToProfile = () => {
    navigate("/user-profile");
  };
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch(
          "https://samvaad-chat-app.onrender.com/auth/userInfo",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
        } else {
          console.error("Failed to fetch user info");
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    fetchUsername();
  }, []);

  return (
    <nav className=" top-0 left-0 right-0 bg-[#1a1a1a06] text-white p-4 shadow-lg flex justify-between items-center z-50">
      {/* Chat Name */}
      <div
        className="text-4xl font-extrabold text-gold cursor-pointer flex justify-center items-center"
        onClick={() => navigate("/")}
      >
        <img src="/logo.gif" alt="Logo" className="h-12 w-12 ml-5 mr-5 " />{" "}
        {/* Fixed size for the GIF */}
        Samvaad
      </div>

      <div className="space-x-6 flex items-center">
        <h3 className="text-white text-2xl">{username}</h3>
        {/* Profile Button */}
        <button
          onClick={goToProfile}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-300 ease-in-out"
        >
          Profile
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition duration-300 ease-in-out"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
