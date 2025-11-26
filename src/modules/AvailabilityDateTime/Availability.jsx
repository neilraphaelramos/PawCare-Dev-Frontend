import React, { useState, useEffect, useContext } from "react";
import "./Availability.css";
import '../../modal/modal_design.css';
import { UserContext } from "../../hook/authContext";
import axios from 'axios';

const formatTimeAMPM = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  let h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h === 0 ? 12 : h;
  return `${h}:${minutes} ${ampm}`;
};


export default function Availability() {
  const { user } = useContext(UserContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const [unavailableDates, setUnavailableDates] = useState([]); // {date, full_day, event}
  const [unavailableTimes, setUnavailableTimes] = useState([]); // {date, from, to, event}

  const [showModal, setShowModal] = useState(false);

  const [disableFullDay, setDisableFullDay] = useState(false);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [eventText, setEventText] = useState("");

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState("");

  const adminName = `${user.firstName}, ${user.lastName}`;

  const isWednesday = (dateObj) => {
    return dateObj.getDay() === 3;
  };

  const hasPartialTime = (yyyy_mm_dd) => {
    return unavailableTimes.some((t) => t.date === yyyy_mm_dd);
  };

  const resetForm = () => {
    setDisableFullDay(false);
    setTimeFrom("");
    setTimeTo("");
    setEventText("");
  }

  const loadUnavailable = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/availability/${user.id}`);
      const fullDays = (res.data.fullDays || []).map(d => ({ ...d, date: d.date.split('T')[0] }));
      const times = (res.data.times || []).map(t => ({ ...t, date: t.date.split('T')[0] }));
      setUnavailableDates(fullDays);
      setUnavailableTimes(times);
      console.log(times);
    } catch (err) {
      console.error("Error loading availability", err);
    }
  };

  useEffect(() => {
    loadUnavailable();
  }, []);

  const today = new Date();

  /* ---------------------- */
  /*  Calendar Calculations */
  /* ---------------------- */

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const selectDate = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (newDate >= today.setHours(0, 0, 0, 0)) {
      setSelectedDate(newDate);
      setShowModal(true);
    }
  };

  /* ---------------------- */
  /* Save Unavailability    */
  /* ---------------------- */
  const saveUnavailable = async () => {
    if (!selectedDate) return;

    const dateStr = selectedDate.toLocaleDateString("en-CA");

    if (!eventText.trim()) {
      setMessageModal("Please enter an event description.");
      setShowMessageModal(true);
      return;
    }

    try {
      if (disableFullDay) {
        await axios.post(`${process.env.REACT_APP_API_URL}/availability/add-full-day`, {
          user_id: user.id,
          date: dateStr,
          event: eventText,
          role: user.role,
          setBy: adminName,
        });
      } else {
        if (!timeFrom || !timeTo) {
          setMessageModal("Please enter a valid time range.");
          setShowMessageModal(true);
          return;
        }
        await axios.post(`${process.env.REACT_APP_API_URL}/availability/add-time`, {
          user_id: user.id,
          date: dateStr,
          time_from: timeFrom,
          time_to: timeTo,
          event: eventText,
          role: user.role,
          setBy: adminName,
        });
      }

      await loadUnavailable(); // refresh list
      setDisableFullDay(false);
      setTimeFrom("");
      setTimeTo("");
      setEventText("");
      setShowModal(false);

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setMessageModal(err.response.data.message);
      } else {
        setMessageModal("An unexpected error occurred. Please try again.");
      }
      setShowMessageModal(true);
      console.error("Error saving availability", err);
    }
  };

  /* ---------------------- */
  /*  Delete Unavailability */
  /* ---------------------- */
  const deleteFullDay = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/availability/delete-full-day/${id}`);
      await loadUnavailable();
    } catch (err) {
      console.error("Error deleting full day", err);
    }
  };

  const deleteTimeRange = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/availability/delete-time/${id}`);
      await loadUnavailable();
    } catch (err) {
      console.error("Error deleting time range", err);
    }
  };

  /* ---------------------- */
  /* Check if date blocked  */
  /* ---------------------- */
  const isDayBlocked = (yyyy_mm_dd) => {
    return unavailableDates.some((d) => d.date === yyyy_mm_dd);
  };

  return (
    <div className="admin-availability-container">
      <h2 className="admin-title">Availability Manager</h2>

      {/* ---------------------- */}
      {/*       CALENDAR         */}
      {/* ---------------------- */}
      <div className="admin-calendar-panel">
        <div className="admin-calendar-header">
          <button onClick={handlePrevMonth} className="admin-month-btn">&lt;</button>
          <span>
            {currentDate.toLocaleString("default", { month: "long" })}{" "}
            {currentDate.getFullYear()}
          </span>
          <button onClick={handleNextMonth} className="admin-month-btn">&gt;</button>
        </div>

        <div className="admin-calendar-grid">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div className="admin-day-name" key={d}>{d}</div>
          ))}

          {Array(startDay === 0 ? 6 : startDay - 1)
            .fill(null)
            .map((_, i) => (
              <div key={i}></div>
            ))}

          {daysInMonth.map((day) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = date.toLocaleDateString("en-CA");
            const partialTime = hasPartialTime(dateStr);
            const isPast = date < new Date().setHours(0, 0, 0, 0);

            // auto-disable every Wednesday
            const autoWednesday = isWednesday(date);

            // full day blocked
            const fullDayBlocked = isDayBlocked(dateStr);

            // determine if blocked for click
            const blockedForClick = isPast || autoWednesday || fullDayBlocked;

            const isSelected =
              selectedDate &&
              dateStr === selectedDate.toLocaleDateString("en-CA");

            // -------------------------
            // TOOLTIP LOGIC
            // -------------------------
            const fullDay = unavailableDates.find(d => d.date === dateStr);
            const timeBlocks = unavailableTimes.filter(t => t.date === dateStr);

            let tooltipText = "";
            if (fullDay) {
              tooltipText = `${fullDay.event}`; // show role if available
            } else if (timeBlocks.length > 0) {
              tooltipText = timeBlocks
                .map(t => `${formatTimeAMPM(t.time_from)}-${formatTimeAMPM(t.time_to)} (${t.event})`)
                .join(", ");
            }

            return (
              <div
                key={day}
                className={`admin-calendar-day 
                  ${isPast ? "admin-disabled" : ""}
                  ${autoWednesday ? "admin-wednesday" : ""}
                  ${fullDayBlocked ? "admin-blocked" : ""}
                  ${partialTime ? "admin-partial-time" : ""}
                  ${isSelected ? "admin-selected" : ""}
                `}
                onClick={() => {
                  if (!blockedForClick) {
                    selectDate(day);
                  }
                }}
              >
                {day}
                {tooltipText && <span className="admin-tooltip">{tooltipText}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------- */}
      {/*   Unavailable Lists    */}
      {/* ---------------------- */}
      <div className="admin-unavailable-section">
        <h3 className="admin-title">Unavailable Dates & Events</h3>

        {unavailableDates.length === 0 && unavailableTimes.length === 0 ? (
          <p>No events added.</p>
        ) : (
          <div className="admin-unavailable-list">
            {/* Combine full days and time ranges into one list */}
            {[...unavailableDates.map(d => ({ ...d, type: 'fullDay' })),
            ...unavailableTimes.map(t => ({ ...t, type: 'timeRange' }))]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // sort by created_at descending
              .map((item, i) => (
                <div key={i} className="admin-unavailable-item">
                  <strong>{item.date}</strong> — {item.type === 'fullDay' ? 'Full Day' : `${formatTimeAMPM(item.time_from)} to ${formatTimeAMPM(item.time_to)}`} —
                  <em>{item.event}</em> —
                  <span className="admin-set-by">Set by: {item.setBy}</span>
                  <button
                    className="admin-delete-btn"
                    onClick={() => item.type === 'fullDay' ? deleteFullDay(item.id) : deleteTimeRange(item.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ---------------------- */}
      {/*         MODAL          */}
      {/* ---------------------- */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Set Unavailability or Event</h3>

            <p>
              Selected date:{" "}
              <strong>{selectedDate?.toLocaleDateString("en-CA")}</strong>
            </p>

            <label className="admin-input-label">Event Description:</label>
            <input
              type="text"
              className="admin-input-text"
              placeholder="Holiday, Meeting, etc..."
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
            />

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={disableFullDay}
                onChange={(e) => setDisableFullDay(e.target.checked)}
              />
              Mark entire day unavailable
            </label>

            {!disableFullDay && (
              <>
                <label className="admin-input-label">From:</label>
                <input
                  type="time"
                  className="admin-input-time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                />

                <label className="admin-input-label">To:</label>
                <input
                  type="time"
                  className="admin-input-time"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                />
              </>
            )}

            <div className="admin-modal-actions">
              <button className="admin-save-btn" onClick={saveUnavailable}>
                Save
              </button>
              <button className="admin-cancel-btn" onClick={() => {
                resetForm();
                setShowModal(false);
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="All-Message-modal-overlay">
          <div className="All-Message-modal">
            <div className="All-Message-modal-header">
              <h2>Alert Message</h2>
            </div>

            <div className="All-Message-modal-body">
              <p>{messageModal}</p>
            </div>

            <div className="All-Message-modal-footer">
              <button
                className="All-Message-close-btn"
                onClick={() => setShowMessageModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
