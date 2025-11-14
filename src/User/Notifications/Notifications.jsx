import React, { useState, useEffect, useContext } from "react";
import io from "socket.io-client";
import "./Notifications.css";
import { UserContext } from "../../hook/authContext";
import axios from "axios";

const socket = io(process.env.REACT_APP_API_URL);
function NotificationCard({ notification, onDismiss }) {
  return (
    <div className="notification-card">
      <div className="notification-content">
        <strong className="type-label">{notification.title_notify}</strong>

        <div className="user-notify-type-tag">{notification.type_notify}</div>

        <p>{notification.details}</p>
        <span className="timestamp">{new Date(notification.notify_date).toLocaleString()}</span>
      </div>
      <button className="dismiss-btn" onClick={() => onDismiss(notification.notify_id)}>✕</button>
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const { user } = useContext(UserContext); // ✅ move inside the component
  const userId = user?.id;

  // Fetch initial notifications
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/notifications/api/${userId}`)
      .then(res => res.json())
      .then(data => setNotifications(data));
  }, [userId]);

  // Listen for real-time notifications
  useEffect(() => {
    socket.emit("registerUser", userId);

    socket.on("newNotification", data => {
      setNotifications(prev => [data, ...prev]);
    });

    return () => {
      socket.off("newNotification");
    };
  }, [userId]);

  const dismissNotification = (id) => {
    clearNotification(id)
  };

  const clearNotification = async (notify_id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/notifications/api/remove/${notify_id}`,
        { notify_id }
      );

      setNotifications((prev) => prev.filter((n) => n.notify_id !== notify_id));
    } catch (err) {
      console.error("❌ Error clearing notification:", err);
    }
  };

  return (
    <div className="notifications-container">
      <h2 className="user-notifications-title">Notifications</h2>
      {notifications.length === 0 ? (
        <p className="empty-text">No notifications yet.</p>
      ) : (
        <div className="notification-list">
          {notifications.map(n => (
            <NotificationCard key={n.notify_id} notification={n} onDismiss={dismissNotification} />
          ))}
        </div>
      )}
    </div>
  );
}
