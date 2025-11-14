import React, { useState, useEffect } from 'react';
import './AdminAppointments.css';
import axios from 'axios';

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

  const updateStatus = async (id, status, uid, setDate, setTime) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/appointments/${id}/status`, { status })
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
          : `Your appointment on ${readableDate} at ${setTime} has been declined.`;

      await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api`, {
        UID: uid,
        title_notify:  `Appointment ${status}`,
        type_notify: "Appointment",
        details,
      });

    } catch (error) {
      console.error(error)
    }
  };

  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toLocaleDateString('en-CA');
      axios.get(`${process.env.REACT_APP_API_URL}/appointments/vets/${dateStr}`)
        .then(res => {
          console.log('Appointments fetched:', res.data);
          setAppointments(res.data);
        })
        .catch(err => console.error(err));
    }
  }, [selectedDate]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/appointments/fully-booked`)
      .then(res => {
        console.log("✅ Fully booked dates:", res.data);
        setFullyBookedDates(res.data || []);
      })
      .catch(err => console.error("Error fetching fully booked dates:", err));
  }, []);


  const filterSlots = (slots) => {
    return slots.filter((slot) => {
      const slotStart = new Date(selectedDate);
      const [startTime] = slot.split(" - ");
      const [time, meridian] = startTime.split(" ");
      const [hourStr, minuteStr] = time.split(":");

      let hours = parseInt(hourStr, 10);
      const minutes = parseInt(minuteStr, 10);

      if (meridian === "PM" && hours !== 12) hours += 12;
      if (meridian === "AM" && hours === 12) hours = 0;

      slotStart.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const isToday =
        selectedDate &&
        now.toDateString() === selectedDate.toDateString();

      const isPast = isToday && slotStart <= now;

      return !isPast; // hide past slots
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
            const isFullyBooked = fullyBookedDates.includes(dateStr);

            // Admin can still click full-booked dates
            const isDisabled = isPast || isWednesday;

            return (
              <div
                key={day}
                className={`admin-calendar-day 
                  ${isFullyBooked ? 'admin-fully-booked' : ''} 
                  ${isDisabled ? 'admin-disabled' : ''} 
                  ${isSelected ? 'selected' : ''}`}
                onClick={() => !isDisabled && selectDate(day)}
              >
                {day}
                {isFullyBooked && <span className="admin-tooltip">This date is full</span>}
                {isWednesday && !isFullyBooked && (
                  <span className="admin-tooltip">Closed (Wednesday)</span>
                )}
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
                    <button className="decline" onClick={() =>
                      updateStatus(
                        selectedAppointment.id_appoint,
                        'Declined',
                        selectedAppointment.UID,
                        selectedAppointment.set_date,
                        selectedAppointment.set_time
                      )}>
                      Decline
                    </button>
                  </div>
                </div>
              ) : (
                <p>No reservation for this time slot.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Appointment;
