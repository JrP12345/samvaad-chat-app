import React, { useEffect, useState } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Authentication from "./pages/Authentication";
import Chat from "./components/Chat";
import axios from "axios";
import Navbar from "./components/Navbar";
import UserProfile from "./components/UserProfile";
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null indicates loading

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(
          "https://samvaad-chat-app.onrender.com/auth/check",
          {
            withCredentials: true,
          }
        );
        setIsAuthenticated(response.data.isAuthenticated);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false); // or handle error as needed
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // or a loading spinner
  }

  return (
    <Router>
      {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
      <Routes>
        <Route
          path="/auth"
          element={<Authentication onAuthChange={setIsAuthenticated} />}
        />
        <Route
          path="/"
          element={isAuthenticated ? <Chat /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/user-profile"
          element={
            isAuthenticated ? <UserProfile /> : <Navigate to="/auth" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
