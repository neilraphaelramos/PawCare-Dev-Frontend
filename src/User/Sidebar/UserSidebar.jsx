// src/components/UserSidebar.jsx
import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./UserSidebar.css";
import { UserContext } from "../../hook/authContext";
import { Loader2 } from "lucide-react";
import '../../modal/modal_design.css';

const UserSidebar = () => {
  const { logout, user } = useContext(UserContext);
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleLogoutConfirm = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      logout();
      navigate("/");
      setIsProcessing(false);
      setShowLogoutModal(false);
    }, 1000);
  };

  return (
    <>
      <aside className="user-dashboard-sidebar">
        <div className="user-dashboard-logo">Pawcare</div>
        <nav className="user-dashboard-nav">
          <NavLink to="" end className={({ isActive }) => isActive ? "active" : ""}>Dashboard</NavLink>
          <NavLink to="appointments" className={({ isActive }) => isActive ? "active" : ""}>Appointment</NavLink>
          <NavLink to="pet-records" className={({ isActive }) => isActive ? "active" : ""}>Pet Records</NavLink>
          <NavLink to="pet-infos" className={({ isActive }) => isActive ? "active" : ""}>My Pets</NavLink>
          <NavLink to="pet-products" className={({ isActive }) => isActive ? "active" : ""}>Pet Products</NavLink>
          <NavLink to="online-consultation" className={({ isActive }) => isActive ? "active" : ""}>Online Consultation</NavLink>
          <NavLink to="notification" className={({ isActive }) => isActive ? "active" : ""}>Notification</NavLink>
          <NavLink to="profile" className={({ isActive }) => isActive ? "active" : ""}>Profile</NavLink>
        </nav>
        <button className="user-dashboard-sign-out" onClick={() => setShowLogoutModal(true)}>Sign Out</button>
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

export default UserSidebar;
