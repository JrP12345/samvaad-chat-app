import React, { useState } from "react";
import Login from "../components/Login";
import Register from "../components/Register";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const Authentication = ({ onAuthChange }) => {
  const [onLoginPage, setOnLoginPage] = useState(true); // Default to login page
  const navigate = useNavigate(); // Hook for navigation

  // Function to handle successful login
  const handleLoginSuccess = () => {
    onAuthChange(true); // Update authentication state in App
    navigate("/"); // Redirect to the main chat page
  };

  return (
    <div className="flex justify-center items-center h-screen">
      {onLoginPage ? (
        <Login
          setOnLoginPage={setOnLoginPage}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <Register setOnLoginPage={setOnLoginPage} />
      )}
    </div>
  );
};

export default Authentication;
