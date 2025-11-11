// src/components/VetSidebar.jsx
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./VetSidebar.css";
import { UserContext } from "../../hook/authContext";
import { Loader2 } from "lucide-react";
import '../../modal/modal_design.css';

const VetSidebar = () => {
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
          <Link to="online-consultation">Online Consultations</Link>
          <Link to="notifications">Notifications</Link>
          <Link to="profile">Profile</Link>
        </nav>
        <button className="vet-dashboard-sign-out" onClick={() => setShowLogoutModal(true)}>Sign Out</button>
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

export default VetSidebar;
