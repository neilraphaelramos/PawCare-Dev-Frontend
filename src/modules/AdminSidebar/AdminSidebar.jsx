import React, { useContext } from "react";
import { Link } from "react-router-dom";
import "./AdminSidebar.css"; 
import { UserContext } from "../../hook/authContext";
import { useNavigate } from "react-router-dom";

const AdminSidebar = () => {
  const { logout } = useContext(UserContext);
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/");
    logout();
  }

  return (
    <aside className="admin-dashboard-sidebar">
      <div className="admin-dashboard-logo">Pawcare</div>
      <nav className="admin-dashboard-nav">
        <Link to="">Dashboard</Link>       
        <Link to="medical-records">Pet Medical Records</Link>
        <Link to="appointments">Appointment</Link>
        <Link to="online-consultation">Online Consultation</Link>
        <Link to="notifications">Notifications</Link>
        <Link to="view-orders">Manage Orders</Link>   
        <Link to="inventory">Manage Inventory</Link>
        <Link to="services">Manage Services</Link>
        <Link to="features">Manage Features</Link> 
        <Link to="announcements">Announcements</Link>
        <Link to="accounts">Manage Accounts</Link>
      </nav>
      <button className="admin-dashboard-sign-out" onClick={handleLogout}>Sign Out</button>
    </aside>
  );
};

export default AdminSidebar;