import React, { useState, useContext, useEffect } from 'react';
import './Appointments.css';
import axios from 'axios';
import { UserContext } from "../../hook/authContext";

const generateTimeSlots = () => {
  const start = new Date();
  start.setHours(8, 0, 0, 0);
  const end = new Date();
  end.setHours(18, 0, 0, 0);

  const am = [], pm = [];
  let toggle = true;

  while (start < end) {
    const slotStart = new Date(start);
    const slotEnd = new Date(start.getTime() + (toggle ? 45 : 60) * 60000);
    if (slotEnd > end) break;

    const format = (d) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const slot = `${format(slotStart)} - ${format(slotEnd)}`;
    (slotStart.getHours() < 12 ? am : pm).push(slot);

    start.setTime(slotEnd.getTime());
    toggle = !toggle;
  }

  return { am, pm };
};

const Appointment = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [isAM, setIsAM] = useState(false);
  const { am, pm } = generateTimeSlots();
  const { user } = useContext(UserContext);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [messageModal, setMessageModal] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userAppointments, setUserAppointments] = useState([]);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();

  const [unavailableDates, setUnavailableDates] = useState([]);
  const [unavailableTimes, setUnavailableTimes] = useState([]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const selectDate = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (newDate >= today.setHours(0, 0, 0, 0)) {
      setSelectedDate(newDate);
    }
  };

  const handleOpenModal = async () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCloseMessageModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toLocaleDateString('en-CA');
      axios.get(`${process.env.REACT_APP_API_URL}/appointments/${dateStr}`)
        .then(res => setBookedTimes(res.data))
        .catch(err => console.error(err));
    }
  }, [selectedDate]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/appointments/fully-booked`)
      .then(res => {
        setFullyBookedDates(res.data || []);
        console.table(res.data || [])
      })
      .catch(err => console.error("Error fetching fully booked dates:", err));
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/availability/user-only`) // <-- admin-only API
      .then((res) => {
        const { fullDays, times } = res.data;

        // Save full day disabled dates
        setUnavailableDates(fullDays); // [{ date: '2025-01-10', event:'xyz' }]

        // Save partial times
        const timeMap = {};
        times.forEach((t) => {
          if (!timeMap[t.date]) timeMap[t.date] = [];
          timeMap[t.date].push({
            from: t.time_from,
            to: t.time_to,
            event: t.event,
          });
        });

        setUnavailableTimes(timeMap); // { '2025-01-08': [ { from:'09:00', to:'10:00'} ] }
      })
      .catch((err) => console.error("Error fetching availability:", err));
  }, []);

  useEffect(() => {
    const uid = user.id;

    axios.get(`${process.env.REACT_APP_API_URL}/appointments/user/${uid}`)
      .then(res => setUserAppointments(res.data))
      .catch(err => console.error(err));
  }, [user])

  const handleReserve = async () => {
    if (!selectedDate || !selectedTime) {
      setMessageModal("Please select date and time");
      setShowModal(true);
      return;
    }

    const owner_name = `${user?.firstName || ''} ${user?.middleName || ''} ${user?.lastName || ''} ${user?.suffix || ''}`.trim();

    const dateStr = selectedDate.toLocaleDateString('en-CA');

    const readableDate = selectedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const data = {
      set_date: dateStr, // YYYY-MM-DD
      set_time: selectedTime,
      owner_name: owner_name,
      user_id: user.id,
    };

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/appointments`, data);

      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api`, {
          UID: user.id,
          title_notify: "Appointment Reserved",
          type_notify: "Appointment",
          details: `You have successfully reserved an appointment on ${readableDate} at ${selectedTime}. Please wait for confirmation.`,
        });

      } catch (notifyErr) {
        console.error("Notification error:", notifyErr);
      }

      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/notifications/vetadminapi/post`, {
          UID: user.id,
          title_notify: "Appointment Reserved",
          type_notify: "Appointment",
          details: `${owner_name} has reserved an appointment on ${readableDate} at ${selectedTime}.`,
        });
      } catch (NErr) {
        console.error("Notification error:", NErr);
      }

      setShowModal(true);
      setMessageModal(`Appointment reserved on ${res.data.message}`)
      setSelectedDate(null);
      setSelectedTime('');
      setIsAM(false);
      setCurrentDate(new Date());
    } catch (err) {
      console.error(err);
      setMessageModal("Error reserving appointment");
    }
  };

  const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);

  return (
    <div className="appointment-container">
      <div className="left-panel">
        <h3>Schedule an Appointment</h3>
        <div className="duration">🕒 15–20 min</div>
        <div className="info-card">
          <div><strong>DATE</strong></div>
          <div>{selectedDate ? selectedDate.toDateString() : '-'}</div>
          <div><strong>TIME</strong></div>
          <div>{selectedTime || 'Please select a time slot'}</div>
          <br />
          <button className="appoint-view-btn" onClick={handleOpenModal}>
            📅 View My Appointments
          </button>
        </div>
        <div className="actions">
          <button onClick={() => window.location.reload()}>Cancel</button>
          <button className="reserve" onClick={handleReserve}>Reserve Appointment</button>
        </div>
      </div>

      <div className="calendar-panel">
        <h4>Select a Date from below</h4>
        <div className="calendar-header">
          <button onClick={handlePrevMonth}>&lt;</button>
          <span>
            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
          </span>
          <button onClick={handleNextMonth}>&gt;</button>
        </div>
        <div className="calendar-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div className="day-name" key={d}>{d}</div>
          ))}
          {[...Array(startDay === 0 ? 6 : startDay - 1)].map((_, i) => <div key={i}></div>)}
          {daysInMonth.map(day => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD

            const isPast = date < new Date().setHours(0, 0, 0, 0);
            const isSelected =
              selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();

            const isWednesday = date.getDay() === 3;
            const isFullyBooked = fullyBookedDates.includes(dateStr); // just for display
            const fullDateInfo = unavailableDates.find(d => d.date === dateStr);
            const isUnavailable = !!fullDateInfo;  // fully disabled
            const tooltipText = fullDateInfo?.event || "Unavailable";

            const isDisabled = isPast || isWednesday || isUnavailable;

            return (
              <div
                key={day}
                className={`user-calendar-day 
                  ${isFullyBooked ? 'fully-booked' : ''} 
                  ${isDisabled ? 'disabled' : ''} 
                  ${isSelected ? 'selected' : ''}`
                }
                onClick={() => !isDisabled && selectDate(day)}
              >
                {day}
                {isFullyBooked && <span className="tooltip">This date is fully booked</span>}
                {isUnavailable && <span className="tooltip">{tooltipText}</span>}
                {isWednesday && <span className="tooltip">Closed (Wednesday)</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="time-panel">
        <h4>Select a Time from below</h4>
        <div className="toggle-header">
          <button onClick={() => setIsAM(true)}>&lt;</button>
          <span>{isAM ? 'AM' : 'PM'}</span>
          <button onClick={() => setIsAM(false)}>&gt;</button>
        </div>

        <div className="time-grid">
          {(() => {
            const availableSlots = (isAM ? am : pm).filter((slot) => {
              if (!selectedDate) return false;

              const slotStart = new Date(selectedDate);
              const [slotStartStr, slotEndStr] = slot.split(" - "); // e.g. "08:00 AM - 08:45 AM"

              // Parse start
              const [startTime, startMeridian] = slotStartStr.split(" ");
              let [startHour, startMinute] = startTime.split(":").map(Number);
              if (startMeridian === "PM" && startHour !== 12) startHour += 12;
              if (startMeridian === "AM" && startHour === 12) startHour = 0;

              // Parse end
              const [endTime, endMeridian] = slotEndStr.split(" ");
              let [endHour, endMinute] = endTime.split(":").map(Number);
              if (endMeridian === "PM" && endHour !== 12) endHour += 12;
              if (endMeridian === "AM" && endHour === 12) endHour = 0;

              slotStart.setHours(startHour, startMinute, 0, 0);
              const slotEnd = new Date(selectedDate);
              slotEnd.setHours(endHour, endMinute, 0, 0);

              const now = new Date();
              const isToday = selectedDate.toDateString() === now.toDateString();
              const isPast = isToday && slotStart <= now;

              // Check if slot overlaps with unavailable time ranges
              const dateStr = selectedDate.toLocaleDateString("en-CA");
              const blockedRanges = unavailableTimes[dateStr] || [];
              const isBlocked = blockedRanges.some(range => {
                const [bStartHour, bStartMinute] = range.from.split(":").map(Number);
                const [bEndHour, bEndMinute] = range.to.split(":").map(Number);

                const blockedStart = new Date(selectedDate);
                blockedStart.setHours(bStartHour, bStartMinute, 0, 0);
                const blockedEnd = new Date(selectedDate);
                blockedEnd.setHours(bEndHour, bEndMinute, 0, 0);

                return slotStart < blockedEnd && slotEnd > blockedStart; // overlap check
              });

              // Check if already booked
              const isBooked = bookedTimes.includes(slot);

              // Hide if past, blocked, or booked
              return !isPast && !isBlocked && !isBooked;
            });

            if (availableSlots.length === 0) {
              return <div className="no-slots">No available time slots</div>;
            }

            return availableSlots.map((slot, i) => (
              <button
                key={i}
                className={`time-slot ${selectedTime === slot ? "selected" : ""}`}
                onClick={() => setSelectedTime(slot)}
              >
                {slot}
              </button>
            ));
          })()}
        </div>
      </div>
      {isModalOpen && (
        <div className="appoint-modal-overlay" onClick={handleCloseModal}>
          <div className="appoint-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>My Appointments</h3>

            {userAppointments.length > 0 ? (
              <div className="appoint-appointment-list">
                {userAppointments.map((appt, idx) => {
                  const dateObj = new Date(appt.set_date);
                  const formattedDate = dateObj.toLocaleDateString('en-CA');

                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dateObj.setHours(0, 0, 0, 0);
                  const diffTime = today - dateObj;
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                  let relativeText = '';
                  if (diffDays === 0) relativeText = 'Today';
                  else if (diffDays === 1) relativeText = 'Yesterday';
                  else if (diffDays > 1) relativeText = `${diffDays} days ago`;

                  let bookedText = '';
                  if (appt.created_at) {
                    const createdDate = new Date(appt.created_at);
                    const createdDiffDays = Math.floor(
                      (today - new Date(createdDate.setHours(0, 0, 0, 0))) /
                      (1000 * 60 * 60 * 24)
                    );
                    if (createdDiffDays === 0) bookedText = 'Booked Today';
                    else if (createdDiffDays === 1) bookedText = 'Booked Yesterday';
                    else if (createdDiffDays > 1)
                      bookedText = `Booked ${createdDiffDays} days ago`;
                  }

                  return (
                    <div key={idx} className="appoint-appointment-card">
                      <div className="appoint-appointment-row">
                        <span className="appoint-label">Date:</span>
                        <span className="appoint-value">
                          {formattedDate}{' '}
                          {relativeText && (
                            <small className="appoint-relative-text">({relativeText})</small>
                          )}
                        </span>
                      </div>

                      <div className="appoint-appointment-row">
                        <span className="appoint-label">Time:</span>
                        <span className="appoint-value">{appt.set_time}</span>
                      </div>

                      <div className="appoint-appointment-row">
                        <span className="appoint-label">Status:</span>
                        <span className={`appoint-status ${appt.status.toLowerCase()}`}>
                          {appt.status}
                        </span>
                      </div>

                      {appt.status === 'Declined' && (
                        <div className="appoint-appointment-row">
                          <span className="appoint-label">Reason Declined:</span>
                          <span className={`appoint-value`}>
                            {''}
                          </span>
                        </div>
                      )}

                      {bookedText && (
                        <div className="appoint-appointment-row">
                          <span className="appoint-label">📅</span>
                          <span className="appoint-value appoint-booked-text">{bookedText}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No appointments found.</p>
            )}

            {/* Footer buttons */}
            <div className="appoint-modal-footer">
              <button className="appoint-view-btn" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="AppointMessage-overlay" onClick={handleCloseMessageModal}>
          <div
            className="AppointMessage-modal"
            onClick={(e) => e.stopPropagation()} // prevent close on inner click
          >
            <div className="AppointMessage-header">
              <h3>Appointment Notice</h3>
            </div>
            <div className="AppointMessage-body">
              <p>{messageModal}</p>
            </div>
            <div className="AppointMessage-footer">
              <button onClick={handleCloseMessageModal} className="AppointMessage-close-btn">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Appointment;
