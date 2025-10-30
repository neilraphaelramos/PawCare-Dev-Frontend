import React, { useState, useEffect, useContext } from "react";
import io from "socket.io-client";
import "./Notifications.css";
import { UserContext } from "../../hook/authContext";

const socket = io(process.env.REACT_APP_SOCKET_URL);
function NotificationCard({ notification, onDismiss }) {
  return (
    <div className="notification-card">
      <div className="notification-content">
        <strong className="type-label">{notification.type_notify}</strong>
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
    fetch(`/server-api/notifications/api/${userId}`)
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

  const dismissNotification = id => {
    setNotifications(prev => prev.filter(n => n.notify_id !== id));
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
