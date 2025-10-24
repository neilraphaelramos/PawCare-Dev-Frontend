import React, { useState, useEffect, useRef } from 'react';
import { FaHeartbeat, FaThermometerHalf, FaClipboardList, FaFlask, FaBell } from 'react-icons/fa';
import './Notifications.css';

const systemAlertsData = [
  {
    id: 1,
    type: 'Inventory',
    message: 'Amoxicillin stock is low. Only 5 bottles left.',
    timestamp: 'Just now',
    unread: true,
    priority: true,
    category: 'Stock Alerts',
  },
  {
    id: 2,
    type: 'Heart Rate',
    message: 'Elevated heart rate detected for Bella.',
    timestamp: '3 minutes ago',
    unread: true,
    priority: false,
    category: 'Stock Alerts',
  },
];

const remindersData = [
  {
    id: 101,
    type: 'Follow-up',
    message: 'Follow-up check for Max on June 3, 2025 at 10:00 AM.',
    timestamp: 'Tomorrow',
    unread: false,
    priority: false,
    category: 'Appointments',
  },
  {
    id: 102,
    type: 'Lab Results',
    message: 'Review lab results for Bella’s blood test.',
    timestamp: 'Today',
    unread: true,
    priority: false,
    category: 'Online Consultations',
  },
];

const typeIcons = {
  Temperature: <FaThermometerHalf className="notif-icon" aria-hidden="true" />,
  'Heart Rate': <FaHeartbeat className="notif-icon" aria-hidden="true" />,
  'Follow-up': <FaClipboardList className="notif-icon" aria-hidden="true" />,
  'Lab Results': <FaFlask className="notif-icon" aria-hidden="true" />,
  default: <FaBell className="notif-icon" aria-hidden="true" />,
};

function NotificationCard({ notification, onDismiss }) {
  return (
    <div
      className={`notification-card ${notification.priority ? 'priority' : ''} ${
        notification.unread ? 'unread' : ''
      }`}
      role="listitem"
      aria-label={`${notification.type} notification: ${notification.message}`}
    >
      <div className="notification-content">
        <span className="type-label">
          {typeIcons[notification.type] || typeIcons.default}
          {notification.type}
        </span>
        <p>{notification.message}</p>
        <span className="timestamp" title={`Received: ${notification.timestamp}`}>
          {notification.timestamp}
        </span>
      </div>
      <button
        className="dismiss-btn"
        onClick={() => onDismiss(notification.id)}
        aria-label={`Dismiss ${notification.type} notification`}
      >
        ✕
      </button>
    </div>
  );
}

const TABS = ['All', 'Appointments', 'Online Consultations', 'Stock Alerts'];

export default function Notifications() {
  const [systemAlerts, setSystemAlerts] = useState(systemAlertsData);
  const [reminders, setReminders] = useState(remindersData);
  const [activeTab, setActiveTab] = useState('All');

  const tabsRef = useRef(null);
  const underlineRef = useRef(null);

  useEffect(() => {
    const tabs = tabsRef.current.querySelectorAll('.tab-button');
    const activeIndex = Array.from(tabs).findIndex((tab) => tab.classList.contains('active'));

    if (activeIndex === -1) return;

    const activeTabEl = tabs[activeIndex];
    const underlineEl = underlineRef.current;

    if (underlineEl && activeTabEl) {
      underlineEl.style.width = `${activeTabEl.offsetWidth}px`;
      underlineEl.style.left = `${activeTabEl.offsetLeft}px`;
    }
  }, [activeTab]);

  const dismissSystemAlert = (id) => {
    setSystemAlerts((prev) => prev.filter((n) => n.id !== id));
  };

  const dismissReminder = (id) => {
    setReminders((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAlertsRead = () => {
    setSystemAlerts((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markAllRemindersRead = () => {
    setReminders((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const allNotifications = [...systemAlerts, ...reminders];

  const filteredNotifications =
    activeTab === 'All' ? allNotifications : allNotifications.filter((n) => n.category === activeTab);

  const handleDismiss = (id) => {
    if (systemAlerts.find((n) => n.id === id)) {
      dismissSystemAlert(id);
    } else {
      dismissReminder(id);
    }
  };

  const markAllReadForTab = () => {
    if (activeTab === 'Stock Alerts') markAllAlertsRead();
    else if (activeTab === 'Appointments' || activeTab === 'Online Consultations') markAllRemindersRead();
    else {
      markAllAlertsRead();
      markAllRemindersRead();
    }
  };

  const hasUnread = filteredNotifications.some((n) => n.unread);

  return (
    <div className="notifications-container" role="region" aria-label="User notifications">
      <h2 className="vet-notifications-title">Notifications</h2>

      {/* Tabs */}
      <div className="tabs" role="tablist" aria-label="Notification categories" ref={tabsRef}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            aria-selected={activeTab === tab}
            role="tab"
            tabIndex={activeTab === tab ? 0 : -1}
          >
            {tab}
          </button>
        ))}
        {/* Underline bar */}
        <div className="tabs-underline" ref={underlineRef} />
      </div>

      {filteredNotifications.length > 0 && hasUnread && (
        <button
          className="mark-all-btn"
          onClick={markAllReadForTab}
          aria-label={`Mark all ${activeTab.toLowerCase()} notifications as read`}
        >
          Mark all as read
        </button>
      )}

      {filteredNotifications.length === 0 ? (
        <p className="empty-text">No notifications in this category.</p>
      ) : (
        <div className="notification-list" role="list" aria-live="polite" aria-relevant="additions removals">
          {filteredNotifications.map((n) => (
            <NotificationCard key={n.id} notification={n} onDismiss={handleDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}
