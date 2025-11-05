// src/modules/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  FaStethoscope,
  FaDog,
  FaPills,
  FaEnvelope,
  FaCalendarAlt,
  FaBell,
  FaClipboardList,
  FaUserClock,
  FaClipboardCheck,
  FaVideo,

} from "react-icons/fa";
import Calendar from "react-calendar";
import { Bar } from "react-chartjs-2";
import "react-calendar/dist/Calendar.css";
// Rename Recharts' Bar to BarRecharts
import { BarChart, Bar as BarRecharts, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import "./Dashboard.css";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { UserContext } from "../../hook/authContext";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const buttonStyles = {
  green: {
    backgroundColor: "#32b2b2",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  red: {
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
};



const initialAppointments = [
  { pet: "Max", owner: "Jane Doe", date: "May 23, 2025", time: "10:00 AM", reason: "Check-up" },
  { pet: "Bella", owner: "John Smith", date: "May 23, 2025", time: "1:30 PM", reason: "Vaccination" },
  { pet: "Luna", owner: "Emily Cruz", date: "May 23, 2025", time: "3:15 PM", reason: "Grooming" },
];

const appointmentSummaryData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Appointments",
      data: [15, 22, 18, 30, 25, 28],
      backgroundColor: "#32b2b2",
    },
  ],
};

const categoryData = [
  { category: 'Grooming', orders: 24 },
  { category: 'Food', orders: 37 },
  { category: 'Toys', orders: 18 },
  { category: 'Supplements', orders: 12 },
  { category: 'Medicine', orders: 9 },
  { category: 'Vitamins', orders: 9 },
];

const servicesData = [
  { service: 'Grooming', orders: 18 },
  { service: 'Vaccination', orders: 12 },
  { service: 'Consultation', orders: 9 },
  { service: 'Deworming', orders: 6 },
  { service: 'Surgery', orders: 4 },
  { service: 'Confinement', orders: 10 },
  { service: 'Laboratories', orders: 5 },
  { service: 'Home Service', orders: 3 },
];

const servicesChartData = {
  labels: servicesData.map(d => d.service),
  datasets: [
    {
      label: 'Service Demand',
      data: servicesData.map(d => d.orders),
      backgroundColor: '#32b2b2',
    },
  ],
};

const servicesChartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'top' },
    title: {
      display: true,
      text: 'Service Demand Overview',
      font: { size: 18 },
    },
  },
  scales: {
    x: { ticks: { maxRotation: 0, minRotation: 0 } },
    y: { beginAtZero: true },
  },
};


const categoryChartData = {
  labels: categoryData.map(d => d.category),
  datasets: [
    {
      label: 'Orders',
      data: categoryData.map(d => d.orders),
      backgroundColor: '#32b2b2',
    },
  ],
};

const categoryChartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'top' },
    title: {
      display: true,
      text: 'Orders by Category',
      font: { size: 18 },
    },
  },
  scales: {
    x: { ticks: { maxRotation: 0, minRotation: 0 } },
    y: { beginAtZero: true },
  },
};



function ServicesChart() {
  return (

    <Bar data={servicesChartData} options={servicesChartOptions} />
  );
}

function OrdersByCategoryChart() {
  return (

    <Bar data={categoryChartData} options={categoryChartOptions} />
  );
}



