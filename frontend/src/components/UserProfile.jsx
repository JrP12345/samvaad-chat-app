import React, { useState, useEffect } from "react";

function UserProfile() {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    // Add other user fields as needed
  });

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:4000/auth/userInfo", {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="p-6 bg-opacity-90 bg-[#1a1a1a] rounded-lg shadow-2xl max-w-md mx-auto mt-10">
      <h1 className="text-4xl font-extrabold text-gold mb-6 text-center">
        User Profile
      </h1>

      <div className="text-white space-y-4">
        <div>
          <span className="font-semibold">Username:</span> {userData.username}
        </div>
        <div>
          <span className="font-semibold">Email:</span> {userData.email}
        </div>
        {/* Add other non-editable fields as needed */}
      </div>
    </div>
  );
}

export default UserProfile;
