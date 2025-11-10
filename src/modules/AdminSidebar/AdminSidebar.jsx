import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
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
          <Link to="">Dashboard</Link>
          <Link to="medical-records">Pet Medical Records</Link>
          <Link to="appointments">Appointment</Link>
          <Link to="online-consultation">Online Consultation</Link>
          <Link to="notifications">Notifications</Link>
          <Link to="reports">Manage Reports</Link>
          <Link to="view-orders">Manage Orders</Link>
          <Link to="inventory">Manage Inventory</Link>
          <Link to="services">Manage Services</Link>
          <Link to="features">Manage Features</Link>
          <Link to="announcements">Announcements</Link>
          <Link to="accounts">Manage Accounts</Link>
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