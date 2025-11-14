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
import { useNavigate } from "react-router-dom";
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

export default function Dashboard() {
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
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const pages = [
    { name: "Appointment", keyword: "appointment", path: "/admin/appointments" },
    { name: "Pet Medical Records", keyword: "medical", path: "/admin/medical-records" },
    { name: "Notification", keyword: "notification", path: "/admin/notification" },
    { name: "Online Consultation", keyword: "consultation", path: "/admin/online-consultation" },
    { name: "Manage Orders", keyword: "orders", path: "/admin/view-orders" },
    { name: "Manage Inventory", keyword: "inventory", path: "/admin/inventory" },
    { name: "Manage Services", keyword: "service", path: "/admin/services" },
    { name: "Manage Features", keyword: "feature", path: "/admin/features" },
    { name: "Manage Announcements", keyword: "announcements", path: "/admin/announcements" },
    { name: "Manage Accounts", keyword: "accounts", path: "/admin/accounts" },
  ];
  const [categoryData, setCategoryData] = useState([]);
  const allCategories = [
    "Grooming",
    "Food",
    "Toys",
    "Supplement",
    "Medicine",
    "Vaccine",
    "Supplies"
  ];
  const allServices = [
    "Grooming",
    "Vaccination",
    "Consultation",
    "Deworming",
    "Surgery",
    "Confinement",
    "Laboratories",
    "Home Service",
  ];
  const [servicesData, setServicesData] = useState(
    allServices.map(srv => ({ service_type: srv, demand_count: 0 }))
  );

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

  const [appointmentSummaryData, setAppointmentSummaryData] = useState({
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ],
    datasets: [
      {
        label: "Appointments",
        data: Array(12).fill(0), // default
        backgroundColor: "#32b2b2",
      },
    ],
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/appointments/summary-appointment/monthly`);
        if (res.data.success) {
          setAppointmentSummaryData(prev => ({
            ...prev,
            datasets: [
              {
                ...prev.datasets[0],
                data: res.data.data, // use backend counts
              },
            ],
          }));
        }
      } catch (err) {
        console.error("Error fetching monthly summary:", err);
      }
    };

    const fetchCategorySummary = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/orders/summary-orders/categories`);
        if (res.data.success) {
          setCategoryData(res.data.data);

        }
      } catch (err) {
        console.error("Error fetching category summary:", err);
      }
    };

    const fetchServicesSummary = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/pet_medical_records/summary-service-demand/services`);
        if (res.data.results) {
          const normalized = allServices.map(srv => {
            const found = res.data.results.find(r => r.service_type === srv);
            return { service_type: srv, demand_count: found ? found.demand_count : 0 };
          });

          setServicesData(normalized);
        }
      } catch (err) {
        console.error("Error fetching service demand:", err);
      }
    };

    fetchServicesSummary();
    fetchCategorySummary();
    fetchSummary();
  }, []);

  const categoryChartData = {
    labels: allCategories,
    datasets: [
      {
        label: "Orders",
        data: allCategories.map((cat) => {
          const match = categoryData.find((d) => d.category === cat);
          return match ? match.orders : 0;
        }),
        backgroundColor: "#32b2b2",
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

  function OrdersByCategoryChart() {
    return <Bar data={categoryChartData} options={categoryChartOptions} />;
  }

  const servicesChartData = {
    labels: servicesData.map(d => d.service_type),
    datasets: [
      {
        label: 'Service Demand',
        data: servicesData.map(d => d.demand_count),
        backgroundColor: '#32b2b2',
      },
    ],
  };

  const servicesChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Service Demand (Current Month)', font: { size: 18 } },
    },
    scales: { y: { beginAtZero: true } },
  };

  function ServicesChart() {
    return (
      <Bar data={servicesChartData} options={servicesChartOptions} />
    );
  }

  const handleUpcomingAppointmentsFetch = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA'); // "2025-11-11"
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/appointments/upcoming-appointment/${today}`);
      setAppointments(res.data.fetchData);
    } catch (err) {
      console.error("Error fetching upcoming appointments:", err);
    }
  };

  const handleOnlineConsultationsFetch = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA'); // "2025-11-11"
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/online_consult/details/consultation/${today}`);
      setConsultations(res.data.fetchData);
    } catch (err) {
      console.error("Error fetching online consultations:", err);
    }
  };

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

  const handleAdvanceReservationFetch = async () => {
    try {
      const date = new Date().toLocaleDateString('en-CA');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/appointments/future/${date}`);
      setReservations(res.data.fetchData);
    } catch (err) {
      console.error("Error fetching advance reservations:", err);
    }
  };

  useEffect(() => {
    handleUpcomingAppointmentsFetch();
    handleOnlineConsultationsFetch();
    handleAdvanceReservationFetch();
    handleMetricStatus();
  }, []);

  const handleStatusUpdate = async (id, newStatus, type = "appointments") => {
    try {
      if (type === "appointments") {
        const res = await axios.put(
          `${process.env.REACT_APP_API_URL}/appointments/status-update-appointment/${id}`,
          { status: newStatus }
        );

        if (res.data.success) {
          setAppointments((prev) =>
            prev.map((appt) =>
              appt.id === id ? { ...appt, isDone: newStatus } : appt
            )
          );
        } else {
          console.error("Failed to update appointment status:", res.data.error);
        }
      } else if (type === "consultations") {
        const res = await axios.put(
          `${process.env.REACT_APP_API_URL}/online_consult/status-update-consultation/${id}`,
          { status: newStatus }
        );

        if (res.data.success) {
          setConsultations((prev) =>
            prev.map((consult) =>
              consult.id === id ? { ...consult, isDone: newStatus } : consult
            )
          );
        } else {
          console.error("Failed to update consultation status:", res.data.error);
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };


  const handleReservationAction = async (id, action) => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/appointments/${id}/status`,
        { status: action }
      );

      if (res.data.message) {
        setReservations((prev) =>
          prev.map((reservation) =>
            reservation.id === id ? { ...reservation, status: action } : reservation
          )
        );
      } else {
        console.error("Failed to update reservation status:", res.data);
      }
    } catch (err) {
      console.error("Error updating reservation status:", err);
    }
  };

  const todayAppointments = appointments.filter(
    (appt) =>
      appt.setDate === selectedDate.toLocaleDateString('en-CA') &&
      appt.isDone === "Scheduled"
  );

  const todayConsultations = consultations.filter(
    (consult) =>
      consult.setDate === selectedDate.toLocaleDateString('en-CA') &&
      consult.isDone === "Scheduled"
  );

  return (
    <div className="admin-dashboard">
      { }
      <main className="admin-dashboard-main">
        <header className="admin-dashboard-header">
          <h2>Admin Dashboard</h2>
          <div className="admin-search-wrapper">
            <input
              type="text"
              value={query}
              placeholder="Search pet, owner, or reason..."
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
                <div><FaDog /> Total Pet Registered</div>
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
                      <h3>Appointments Summary</h3>
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
                            justifyContent: "space-between",
                            background: "#edf2f7",
                            borderRadius: "10px",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                            padding: "0.8rem 1rem",
                            marginBottom: "0.8rem",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "1rem", color: "#333" }}>
                              {appt.ownerName}
                            </strong>
                            <div style={{ color: "#666", fontSize: "0.9rem" }}>
                              {appt.setDate} • {appt.setTime}
                            </div>
                            <div style={{ color: "#777", fontSize: "0.85rem" }}>
                              Status: <b>{appt.isDone}</b>
                            </div>
                          </div>

                          {appt.isDone === "Scheduled" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                style={buttonStyles.green}
                                onClick={() => handleStatusUpdate(appt.id, "Done", "appointments")}
                              >
                                Mark as Done
                              </button>
                              <button
                                style={buttonStyles.red}
                                onClick={() => handleStatusUpdate(appt.id, "Cancelled", "appointments")}
                              >
                                Cancel
                              </button>
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
                        <li key={consult.id} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          background: "#edf2f7",
                          borderRadius: "8px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                          padding: "1rem",
                          marginBottom: "1rem",
                        }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "1rem" }}>{consult.petName}</strong> – {consult.concern}
                            <div style={{ color: "#666", fontSize: "0.9rem" }}>
                              {consult.ownerName} • {consult.setTime}
                            </div>
                            <div style={{ color: "#777", fontSize: "0.85rem" }}>
                              Status: <b>{consult.isDone}</b>
                            </div>
                          </div>
                          {consult.isDone === "Scheduled" && (
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
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, height: '500px', overflowY: 'auto' }}>
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
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "1rem" }}>{res.ownerName}</strong>
                            <br />
                            <div style={{ color: "#666", fontSize: "0.9rem" }}>
                              {res.setDate} • {res.setTime}
                            </div>
                            <div style={{ color: "#777", fontSize: "0.85rem" }}>
                              Status: <b>{res.status}</b>
                            </div>
                          </div>
                          {res.status === "Pending" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button style={buttonStyles.green} onClick={() => handleReservationAction(res.id, "Approved")}>Confirm</button>
                              <button style={buttonStyles.red} onClick={() => handleReservationAction(res.id, "Declined")}>Cancel</button>
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