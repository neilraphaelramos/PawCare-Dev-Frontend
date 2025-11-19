import { createContext, useState, useEffect } from "react";
import { googleLogout } from "@react-oauth/google";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [tokenData, setTokenData] = useState(() => {
    const storedTokenData = localStorage.getItem("token");
    return storedTokenData ? JSON.parse(storedTokenData) : null;
  });

  const [allUser, setAllUser] = useState(() => {
    const storedAllData = localStorage.getItem("userList");
    return storedAllData ? JSON.parse(storedAllData) : [];
  });

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Sync token to localStorage
  useEffect(() => {
    if (tokenData) {
      localStorage.setItem("token", JSON.stringify(tokenData));
    } else {
      localStorage.removeItem("token");
    }
  }, [tokenData]);

  // Sync allUser to localStorage (only for Admin)
  useEffect(() => {
    if (user?.role === "Admin") {
      if (allUser) {
        localStorage.setItem("userList", JSON.stringify(allUser));
      } else {
        localStorage.removeItem("userList");
      }
    } else {
      localStorage.removeItem("userList");
    }
  }, [allUser, user]);

  const logout = () => {
    googleLogout();
    setUser(null);
    setAllUser(null);
    setTokenData(null);
    console.log("User logged out");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        logout,
        setAllUser,
        allUser,
        tokenData,
        setTokenData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
