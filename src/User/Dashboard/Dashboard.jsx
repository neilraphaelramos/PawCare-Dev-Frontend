import React, { useState, useEffect, useContext } from "react";
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

  const pages = [
    { name: "Appointment", keyword: "appointment", path: "/users/appointments" },
    { name: "Pet Records", keyword: "pet", path: "/users/pet-records" },
    { name: "My Pets", keyword: "pet", path: "/users/pet-infos" },
    { name: "Notification", keyword: "notification", path: "/users/notification" },
    { name: "Pet Products", keyword: "product", path: "/users/pet-products" },
    { name: "Online Consultation", keyword: "consultation", path: "/users/online-consultation" },
    { name: "Profile", keyword: "profile", path: "/users/profile" },
  ];

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

  const doctorData = [
    {
      name: "Dra. Rosemarie Macabales",
      dept: "Veterinarian",
      time: "9:00 AM",
      concern: "Dog annual check-up.",
      avatar: "https://scontent.fmnl14-1.fna.fbcdn.net/v/t39.30808-6/486555215_1105672961576735_1414627574457475734_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGssxNJ2BGOMyrar5cDOV6AmHG1LQyL5iuYcbUtDIvmKxc-ebFQ2fraQP6pfVSMAyS3YHqhRgYVFUlFt3RsoByD&_nc_ohc=1skpN93S4tsQ7kNvwFL3uYl&_nc_oc=AdlFGu-n0R1Tb0t3HWgcBNZkSoQoE_O_k1ebXf5kFzVtRaxXhYLlw_SqBFhGAihRb6M&_nc_zt=23&_nc_ht=scontent.fmnl14-1.fna&_nc_gid=25W5KTkpKqp7oqVgt5RMiQ&oh=00_AfM0b21qhtEdm2hUFZZDNDpzefzDBwDcrubwCCnorHap0A&oe=684D283D",
    },
    {
      name: "Dra. Crislyn Heria",
      dept: "Veterinarian",
      time: "1:30 PM",
      concern: "Post-surgery follow-up.",
      avatar: "https://scontent.fmnl14-1.fna.fbcdn.net/v/t39.30808-6/472656605_1148079893691783_3402392592901469692_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGdbi145H7WdNJbbnj650PXyCJqyF1Kcb3IImrIXUpxvcIuDFcwF7Sgn89nRPS8vd-1s_IawqEbQNFoWuQMUfk6&_nc_ohc=xXjwir9gpnkQ7kNvwHfBMTM&_nc_oc=Admvs3b4nd-dNBdErRgxmYVD9-3b-3X-9ru9hcRu7WmSK4YMNw3DEKPtyGAlvRmaOKU&_nc_zt=23&_nc_ht=scontent.fmnl14-1.fna&_nc_gid=sHEzubRTup9nBSNUSEuFzw&oh=00_AfO3JVjjJcJvzSt1qe_uDCL7QpXL_p7HLWW2N1CTtDxq8A&oe=684D1F24",
    },
    {
      name: "Dr. Argie Rivera",
      dept: "Veterinarian",
      time: "4:15 PM",
      concern: "Skin allergy treatment.",
      avatar: "https://scontent.fmnl14-1.fna.fbcdn.net/v/t39.30808-6/486718620_1107164244760940_2055589638162477283_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeF35zLNet-7Qj5VbKlGBxhCaSjIK6Vyql5pKMgrpXKqXo6Qjd7ecPf1pykPfD6Sv-dEVBDRprex-MtSr85r_kFH&_nc_ohc=QAJpSEMMWPoQ7kNvwEmblpc&_nc_oc=AdkBXXeSsb7hhSkMm9IGvrWhU0oHpv2ymW8cS8uLJaqBTxbPVlcKjM2ZvHxU5aQZIhw&_nc_zt=23&_nc_ht=scontent.fmnl14-1.fna&_nc_gid=uqGU_zxIcOr8KVKYz9Twsg&oh=00_AfNArpseh9qw775RvEubjU9KnvIdKnbHHv5dY6Rhdo0rww&oe=684D1392",
    },
    {
      name: "Dr. Frank Deluna",
      dept: "Veterinarian",
      time: "6:00 PM",
      concern: "Vaccination update.",
      avatar: "https://scontent.fmnl14-1.fna.fbcdn.net/v/t39.30808-6/472715029_1045319907612041_618486053572698467_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeFkDrdtuKKE0GfyR4USg5Z77jFeNC2Yr97uMV40LZiv3ph-e6VxCMVo616UVeJYgnY1FkKa7vmKRpfoeQVewqyy&_nc_ohc=7jXyvbVyaL4Q7kNvwGa-UZT&_nc_oc=Adlp7McF-lOtzWbFXlpxIODzW_FQ0XT_iO6967xctzHJmRxOsPgXyU_t3da3KxELcXY&_nc_zt=23&_nc_ht=scontent.fmnl14-1.fna&_nc_gid=sFnayoCzEQdJR8kXl6yaQQ&oh=00_AfO6um66c33iuQZyOg-s3uwqiZcEbvNGvH-d4QkPYSYBbQ&oe=684D1C8B",
    },
  ];

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

          <div className="user-dashboard-calendar-dates">
            {weekDates.map((dateObj, index) => {
              const isWednesday = dateObj.getDay() === 3; // 0=Sun, 3=Wed

              return (
                <div
                  className={`user-dashboard-day ${isWednesday ? "disabled" : ""}`}
                  key={index}
                >
                  <div className="user-dashboard-weekday">
                    {dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                  </div>
                  <div
                    className={`user-dashboard-date ${dateObj.toDateString() === selectedDate.toDateString() ? "user-dashboard-active" : ""
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

          <div className="user-dashboard-doctor-cards">
            {doctorData.map((doc) => (
              <div className="user-dashboard-doctor-card" key={doc.name}>
                <img src={doc.avatar} alt={doc.name} />
                <h4>{doc.name}</h4>
                <p className="user-dashboard-dept">{doc.dept}</p>
                <p>Appointment: {doc.time}</p>
                <p className="user-dashboard-concern">Primary Concern: {doc.concern}</p>
                <a href="#">Google Meet Link</a>
              </div>
            ))}
          </div>
        </section>

        <section className="user-dashboard-products user-dashboard-card">
          <div className="user-dashboard-section-header">
            <h3>Products Purchased</h3>
            <FaChevronRight />
          </div>
          <div className="user-dashboard-products-list">
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