export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState("appointments");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState("category");
  const [todApp, setTodApp] = useState(0);
  const [todPat, setTodPat] = useState(0);
  const [medLow, setMedLow] = useState(0);
  const [unMess, setUnMess] = useState(0);
  const { user } = useContext(UserContext);

  const handleMetricStatus = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/metric_dashboard/fetch/admin`);
      setTodApp(res.data.total_appointments);
      setTodPat(res.data.total_pets);
      setMedLow(res.data.low_stock_count);
    } catch (err) {
      console.error('Error fetching Metric:', err);
    }

    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/metric_dashboard/fetch/unreadcount/${user.id}`);
      setUnMess(res.data.unreadCount);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }

  useEffect(() => {
    setAppointments([
      {
        id: 1,
        petName: "Buddy",
        owner: "John Doe",
        time: "09:00 AM",
        reason: "Vaccination",
        avatar: "https://placedog.net/64/64?id=1",
        date: new Date().toDateString(),
        status: "Scheduled",
      },
      {
        id: 2,
        petName: "Mittens",
        owner: "Jane Smith",
        time: "11:30 AM",
        reason: "Skin Allergy",
        avatar: "https://placedog.net/64/64?id=2",
        date: new Date().toDateString(),
        status: "Scheduled",
      },
      {
        id: 3,
        petName: "Max",
        owner: "Sarah Lee",
        time: "02:00 PM",
        reason: "Dental Check",
        avatar: "https://placedog.net/64/64?id=3",
        date: new Date().toDateString(),
        status: "Done",
      },
    ]);

    setReservations([
      {
        id: 101,
        petName: "Luna",
        owner: "Carlos Mendoza",
        reason: "Ear Check",
        preferredDate: "2025-06-05",
        time: "10:00 AM",
        avatar: "https://placedog.net/64/64?id=5",
        status: "Pending",
      },
      {
        id: 102,
        petName: "Tiger",
        owner: "Mika Reyes",
        reason: "Vaccination",
        preferredDate: "2025-06-06",
        time: "01:30 PM",
        avatar: "https://placedog.net/64/64?id=6",
        status: "Pending",
      },
    ]);

    setConsultations([
      {
        id: 201,
        petName: "Charlie",
        owner: "Anna Brown",
        time: "03:00 PM",
        reason: "Online Follow-up",
        avatar: "https://placedog.net/64/64?id=7",
        date: new Date().toDateString(),
        status: "Scheduled",
      },
      {
        id: 202,
        petName: "Bella",
        owner: "David Kim",
        time: "04:30 PM",
        reason: "Skin Rash Consultation",
        avatar: "https://placedog.net/64/64?id=8",
        date: new Date().toDateString(),
        status: "Done",
      },
    ]);

    handleMetricStatus();
  }, []);

  const handleStatusUpdate = (id, newStatus, type = "appointments") => {
    if (type === "appointments") {
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id ? { ...appt, status: newStatus } : appt
        )
      );
    } else if (type === "consultations") {
      setConsultations((prev) =>
        prev.map((consult) =>
          consult.id === id ? { ...consult, status: newStatus } : consult
        )
      );
    }
  };

  const handleReservationAction = (id, action) => {
    setReservations((prev) =>
      prev.map((res) => (res.id === id ? { ...res, status: action } : res))
    );
  };

  const chartData = [
    { day: "Mon", patients: 5 },
    { day: "Tue", patients: 8 },
    { day: "Wed", patients: 6 },
    { day: "Thu", patients: 9 },
    { day: "Fri", patients: 4 },
  ];

  const todayAppointments = appointments.filter(
    (appt) => appt.date === selectedDate.toDateString() && appt.status !== "Done"
  );

  const todayConsultations = consultations.filter(
    (consult) =>
      consult.date === selectedDate.toDateString() && consult.status !== "Done"
  );

  return (
    <div className="admin-dashboard">
      { }
      <main className="admin-dashboard-main">
        <header className="admin-dashboard-header">
          <h2>Admin Dashboard</h2>
          <input
            type="text"
            placeholder="Search pet, owner, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </header>

        <div className="admin-dashboard-main-content">
          {/* Left Main Content */}
          <div className="admin-dashboard-left">
            {/* Metrics */}
            <section className="admin-dashboard-metrics">
              <div className="admin-dashboard-metric">
                <div><FaStethoscope /> Today’s Appointments</div>
                <span>{todApp}</span>
              </div>
              <div className="admin-dashboard-metric">
                <div><FaDog /> Total Patients</div>
                <span>{todPat}</span>
              </div>
              <div className="admin-dashboard-metric">
                <div><FaPills /> Stock Low</div>
                <span>{medLow}</span>
              </div>
              <div className="admin-dashboard-metric">
                <div><FaEnvelope /> Unread Messages</div>
                <span>{unMess}</span>
              </div>
            </section>


            {/* Chart */}
            <section className="admin-dashboard-row">
              <div className="charts-tabs-container">
                <div className="charts-tab-buttons">
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className={activeTab === "appointments" ? "active" : ""}
                  >
                    Appointments
                  </button>
                  <button
                    onClick={() => setActiveTab("category")}
                    className={activeTab === "category" ? "active" : ""}
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => setActiveTab("services")}
                    className={activeTab === "services" ? "active" : ""}
                  >
                    Services
                  </button>
                </div>

                <div className="charts-tab-content">
                  {activeTab === "appointments" && (
                    <div className="admin-dashboard-card-graph-box">
                      <h3>Appointments Summary (6 Months)</h3>
                      <Bar data={appointmentSummaryData} />
                    </div>
                  )}
                  {activeTab === "category" && <OrdersByCategoryChart />}
                  {activeTab === "services" && <ServicesChart />}
                </div>
              </div>
            </section>


            {/* Alerts */}
            <section className="admin-dashboard-card" style={{ marginBottom: "1.5rem" }}>
              <div className="admin-dashboard-tab-buttons">
                <button
                  className={selectedTab === "appointments" ? "active" : ""}
                  onClick={() => setSelectedTab("appointments")}
                >
                  <FaClipboardCheck /> Upcoming Appointments
                </button>
                <button
                  className={selectedTab === "consultations" ? "active" : ""}
                  onClick={() => setSelectedTab("consultations")}
                >
                  <FaVideo /> Online Consultations
                </button>
                <button
                  className={selectedTab === "reservations" ? "active" : ""}
                  onClick={() => setSelectedTab("reservations")}
                >
                  <FaClipboardList /> Reservations
                </button>
              </div>


              {/* Conditional Display */}
              {selectedTab === "appointments" && (
                <>
                  <h3 style={{ marginBottom: "1rem" }}>
                    Upcoming Appointments ({selectedDate.toDateString()})
                  </h3>
                  {todayAppointments.length === 0 ? (
                    <p>No appointments scheduled.</p>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {todayAppointments.map((appt) => (
                        <li
                          key={appt.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            background: "#edf2f7",
                            borderRadius: "8px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                            padding: "1rem",
                            marginBottom: "1rem",
                          }}
                        >
                          <img
                            src={appt.avatar}
                            alt={appt.petName}
                            style={{ borderRadius: "50%", width: 50, height: 50 }}
                          />
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "1rem" }}>{appt.petName}</strong> – {appt.reason}
                            <br />
                            <small style={{ color: "#666" }}>
                              {appt.owner} • {appt.time}
                            </small>
                            <br />
                            <small>Status: {appt.status}</small>
                          </div>
                          {appt.status === "Scheduled" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button style={buttonStyles.green} onClick={() => handleStatusUpdate(appt.id, "Done", "appointments")}>Mark as Done</button>
                              <button style={buttonStyles.red} onClick={() => handleStatusUpdate(appt.id, "Cancelled", "appointments")}>Cancel</button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {selectedTab === "consultations" && (
                <>
                  <h3 style={{ marginBottom: "1rem" }}>
                    Online Consultations ({selectedDate.toDateString()})
                  </h3>
                  {todayConsultations.length === 0 ? (
                    <p>No consultations scheduled.</p>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {todayConsultations.map((consult) => (
                        <li
                          key={consult.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            background: "#edf2f7",
                            borderRadius: "8px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                            padding: "1rem",
                            marginBottom: "1rem",
                          }}
                        >
                          <img
                            src={consult.avatar}
                            alt={consult.petName}
                            style={{ borderRadius: "50%", width: 50, height: 50 }}
                          />
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "1rem" }}>{consult.petName}</strong> – {consult.reason}
                            <br />
                            <small style={{ color: "#666" }}>
                              {consult.owner} • {consult.time}
                            </small>
                            <br />
                            <small>Status: {consult.status}</small>
                          </div>
                          {consult.status === "Scheduled" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button style={buttonStyles.green} onClick={() => handleStatusUpdate(consult.id, "Done", "consultations")}>Mark as Done</button>
                              <button style={buttonStyles.red} onClick={() => handleStatusUpdate(consult.id, "Cancelled", "consultations")}>Cancel</button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {selectedTab === "reservations" && (
                <>
                  <h3 style={{ marginBottom: "1rem" }}>Reservations</h3>
                  {reservations.length === 0 ? (
                    <p>No reservations at the moment.</p>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {reservations.map((res) => (
                        <li
                          key={res.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            background: "#edf2f7",
                            borderRadius: "8px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                            padding: "1rem",
                            marginBottom: "1rem",
                          }}
                        >
                          <img
                            src={res.avatar}
                            alt={res.petName}
                            style={{ borderRadius: "50%", width: 50, height: 50 }}
                          />
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "1rem" }}>{res.petName}</strong> – {res.reason}
                            <br />
                            <small style={{ color: "#666" }}>
                              {res.owner} • {res.preferredDate} • {res.time}
                            </small>
                            <br />
                            <small>Status: {res.status}</small>
                          </div>
                          {res.status === "Pending" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button style={buttonStyles.green} onClick={() => handleReservationAction(res.id, "Confirmed")}>Confirm</button>
                              <button style={buttonStyles.red} onClick={() => handleReservationAction(res.id, "Cancelled")}>Cancel</button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

            </section>
          </div>
        </div>
      </main>

      {/* Sidebar outside <main> */}
      <aside className="admin-dashboard-right-panel">
        <div className="admin-dashboard-calendar-widget-admin-dashboard-card">
          <h4 className="admin-dashboard-widget-title"><FaCalendarAlt /> Calendar</h4>
          <Calendar value={date} onChange={setDate} />
        </div>

        <div className="vet-dashboard-card vet-dashboard-reminders">
          <h3 style={{ marginBottom: "0.5rem", color: "#32b2b2", marginTop: "5px" }}>
            Reminders</h3>
          <ul style={{ listStyle: "none", padding: 0, maxHeight: 150, overflowY: "auto" }}>
            <li style={{ padding: "0.5rem 0", borderBottom: "1px solid #ddd" }}>

              Submit monthly report
            </li>
            <li style={{ padding: "0.5rem 0", borderBottom: "1px solid #ddd" }}>

              Review lab test results
            </li>
            <li style={{ padding: "0.5rem 0" }}>

              Staff meeting at 4 PM
            </li>
          </ul>
        </div>

        {/* Activities */}
        <div className="vet-dashboard-card vet-dashboard-recent-activities">
          <h3 style={{ marginBottom: "0.5rem", color: "#32b2b2" }}>
            Recent Activities</h3>
          <ul style={{ listStyle: "none", padding: 0, maxHeight: 150, overflowY: "auto" }}>
            <li style={{ padding: "0.5rem 0", borderBottom: "1px solid #ddd" }}>

              Marked appointment with Buddy as done
            </li>
            <li style={{ padding: "0.5rem 0", borderBottom: "1px solid #ddd" }}>

              Added new colleague Dr. Smith
            </li>
            <li style={{ padding: "0.5rem 0" }}>

              Confirmed reservation for Luna
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}