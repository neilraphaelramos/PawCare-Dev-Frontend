// src/components/VetSidebar.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import "./VetSidebar.css";
import { UserContext } from "../../hook/authContext";
import { useNavigate } from "react-router-dom";

const VetSidebar = () => {
  const { logout } = useContext(UserContext);
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/");
    logout();
  }


  return (
    <aside className="vet-dashboard-sidebar">
      <div className="vet-dashboard-logo">
        Pawcare
      </div>
      <nav className="vet-dashboard-nav">
        <Link to="">Dashboard</Link>
        <Link to="appointments">Appointments</Link>
        <Link to="medical-records">Medical Records</Link>
        <Link to="inventory">Inventory</Link>
        <Link to="reports">Manage Reports</Link>
        <Link to="notifications">Notifications</Link>
        <Link to="profile">Profile</Link>
        <Link to="online-consultation">Online Consultations</Link>
      </nav>
      <button className="vet-dashboard-sign-out" onClick={handleLogout}>Sign Out</button>
    </aside>
  );
};

export default VetSidebar;
