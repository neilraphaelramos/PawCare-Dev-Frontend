import React, { useState, useEffect, useContext, useRef } from "react";
import Appointments from "../Appointments/Appointments";
import AiAssistant from "../AiAssistant/AiAssistant";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  FaPaw,
  FaCalendarAlt,
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarCheck,
} from "react-icons/fa";

import "./Dashboard.css";
import PetRecords from "../PetRecords/PetRecords";
import PetProducts from "../PetProducts/PetProducts";
import OnlineConsultation from "../OnlineConsultation/OnlineConsultation";
import Profile from "../Profile/Profile";
import { UserContext } from "../../hook/authContext";
import axios from "axios";

const Dashboard = () => {
  const { user } = useContext(UserContext);
  const [showChat, setShowChat] = useState(true);
  const [totalPets, setTotalPets] = useState(0);
  const [totalAppointment, setTotalAppointment] = useState(0);
  const [totalNotify, setTotalNotify] = useState(0);
  const [totalVisit, setTotalVisit] = useState(0);
  const navigate = useNavigate();
  const handleAddAppointment = () => {
    navigate("/users/appointments");
  };

  const [weekDates, setWeekDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [purchasedProducts, setPurchasedProducts] = useState([]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [upcomingOnlineConsults, setUpcomingOnlineConsults] = useState([]);

  const pages = [
    { name: "Appointment", keyword: "appointment", path: "/users/appointments" },
    { name: "Pet Records", keyword: "pet", path: "/users/pet-records" },
    { name: "My Pets", keyword: "pet", path: "/users/pet-infos" },
    { name: "Notification", keyword: "notification", path: "/users/notification" },
    { name: "Pet Products", keyword: "product", path: "/users/pet-products" },
    { name: "Online Consultation", keyword: "consultation", path: "/users/online-consultation" },
    { name: "Profile", keyword: "profile", path: "/users/profile" },
  ];

  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -100, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 100, behavior: "smooth" });
  };

  const handleChange = (e) => {
    const value = e.target.value.toLowerCase();
    setQuery(value);
    if (value.trim() === "") {
      setSuggestions([]);
      return;
    }

    const filtered = pages.filter((p) =>
      p.keyword.includes(value) || p.name.toLowerCase().includes(value)
    );
    setSuggestions(filtered);
  };

  const handleSelect = (path) => {
    setQuery("");
    setSuggestions([]);
    navigate(path);
  };

  const getWeekDates = (refDate) => {
    const start = new Date(refDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  useEffect(() => {
    setWeekDates(getWeekDates(selectedDate));
  }, [selectedDate]);

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    let count = 1 - firstDay;
    for (let i = 0; i < 35; i++) {
      days.push(count > 0 && count <= daysInMonth ? count : "");
      count++;
    }

    setCalendarDays(days);
  }, [currentDate]);

  const handleMonthChange = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleUpcomingAppointments = async () => {
    const ID = user.id;
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/online_consult/upcoming-online-consult/fetch/${ID}`);

      let data = res.data.fetchData;

      // Ensure data is always an array
      if (!Array.isArray(data)) {
        data = [];
      }

      setUpcomingOnlineConsults(data);
    } catch (err) {
      console.error("Error fetching upcoming appointments:", err);
      setUpcomingOnlineConsults([]); // fallback
    }
  };

  useEffect(() => {
    handleUpcomingAppointments();
  }, [user]);

  const handleMetricStatus = async (e) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/metric_dashboard/fetch/users/${user.id}/${user.username}`);
      setTotalPets(res.data.totalPets);
      setTotalAppointment(res.data.totalAppointments);
      setTotalNotify(res.data.totalNotify);
      setTotalVisit(res.data.totalVisit);
    } catch (err) {
      console.error('Error fetching Metric:', err);
    }
  }

  useEffect(() => {
    handleMetricStatus();
  });

  useEffect(() => {
    const fetchPurchasedProducts = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/orders/fetch/user_order/${user.id}`);
        setPurchasedProducts(res.data);
      } catch (err) {
        console.error("Error fetching purchased products:", err);
      }
    };

    if (user?.id) fetchPurchasedProducts();
  }, [user]);


  return (
    <div className="user-dashboard">
      <main className="user-dashboard-main">
        <header className="user-dashboard-header">
          <div className="search-wrapper">
            <input
              type="text"
              value={query}
              placeholder="Search task, appointment, or consult"
              onChange={handleChange}
            />
            {suggestions.length > 0 && (
              <ul className="search-suggestions">
                {suggestions.map((item, i) => (
                  <li key={i} onClick={() => handleSelect(item.path)}>
                    {item.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <img
            className="user-dashboard-profile"
            src={user.pic || "/images/Default_Pic.jpg"}
            alt="profile"
            onClick={() => navigate('/users/profile')}
          />
        </header>

        <section className="user-dashboard-metrics">
          <div className="user-dashboard-metric">
            <div><FaPaw /> Total Pets</div>
            <span>{totalPets}</span>
          </div>
          <div className="user-dashboard-metric">
            <div><FaCalendarAlt /> Appointments</div>
            <span>{totalAppointment}</span>
          </div>
          <div className="user-dashboard-metric">
            <div><FaBell /> Notifications</div>
            <span>{totalNotify}</span>
          </div>
          <div className="user-dashboard-metric">
            <div><FaCalendarCheck /> Total Visit</div>
            <span>{totalVisit}</span>
          </div>
        </section>

        <Routes>
          <Route path="" element={<div></div>} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="pet-records" element={<PetRecords />} />
          <Route path="pet-products" element={<PetProducts />} />
          <Route path="online-consultation" element={<OnlineConsultation />} />
          <Route path="profile" element={<Profile />} />
          <Route path="ai-assistant" element={<AiAssistant />} />
        </Routes>

        <section className="user-dashboard-schedule user-dashboard-card">
          <div className="user-dashboard-section-header">
            <h3>Upcoming Online Consultation</h3>
            <div className="user-dashboard-schedule-controls">
              <span>
                {selectedDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <div className="user-dashboard-nav-arrows">
                <FaChevronLeft onClick={handlePrevWeek} />
                <FaChevronRight onClick={handleNextWeek} />
              </div>
            </div>
          </div>

          {/* Week date navigation */}
          <div className="user-dashboard-calendar-dates">
            {weekDates.map((dateObj, index) => {
              const isWednesday = dateObj.getDay() === 3; // skip Wednesdays
              return (
                <div
                  className={`user-dashboard-day ${isWednesday ? "disabled" : ""}`}
                  key={index}
                >
                  <div className="user-dashboard-weekday">
                    {dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                  </div>
                  <div
                    className={`user-dashboard-date ${dateObj.toDateString() === selectedDate.toDateString()
                      ? "user-dashboard-active"
                      : ""
                      }`}
                    onClick={() => {
                      if (!isWednesday) setSelectedDate(dateObj);
                    }}
                  >
                    {dateObj.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filtered consultations by selected date */}
          <div className="user-dashboard-doctor-cards">
            {upcomingOnlineConsults && upcomingOnlineConsults.length > 0 ? (() => {
              const filteredConsults = upcomingOnlineConsults.filter((consult) => {
                if (!consult.setDate) return false;
                const consultDate = new Date(consult.setDate);
                return consultDate.toDateString() === selectedDate.toDateString();
              });

              return filteredConsults.length > 0 ? (
                filteredConsults.map((doc, i) => (
                  <div className="user-dashboard-doctor-card" key={i}>
                    <h4>Online Consultation</h4>
                    <hr />
                    <p><strong>Pet Name:</strong> {doc.petName}</p>
                    <p><strong>Appointment:</strong> {doc.setDate} @ {doc.setTime}</p>
                    <p className="user-dashboard-concern">Primary Concern: {doc.concern}</p>
                    <p><span className="status">Status: {doc.status}</span></p>
                    <a onClick={() => {
                      sessionStorage.setItem("channelConsultID", doc.channelConsult);
                      sessionStorage.setItem("isSubmitted", JSON.stringify(true));
                      sessionStorage.setItem("startCall", JSON.stringify(false));
                      navigate('/users/online-consultation');
                    }}
                      style={{
                        cursor: 'pointer',
                      }}
                    >
                      Join Chat Session→
                    </a>
                  </div>
                ))
              ) : (
                <p className="no-appointment-msg">
                  No appointment on{" "}
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              );
            })() : (
              <p className="no-appointment-msg">No appointment today</p>
            )}
          </div>
        </section>

        <section className="user-dashboard-products user-dashboard-card">
          <div className="user-dashboard-section-header">
            <h3>Products Purchased</h3>
          </div>

          <button className="scroll-btn left" onClick={scrollLeft}>
            <FaChevronLeft />
          </button>
          <button className="scroll-btn right" onClick={scrollRight}>
            <FaChevronRight />
          </button>

          <div className="user-dashboard-products-list scrollable" ref={scrollRef}>
            {purchasedProducts.length === 0 ? (
              <p className="empty-text">No products purchased yet.</p>
            ) : (
              purchasedProducts.map((item, i) => (
                <div key={i} className="user-dashboard-product-item">
                  <img src={item.product_image} alt={item.product_name} />
                  <span><a onClick={() => navigate('/users/pet-products')}>{item.product_name}</a></span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <aside className="user-dashboard-right-panel">
        <div className="user-dashboard-calendar-widget user-dashboard-card">
          <p className="user-dashboard-widget-title">Need Doctor Consultation?</p>
          <div className="user-dashboard-calendar-nav">
            <FaChevronLeft onClick={() => handleMonthChange(-1)} />
            <span>
              {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
            <FaChevronRight onClick={() => handleMonthChange(1)} />
          </div>
          <div className="user-dashboard-calendar-grid">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={
                  day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear()
                    ? "user-dashboard-active-day"
                    : ""
                }
              >
                {day}
              </div>
            ))}
          </div>
          <button className="user-dashboard-primary-btn" onClick={handleAddAppointment}>
            Add New Appointment
          </button>
        </div>

        <div className="user-dashboard-ai-chat user-dashboard-card">
          <button
            className="user-dashboard-chat-btn"
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? "Close AI Chat" : "Chat with AI Doctor"}
          </button>
          <p>You can talk for basic medication.</p>
        </div>
      </aside>

      {showChat && <AiAssistant onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default Dashboard;
