import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
import {
  FaTachometerAlt,
  FaConciergeBell,
  FaStar,
  FaFileMedical,
  FaCalendarCheck,
  FaBoxes,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";

import ProtectedRoute from "./hook/ProtectedRoute";

// Admin Sidebar
import AdminSidebar from "./modules/AdminSidebar/AdminSidebar";
import UserSidebar from "./User/Sidebar/UserSidebar";
import VetSidebar from "./Veterinarian/Sidebar/VetSidebar";
import Announcements from "./modules/Announcements/Announcements";


// Admin panel components
import AdminDashboard from "./modules/Dashboard/Dashboard";
import Inventory from "./modules/Inventory/Inventory";
import MedicalRecords from "./modules/MedicalRecords/MedicalRecords";
import Accounts from "./modules/Accounts/Accounts";
import Services from "./modules/Services/Services"
import Features from "./modules/Features/Features";
import AdminAppointments from "./modules/Appointments/Appointments";
import AdminNotifications from "./modules/Notifications/Notifications";
import ViewOrders from "./modules/ViewOrders/ViewOrders";
import VetConsultationAdmin from "./modules/OnlineConsultation/OnlineConsultation";


// User panel components
import UserDashboard from "./User/Dashboard/Dashboard";
import PetRecords from "./User/PetRecords/PetRecords";
import UserAppointments from "./User/Appointments/Appointments";
import UserNotifications from "./User/Notifications/Notifications";
import Profile from "./User/Profile/Profile";
import Login from "./User/Auth/Login";
import Register from "./User/Auth/Register";
import LandingPage from "./User/Homepage/LandingPage";
import PetProducts from "./User/PetProducts/PetProducts";
import UserSettings from "./User/Settings/Settings";
import OnlineConsultation from "./User/OnlineConsultation/OnlineConsultation";
import AiAssistant from "./User/AiAssistant/AiAssistant";
import OrderStatus from "./User/OrdersStatus/OrderStatus";



// Vet Components
import VetDashboard from "./Veterinarian/Dashboard/Dashboard";
import VetAppointments from "./Veterinarian/Appointments/Appointments";
import VetMedicalRecords from "./Veterinarian/MedicalRecords/MedicalRecords";
import VetInventory from "./Veterinarian/Inventory/Inventory";
import VetNotifications from "./Veterinarian/Notifications/Notifications";
import VetSecurity from "./Veterinarian/Security/Security";
import VetConsultation from "./Veterinarian/OnlineConsultation/OnlineConsultation";
import VetProfile from "./Veterinarian/Profile/Profile";


// Verified Account
import VerifyPage from "./User/Auth/verified/VerifyPage";

import "./App.css";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        {/* ✅ Email verification route */}
        <Route path="/verify" element={<VerifyPage />} />

        {/* Admin Panel Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <div className="app" style={{ display: "flex" }}>
                <AdminSidebar />
                <main className="main-content" style={{ flexGrow: 1 }}>
                  <Outlet />
                </main>
              </div>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="services" element={<Services />} />
          <Route path="features" element={<Features />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="medical-records" element={<MedicalRecords />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="view-orders" element={<ViewOrders />} />
          <Route path="online-consultation" element={<VetConsultationAdmin />} />
        </Route>

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <div className="user-app" style={{ display: 'flex' }}>
                <UserSidebar />  {/* Add sidebar here */}
                <main className="main-content" style={{ flexGrow: 1 }}>
                  <Outlet />
                </main>
              </div>
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="appointments" element={<UserAppointments />} />
          <Route path="pet-records" element={<PetRecords />} />
          <Route path="pet-products" element={<PetProducts />} />
          <Route path="your-orders" element={<OrderStatus />} />
          <Route path="notification" element={<UserNotifications />} />
          <Route path="online-consultation" element={<OnlineConsultation />} />
          <Route path="profile" element={<Profile />} />
          <Route path="ai-assistant" element={<AiAssistant />} />

          {/* other user routes */}
        </Route>


        <Route
          path="/veterinarian"
          element={
            <ProtectedRoute>
              <div className="vet-app" style={{ display: 'flex' }}>
                <VetSidebar />  {/* Add sidebar here */}
                <main className="main-content" style={{ flexGrow: 1 }}>
                  <Outlet />
                </main>
              </div>
            </ProtectedRoute>
          }
        >
          <Route index element={<VetDashboard />} />
          <Route path="appointments" element={<VetAppointments />} />
          <Route path="medical-records" element={<VetMedicalRecords />} />
          <Route path="inventory" element={<VetInventory />} />
          <Route path="notifications" element={<VetNotifications />} />
          <Route path="security" element={<VetSecurity />} />
          <Route path="online-consultation" element={<VetConsultation />} />
          <Route path="profile" element={<VetProfile />} />
        </Route>
      </Routes>

    </Router>
  );
}
