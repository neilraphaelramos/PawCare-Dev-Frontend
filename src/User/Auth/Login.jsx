import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import "./Auth.css";
import { UserContext } from "../../hook/authContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const { setUser, setTokenData } = useContext(UserContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showModal, setShowModal] = useState(false);
  const [messageModal, setMessageModal] = useState("");
  const [nextRoute, setNextRoute] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (message, route = "") => {
    setMessageModal(message);
    setShowModal(true);
    setNextRoute(route);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsLoggingIn(false)
    if (nextRoute) {
      navigate(nextRoute);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true)
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/login`, form);

      if (res.data.message === "Login successful") {
        const role = res.data.user.role;
        setUser(res.data.user);
        setTokenData(res.data.jitsiToken);

        // Determine the route based on role
        let route = "";
        if (role === "Admin") route = "/admin";
        else if (role === "Veterinarian") route = "/veterinarian";
        else route = "/users";

        openModal(res.data.message, route);
      } else {
        openModal("Login failed.");
        setIsLoggingIn(false)
      }
    } catch (error) {
      openModal(error.response?.data?.error || "Login failed.");
      setIsLoggingIn(false)
    }
  };

  const handleGoogleAuth = async (credentialResponse) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/google`, {
        token: credentialResponse.credential,
      });

      setUser(res.data.user);
      openModal(res.data.message, "/users");
    } catch (err) {
      console.error(err);
      openModal("Something went wrong.");
    }
  };

  const handleGoogleError = () => {
    openModal("Google Login Failed");
  };

  return (
    <div className="login-container">
      <div className="login-image-section">
        <img src="images/bg4.png" alt="Dog" />
      </div>

      <div className="login-form-section">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1>Login</h1>
          <p className="subtext">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <div className="forgot-password">
              <a href="/reset-password-request">Forgot password?</a>
            </div>
            <button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div className="social-login">
            <GoogleLogin
              className="google"
              onSuccess={handleGoogleAuth}
              onError={handleGoogleError}
            />
          </div>

          <p className="signup-text">
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </motion.div>
      </div>

      {showModal && (
        <div className="login-modal-overlay">
          <div className="login-modal">
            <p>{messageModal}</p>
            <button className="login-modal-close" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
