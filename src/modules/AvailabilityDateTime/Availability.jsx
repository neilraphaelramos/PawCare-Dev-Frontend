import React, { useState } from "react";
import "./Availability.css";

export default function Availability() {
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");

  const addUnavailableDate = () => {
    if (!selectedDate) return;

    const newItem = {
      date: selectedDate,
      from: timeFrom,
      to: timeTo,
    };

    setUnavailableDates([...unavailableDates, newItem]);
    setSelectedDate("");
    setTimeFrom("");
    setTimeTo("");
  };

  return (
    <div className="availability-container">
      <h2>Veterinarian Availability</h2>

      <div className="availability-form">
        <label>Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <label>Unavailable From</label>
        <input
          type="time"
          value={timeFrom}
          onChange={(e) => setTimeFrom(e.target.value)}
        />

        <label>Unavailable To</label>
        <input
          type="time"
          value={timeTo}
          onChange={(e) => setTimeTo(e.target.value)}
        />

        <button className="add-btn" onClick={addUnavailableDate}>
          Add Unavailable Time
        </button>
      </div>

      <div className="unavailable-list">
        <h3>Marked as Unavailable</h3>
        {unavailableDates.length === 0 ? (
          <p>No unavailable dates yet.</p>
        ) : (
          unavailableDates.map((item, i) => (
            <div key={i} className="unavailable-item">
              <p><strong>{item.date}</strong></p>
              <p>{item.from || "—"} to {item.to || "—"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
