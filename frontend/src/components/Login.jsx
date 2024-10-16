import axios from "axios";
import React, { useState } from "react";
const Login = ({ setOnLoginPage, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleForm = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:4000/auth/login",
        {
          email,
          password,
        },
        { withCredentials: true }
      );
      if (response.data.success) {
        onLoginSuccess();
      } else {
        alert("Login Failed");
      }
    } catch (error) {
      alert("Error Logging");
    }
  };
  return (
    <div className="text-white flex flex-col justify-center items-center">
      <h3 className="text-1xl">Samvaad</h3>
      <h3 className="text-4xl m-2">Hello Again!</h3>
      <form
        onSubmit={handleForm}
        className="flex flex-col justify-center items-center"
      >
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
          Login
        </button>
        <h4>
          Don't have an Account ?{" "}
          <span
            onClick={() => setOnLoginPage((prev) => !prev)}
            className="cursor-pointer text-blue-500 underline"
          >
            Register
          </span>
        </h4>
      </form>
    </div>
  );
};

export default Login;
