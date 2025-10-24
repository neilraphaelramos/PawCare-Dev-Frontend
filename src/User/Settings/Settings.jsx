// File: ./User/Settings/Settings.jsx
import React, { useState } from "react";
import "./Settings.css";

const Settings = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const updatePassword = (e) => {
    e.preventDefault();
    const { newPassword, confirmPassword } = passwordData;
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    alert("Password updated successfully!");
  };

  const handleToggle = (setter) => () => setter((prev) => !prev);

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account?");
    if (confirmDelete) {
      alert("Your account has been scheduled for deletion.");
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Change Password</h3>
        <form onSubmit={updatePassword}>
          <label>
            Current Password:
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <label>
            New Password:
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <label>
            Confirm New Password:
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <button type="submit">Update Password</button>
        </form>
      </div>

      <div className="settings-section">
        <h3>Preferences</h3>
        <div className="settings-toggle">
          <label>
            <input type="checkbox" checked={notifications} onChange={handleToggle(setNotifications)} />
            Enable Notifications
          </label>
        </div>
        <div className="settings-toggle">
          <label>
            <input type="checkbox" checked={darkMode} onChange={handleToggle(setDarkMode)} />
            Enable Dark Mode
          </label>
        </div>
        <div className="settings-toggle">
          <label>
            <input type="checkbox" checked={twoFactor} onChange={handleToggle(setTwoFactor)} />
            Two-Factor Authentication
          </label>
        </div>
      </div>

      <div className="settings-section danger">
        <h3>Danger Zone</h3>
        <button className="delete-btn" onClick={handleDeleteAccount}>
          Delete My Account
        </button>
      </div>
    </div>
  );
};

export default Settings;
