import React, { useState, useEffect, useContext } from 'react';
import './AdminAppointments.css';
import '../../modal/modal_design.css'
import axios from 'axios';
import { UserContext } from '../../hook/authContext';

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
  const [isAM, setIsAM] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineData, setDeclineData] = useState(null);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [unavailableTimes, setUnavailableTimes] = useState([]);

  const { am, pm } = generateTimeSlots();

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const selectedAppointment = appointments.find(a => a.set_time === selectedSlot);

  const selectDate = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (newDate >= today.setHours(0, 0, 0, 0)) {
      setSelectedDate(newDate);
      setSelectedSlot(null);
    }
  };

  const updateStatus = async (id, status, uid, setDate, setTime, reason = "") => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/appointments/${id}/status`, { status, reason })
      setAppointments(
        prev => prev.map(a => a.id_appoint === id ? { ...a, status } : a)
      );

      const readableDate = new Date(setDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const details =
        status === "Approved"
          ? `Your appointment on ${readableDate} at ${setTime} has been approved.`
          : `Your appointment on ${readableDate} at ${setTime} has been declined. Reason: ${reason}`;

      await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api`, {
        UID: uid,
        title_notify: `Appointment ${status}`,
        type_notify: "Appointment",
        details,
      });

      await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api/send-notification`, {
        UID: uid,
        type: "Appointment",
        title: `Appointment ${status}`,
        message: details,
        mess:  'Request Received',
        mess2: 'we have received your Appointment request'
      });

      fetchAppoint(selectedDate);
    } catch (error) {
      console.error(error)
    }
  };

  const fetchAppoint = (date) => {
    if (date) {
      const dateStr = date.toLocaleDateString('en-CA');
      axios.get(`${process.env.REACT_APP_API_URL}/appointments/vets/${dateStr}`)
        .then(res => {
          console.log('Appointments fetched:', res.data);
          setAppointments(res.data);
        })
        .catch(err => console.error(err));
    }
  }

  useEffect(() => {
    fetchAppoint(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/appointments/fully-booked`)
      .then(res => {
        console.log("✅ Fully booked dates:", res.data);
        setFullyBookedDates(res.data || []);
      })
      .catch(err => console.error("Error fetching fully booked dates:", err));
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/availability`)
      .then(res => {
        const { fullDays, times } = res.data;

        // Filter only admin entries
        const adminFullDays = fullDays.filter(d => d.role === 'Admin');
        const adminTimes = times.filter(t => t.role === 'Admin');

        // Full-day unavailable dates with event
        const fullDates = adminFullDays.map(d => ({
          date: d.date,
          event: d.event || "Unavailable" // default if no event provided
        }));
        setUnavailableDates(fullDates);

        // Partial time ranges grouped by date
        const timeMap = {};
        adminTimes.forEach(t => {
          if (!timeMap[t.date]) timeMap[t.date] = [];
          timeMap[t.date].push({
            time: `${t.time_from} - ${t.time_to}`,
            event: t.event || "Unavailable"
          });
        });
        setUnavailableTimes(timeMap);

        console.log("Full days (Admin only):", fullDates);
        console.log("Partial times (Admin only):", timeMap);
      })
      .catch(err => console.error("Error fetching unavailable data:", err));
  }, []);

  const filterSlots = (slots) => {
    if (!selectedDate) return [];

    const dateStr = selectedDate.toLocaleDateString('en-CA');
    const blockedSlots = unavailableTimes[dateStr] || []; // array of objects now

    return slots.filter(slot => {
      const [slotStartStr, slotEndStr] = slot.split(" - ");

      const parseTime = (timeStr) => {
        if (!timeStr) return { hour: 0, minute: 0 };
        const [time, meridian] = timeStr.split(" ");
        let [hour, minute] = time.split(":").map(Number);
        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
        return { hour, minute };
      };

      const startTime = parseTime(slotStartStr);
      const endTime = parseTime(slotEndStr);

      const slotStart = new Date(selectedDate);
      slotStart.setHours(startTime.hour, startTime.minute, 0, 0);
      const slotEnd = new Date(selectedDate);
      slotEnd.setHours(endTime.hour, endTime.minute, 0, 0);

      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      const isPast = isToday && slotStart <= now;

      // ✅ Use blocked.time instead of blocked directly
      const isBlocked = blockedSlots.some(blocked => {
        if (!blocked.time) return false;

        const [bStartStr, bEndStr] = blocked.time.split(" - ");
        const bStart = parseTime(bStartStr);
        const bEnd = parseTime(bEndStr);

        const blockedStart = new Date(selectedDate);
        blockedStart.setHours(bStart.hour, bStart.minute, 0, 0);
        const blockedEnd = new Date(selectedDate);
        blockedEnd.setHours(bEnd.hour, bEnd.minute, 0, 0);

        return slotStart < blockedEnd && slotEnd > blockedStart;
      });

      return !isPast && !isBlocked;
    });
  };

  return (
    <div className="appointment-container">
      <div className="calendar-panel">
        <h4>Select a Date</h4>
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
                className={`admin-calendar-day 
                  ${isFullyBooked ? 'admin-fully-booked' : ''} 
                  ${isDisabled ? 'admin-disabled' : ''} 
                  ${isSelected ? 'selected' : ''}`
                }
                onClick={() => !isDisabled && selectDate(day)}
              >
                {day}
                {isFullyBooked && <span className="admin-tooltip">This date is fully booked</span>}
                {isUnavailable && <span className="admin-tooltip">{tooltipText}</span>}
                {isWednesday && <span className="admin-tooltip">Closed (Wednesday)</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-time-panel">
        <h4>{selectedDate ? selectedDate.toDateString() : 'Select a date to view reservations'}</h4>

        {selectedDate && (
          <>
            <div className="toggle-header">
              <button onClick={() => setIsAM(true)}>&lt;</button>
              <span>{isAM ? 'AM' : 'PM'}</span>
              <button onClick={() => setIsAM(false)}>&gt;</button>
            </div>

            <div className="time-grid">
              {(() => {
                const filtered = filterSlots(isAM ? am : pm);

                if (filtered.length === 0) {
                  return <div className="no-slots">No available time slots</div>;
                }

                return filtered.map((slot, i) => {
                  const appointment = appointments.find(a => a.set_time === slot);
                  const isSelected = slot === selectedSlot;

                  let statusClass = '';
                  if (appointment) {
                    if (appointment.status === 'Approved') statusClass = 'approved';
                    else if (appointment.status === 'Pending') statusClass = 'pending';
                    else if (appointment.status === 'Declined') statusClass = 'declined';
                  }
                  return (
                    <div
                      key={i}
                      className={`time-slot ${isSelected ? 'selected-slot' : ''} ${statusClass}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot} {appointment ? `(${appointment.owner_name})` : ''}
                    </div>
                  );
                });
              })()}
            </div>

            <div className="reservation-list">
              <h5>Reservation Details</h5>
              {selectedAppointment ? (
                <div className="reservation-card">
                  <div>
                    <strong>{selectedAppointment.owner_name}</strong><br />
                    Time: {selectedSlot}<br />
                    Status: {selectedAppointment.status || 'Pending'}
                    {selectedAppointment.status === 'Declined' && (
                      <p>Reason: {selectedAppointment.reason}</p>
                    )}
                  </div>
                  <div className="action-buttons">
                    <button className="approve" onClick={() =>
                      updateStatus(
                        selectedAppointment.id_appoint,
                        'Approved',
                        selectedAppointment.UID,
                        selectedAppointment.set_date,
                        selectedAppointment.set_time
                      )}>
                      Approve
                    </button>
                    <button className="decline" onClick={() => {
                      setDeclineData({
                        id: selectedAppointment.id_appoint,
                        uid: selectedAppointment.UID,
                        setDate: selectedAppointment.set_date,
                        setTime: selectedAppointment.set_time
                      });
                      setShowDeclineModal(true);
                    }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ) : (
                <p>No reservation for this time slot.</p>
              )}
            </div>

            <div className="admin-appointment-indicator">
              <h5>Status Reference</h5>
              <div className="admin-indicator-list">
                <div className="admin-indicator-item">
                  <span className="admin-dot approved"></span> Approved
                </div>
                <div className="admin-indicator-item">
                  <span className="admin-dot pending"></span> Pending
                </div>
                <div className="admin-indicator-item">
                  <span className="admin-dot declined"></span> Declined
                </div>
                <div className="admin-indicator-item">
                  <span className="admin-dot available"></span> Available Slot
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showDeclineModal && (
        <div className="all-decline-modal-overlay" onClick={() => setShowDeclineModal(false)}>
          <div className="all-decline-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Decline Appointment</h3>
            <p>Please provide a reason for declining this appointment:</p>

            <textarea
              className="all-decline-textarea"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter reason..."
            />

            <div className="all-decline-actions">
              <button
                className="all-decline-confirm"
                disabled={!declineReason.trim()}
                onClick={() => {
                  updateStatus(
                    declineData.id,
                    "Declined",
                    declineData.uid,
                    declineData.setDate,
                    declineData.setTime,
                    declineReason
                  );
                  setShowDeclineModal(false);
                  setDeclineReason("");
                }}
              >
                Confirm Decline
              </button>

              <button
                className="all-decline-cancel"
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointment;
