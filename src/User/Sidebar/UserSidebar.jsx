// src/components/UserSidebar.jsx
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserSidebar.css";
import { UserContext } from "../../hook/authContext";
import { Loader2 } from "lucide-react";
import '../../modal/modal_design.css';

const UserSidebar = () => {
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
