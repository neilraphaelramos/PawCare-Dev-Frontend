import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";
import { UserContext } from "../../hook/authContext";
import { Loader2 } from "lucide-react";
import '../../modal/modal_design.css';

const AdminSidebar = () => {
  const { logout } = useContext(UserContext);
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleLogoutConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      navigate("/");
      logout();
      setIsProcessing(false);
      setShowLogoutModal(false);
    }, 1000);
  }

  return (
    <>
      <aside className="admin-dashboard-sidebar">
        <div className="admin-dashboard-logo">Pawcare</div>
        <nav className="admin-dashboard-nav">
          <NavLink to="" end className={({ isActive }) => isActive ? "active" : ""}>Dashboard</NavLink>

          <NavLink to="appointments" className={({ isActive }) => isActive ? "active" : ""}>
            Appointment
          </NavLink>

          <NavLink to="medical-records" className={({ isActive }) => isActive ? "active" : ""}>
            Pet Medical Records
          </NavLink>

          <NavLink to="online-consultation" className={({ isActive }) => isActive ? "active" : ""}>
            Online Consultation
          </NavLink>

          <NavLink to="notifications" className={({ isActive }) => isActive ? "active" : ""}>
            Notifications
          </NavLink>

          <NavLink to="reports" className={({ isActive }) => isActive ? "active" : ""}>
            Manage Reports
          </NavLink>

          <NavLink to="view-orders" className={({ isActive }) => isActive ? "active" : ""}>
            Manage Orders
          </NavLink>

          <NavLink to="inventory" className={({ isActive }) => isActive ? "active" : ""}>
            Manage Inventory
          </NavLink>

          <NavLink to="services" className={({ isActive }) => isActive ? "active" : ""}>
            Manage Services
          </NavLink>

          <NavLink to="features" className={({ isActive }) => isActive ? "active" : ""}>
            Manage Features
          </NavLink>

          <NavLink to="announcements" className={({ isActive }) => isActive ? "active" : ""}>
            Announcements
          </NavLink>

          <NavLink to="accounts" className={({ isActive }) => isActive ? "active" : ""}>
            Manage Accounts
          </NavLink>
        </nav>
        <button className="admin-dashboard-sign-out" onClick={() => setShowLogoutModal(true)}>Sign Out</button>
      </aside>

      {showLogoutModal && (
        <div
          className="All-logoutconfirm-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="All-logoutconfirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="All-logoutconfirm-title">Confirm Logout</h3>
            <p className="All-logoutconfirm-message">
              Are you sure you want to log out from your account?
            </p>
            <div className="All-logoutconfirm-actions">
              <button
                className="All-logoutconfirm-btn confirm"
                onClick={handleLogoutConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    Logging out...{" "}
                    <Loader2 size={16} className="feature-spinner" />
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
              <button
                className="All-logoutconfirm-btn cancel"
                onClick={() => setShowLogoutModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>

  );
};

export default AdminSidebar;