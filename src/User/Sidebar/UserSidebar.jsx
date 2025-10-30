// src/components/UserSidebar.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import "./UserSidebar.css"; 
import { UserContext } from "../../hook/authContext";
import { useNavigate } from "react-router-dom";

const UserSidebar = () => {
  const { logout } = useContext(UserContext);
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/");
    logout();
  }

  return (
    <aside className="user-dashboard-sidebar">
      <div className="user-dashboard-logo">Pawcare</div>
      <nav className="user-dashboard-nav">
        <Link to="">Dashboard</Link>
        <Link to="appointments">Appointment</Link>
        <Link to="pet-records">Pet Records</Link>
        <Link to="pet-infos">My Pets</Link>
        <Link to="pet-products">Pet Products</Link>
        <Link to="notification">Notification</Link>
        <Link to="online-consultation">Online Consultation</Link>
        <Link to="profile">Profile</Link>
      </nav>
      <button className="user-dashboard-sign-out" onClick={handleLogout}>Sign Out</button>
    </aside>
  );
};

export default UserSidebar;
