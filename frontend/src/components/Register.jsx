import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
const Register = ({ setOnLoginPage }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleForm = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://samvaad-chat-app.onrender.com/auth/register",
        {
          username,
          email,
          password,
        },
        { withCredentials: true }
      );
      if (response.data.success) {
        setOnLoginPage(true);
      } else {
        alert("Registration Failed");
      }
    } catch (error) {
      alert("Error Registering");
    }
  };
  return (
    <div className="text-white flex flex-col justify-center items-center">
      <h3 className="text-1xl">Samvaad</h3>
      <h3 className="text-4xl m-2">Create an Account</h3>
      <form
        onSubmit={handleForm}
        className="flex flex-col justify-center items-center"
      >
        <input
          type="text"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          className="p-2 m-3 text-black w-64"
        />
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 m-3 text-black w-64"
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 m-3 text-black w-64"
        />
        <button type="submit" className="bg-green-500 w-64 p-2 m-3">
          Register
        </button>
        <h4>
          Already have an Account?{" "}
          <span
            onClick={() => setOnLoginPage((prev) => !prev)}
            className="cursor-pointer text-blue-500 underline"
          >
            Login
          </span>
        </h4>
      </form>
    </div>
  );
};

export default Register;
