import React, { useState, useEffect } from "react";
import "./DateTimeModal.css";
import axios from 'axios';

const generateTimeSlots = (isToday = false) => {
    const start = new Date();
    start.setHours(8, 0, 0, 0);
    const end = new Date();
    end.setHours(18, 0, 0, 0);

    const now = new Date();
    const am = [];
    const pm = [];

    while (start < end) {
        const slotStart = new Date(start);
        const slotEnd = new Date(start.getTime() + 60 * 60000); // 1 hour
        if (slotEnd > end) break;

        // Hide past times if today
        if (!isToday || slotStart > now) {
            const format = (d) =>
                d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const slot = `${format(slotStart)} - ${format(slotEnd)}`;
            slotStart.getHours() < 12 ? am.push(slot) : pm.push(slot);
        }

        start.setTime(slotEnd.getTime());
    }

    return { am, pm };
};

const DateTimeModal = ({ isOpen, onClose, onConfirm }) => {
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAM, setIsAM] = useState(true); // default AM
    const { am, pm } = generateTimeSlots();

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
        if (newDate >= new Date().setHours(0, 0, 0, 0)) {
            setSelectedDate(newDate);
        }
    };

    const handleConfirm = () => {
        if (!selectedDate || !selectedTime) {
            alert("Please select both date and time.");
            return;
        }
        onConfirm({ date: selectedDate, time: selectedTime });
        onClose();
    };

    const handleCancel = () => {
        setSelectedDate(null);
        setSelectedTime("");
        onClose();
    };

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

                console.log(timeMap);
                console.log(fullDays)
            })
            .catch((err) => console.error("Error fetching availability:", err));
    }, []);


    if (!isOpen) return null;

    const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);

    return (
        <div className="datetime-modal-overlay" onClick={onClose}>
            <div className="datetime-modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="datetime-title">Select Date & Time</h3>

                <div className="calendar-header">
                    <button type="button" onClick={handlePrevMonth}>&lt;</button>
                    <span>
                        {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                    </span>
                    <button type="button" onClick={handleNextMonth}>&gt;</button>
                </div>

                <div className="calendar-grid">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div className="day-name" key={d}>{d}</div>
                    ))}
                    {[...Array(startDay === 0 ? 6 : startDay - 1)].map((_, i) => <div key={i}></div>)}
                    {daysInMonth.map(day => {
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dateStr = date.toLocaleDateString('en-CA');

                        const isPast = date < new Date().setHours(0, 0, 0, 0);
                        const isWednesday = date.getDay() === 3;

                        const fullDateInfo = unavailableDates.find(d => d.date === dateStr);
                        const isUnavailable = !!fullDateInfo;

                        const isFullyBooked = false; // replace if you have fullyBookedDates array
                        const isDisabled = isPast || isWednesday || isUnavailable || isFullyBooked;

                        const isSelected =
                            selectedDate?.getDate() === day &&
                            selectedDate?.getMonth() === currentDate.getMonth();

                        let tooltipText = "";
                        if (isUnavailable) tooltipText = fullDateInfo.event;
                        else if (isFullyBooked) tooltipText = "This date is fully booked";
                        else if (isWednesday) tooltipText = "Closed (Wednesday)";
                        else if (isPast) tooltipText = "Unavailable";

                        return (
                            <div
                                key={day}
                                className={`datetime-calendar-day ${isDisabled ? "disabled" : ""} ${isSelected ? "selected" : ""}`}
                                onClick={() => !isDisabled && selectDate(day)}
                            >
                                {day}
                                {tooltipText && <span className="datetime-tooltip">{tooltipText}</span>}
                            </div>
                        );
                    })}
                </div>

                <div className="user-selected-date-display">
                    <strong>Selected Date:</strong>{" "}
                    {selectedDate
                        ? selectedDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })
                        : "-"}
                </div>

                <div className="toggle-header">
                    <button type="button" onClick={() => setIsAM(true)}>&lt;</button>
                    <span>{isAM ? 'AM' : 'PM'}</span>
                    <button type="button" onClick={() => setIsAM(false)}>&gt;</button>
                </div>

                <div className="time-grid">
                    {(() => {
                        if (!selectedDate) return <div className="no-slots">Please select a date first</div>;

                        const availableSlots = (isAM ? am : pm).filter((slot) => {
                            const slotStart = new Date(selectedDate);
                            const [slotStartStr, slotEndStr] = slot.split(" - ");

                            const [startTime, startMeridian] = slotStartStr.split(" ");
                            let [startHour, startMinute] = startTime.split(":").map(Number);
                            if (startMeridian === "PM" && startHour !== 12) startHour += 12;
                            if (startMeridian === "AM" && startHour === 12) startHour = 0;
                            slotStart.setHours(startHour, startMinute, 0, 0);

                            const slotEnd = new Date(selectedDate);
                            const [endTime, endMeridian] = slotEndStr.split(" ");
                            let [endHour, endMinute] = endTime.split(":").map(Number);
                            if (endMeridian === "PM" && endHour !== 12) endHour += 12;
                            if (endMeridian === "AM" && endHour === 12) endHour = 0;
                            slotEnd.setHours(endHour, endMinute, 0, 0);

                            const now = new Date();
                            const isToday = selectedDate.toDateString() === now.toDateString();
                            const isPast = isToday && slotStart <= now;

                            const dateStr = selectedDate.toLocaleDateString("en-CA");
                            const blockedRanges = unavailableTimes[dateStr] || [];
                            const isBlocked = blockedRanges.some(range => {
                                const [bStartH, bStartM] = range.from.split(":").map(Number);
                                const [bEndH, bEndM] = range.to.split(":").map(Number);

                                const blockedStart = new Date(selectedDate);
                                blockedStart.setHours(bStartH, bStartM, 0, 0);
                                const blockedEnd = new Date(selectedDate);
                                blockedEnd.setHours(bEndH, bEndM, 0, 0);

                                return slotStart < blockedEnd && slotEnd > blockedStart;
                            });

                            return !isPast && !isBlocked;
                        });

                        if (availableSlots.length === 0) {
                            return <div className="no-slots">No available time slots</div>;
                        }

                        return availableSlots.map((slot, i) => (
                            <button
                                type="button"
                                key={i}
                                className={`time-slot ${selectedTime === slot ? "selected" : ""}`}
                                onClick={() => setSelectedTime(slot)}
                            >
                                {slot}
                            </button>
                        ));
                    })()}
                </div>

                <div className="datetime-actions">
                    <button
                        className="datetime-btn cancel"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="datetime-btn confirm"
                        onClick={handleConfirm}
                        disabled={!selectedDate || !selectedTime}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateTimeModal;
