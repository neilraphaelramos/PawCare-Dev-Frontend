import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { FaHeartbeat, FaThermometerHalf, FaClipboardList, FaFlask, FaBell } from 'react-icons/fa';
import './Notifications.css';
import { UserContext } from '../../hook/authContext';

const typeIcons = {
  Temperature: <FaThermometerHalf className="notif-icon" />,
  'Heart Rate': <FaHeartbeat className="notif-icon" />,
  'Follow-up': <FaClipboardList className="notif-icon" />,
  'Lab Results': <FaFlask className="notif-icon" />,
  default: <FaBell className="notif-icon" />,
};

function NotificationCard({ notification, onMarkRead, onDismiss }) {
  return (
    <div
      className={`notification-card ${notification.isRead === 0 ? 'unread' : ''}`}
      role="listitem"
      onClick={() => onMarkRead(notification.notify_id)}
    >
      <div className="notification-content">
        <span className="type-label">
          {typeIcons[notification.type_notify] || typeIcons.default}
          {notification.type_notify}
        </span>
        <p>{notification.details}</p>
        <span className="timestamp">
          {new Date(notification.notify_date).toLocaleString()}
        </span>
      </div>
      <button
        className="dismiss-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.notify_id);
        }}
      >
        ✕
      </button>
    </div>
  );
}

const TABS = ['All', 'Appointments', 'Online Consultations', 'Stock Alerts'];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const tabsRef = useRef(null);
  const underlineRef = useRef(null);
  const { user } = useContext(UserContext);

  const UID = user.id;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/notifications/vetadminapi/${UID}`
        );
        setNotifications(data);
      } catch (err) {
        console.error('❌ Error fetching notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [UID]);

  const markAsRead = async (notify_id) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/notifications/vetadminapi/setread`, {
        notify_id,
        UID,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.notify_id === notify_id ? { ...n, isRead: 1 } : n))
      );
    } catch (err) {
      console.error('❌ Error marking as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/notifications/vetadminapi/setallread`, { UID });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
    } catch (err) {
      console.error('❌ Error marking all read:', err);
    }
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.notify_id !== id));
  };

  const categorize = (n) => {
    if (n.type_notify.includes('Stock')) return 'Stock Alerts';
    if (n.type_notify.includes('Appointment')) return 'Appointments';
    if (n.type_notify.includes('Consultation')) return 'Online Consultations';
    return 'Other';
  };

  const categorized = notifications.map((n) => ({ ...n, category: categorize(n) }));
  const filtered =
    activeTab === 'All'
      ? categorized
      : categorized.filter((n) => n.category === activeTab);
  const hasUnread = filtered.some((n) => n.isRead === 0);

  useEffect(() => {
    const tabs = tabsRef.current?.querySelectorAll('.tab-button') || [];
    const activeIndex = Array.from(tabs).findIndex((tab) =>
      tab.classList.contains('active')
    );
    if (activeIndex === -1) return;
    const activeTabEl = tabs[activeIndex];
    const underlineEl = underlineRef.current;
    if (underlineEl && activeTabEl) {
      underlineEl.style.width = `${activeTabEl.offsetWidth}px`;
      underlineEl.style.left = `${activeTabEl.offsetLeft}px`;
    }
  }, [activeTab]);

  return (
    <div className="notifications-container">
      <h2 className="notifications-title">Notifications</h2>

      {/* Tabs */}
      <div className="tabs" ref={tabsRef}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        <div className="tabs-underline" ref={underlineRef} />
      </div>

      {filtered.length > 0 && hasUnread && (
        <button className="mark-all-btn" onClick={markAllRead}>
          Mark all as read
        </button>
      )}

      {filtered.length === 0 ? (
        <p className="empty-text">No notifications in this category.</p>
      ) : (
        <div className="notification-list" role="list">
          {filtered.map((n, index) => (
            <NotificationCard
              key={`${n.notify_id}-${index}`}
              notification={n}
              onMarkRead={markAsRead}
              onDismiss={dismissNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
