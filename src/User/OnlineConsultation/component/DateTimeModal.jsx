import React, { useState } from "react";
import "./DateTimeModal.css";

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
                        const isPast = date < new Date().setHours(0, 0, 0, 0);
                        const isWednesday = date.getDay() === 3;
                        const isDisabled = isPast || isWednesday;

                        const isSelected =
                            selectedDate?.getDate() === day &&
                            selectedDate?.getMonth() === currentDate.getMonth();

                        return (
                            <div
                                type="button"
                                key={day}
                                className={`calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => !isDisabled && selectDate(day)}
                            >
                                {day}
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
                    {(isAM ? am : pm)
                        ?.filter((slot) => {
                            if (!selectedDate) return false;
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
                            const isToday = selectedDate && now.toDateString() === selectedDate.toDateString();
                            const isPast = isToday && slotStart <= now;

                            return !isPast;
                        })
                        .map((slot, i) => (
                            <button
                                type="button"
                                key={i}
                                className={`time-slot ${selectedTime === slot ? "selected" : ""}`}
                                onClick={() => setSelectedTime(slot)}
                            >
                                {slot}
                            </button>
                        ))}
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
