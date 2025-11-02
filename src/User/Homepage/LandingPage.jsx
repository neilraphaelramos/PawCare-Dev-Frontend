import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import HeroSection from './HeroSection'
import AnnouncementBanner from './banner/AnnouncementBanner-User-side';
import "./LandingPage.css";
import { FaUser, FaComments } from 'react-icons/fa';
import { Navigation } from "swiper/modules";
import AiAssistant from "../AiAssistant/AiAssistant";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import axios from 'axios';
import 'swiper/css';
import 'swiper/css/pagination';
import featuresData from "../../data/features.json";

import {
  FaCamera,
  FaCalendarAlt,
  FaClipboardList,
  FaBell,
  FaChartBar,
  FaPills,
  FaBox,
  FaRobot
} from "react-icons/fa";


const iconMap = {
  "FaCamera": <FaCamera color="#26a0a0" />,
  "FaCalendarAlt": <FaCalendarAlt />,
  "FaClipboardList": <FaClipboardList />,
  "FaBell": <FaBell />,
  "FaChartBar": <FaChartBar />,
  "FaPills": <FaPills />,
  "FaBox": <FaBox />,
  "FaRobot": <FaRobot />
};


function Hero() {
  return (
    <main>
      <HeroSection />
      {/* Other sections go here */}
    </main>
  );
}


// Main LandingPage
export default function LandingPage() {
  const [services, setServices] = useState([]);
  const [features, setFeatures] = useState([]);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [showAssistant, setShowAssistant] = useState(false);

  const fetchDataServices = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/services/fetch`);

      if (!Array.isArray(response.data)) {
        console.error("Invalid response format from server.");
        return;
      }

      setServices(response.data);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const fetchFeatures = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/feature/fetch`);
      if (res.data.success) {
        setFeatures(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching features:", err);
    }
  };

  useEffect(() => {
    fetchDataServices();
    fetchFeatures();
  }, [])

  return (
    <div className="landing-page" id="home">
      <AnnouncementBanner onHeightChange={setBannerHeight} />
      <header className="navbar modern-navbar">
        <div className="modern-container"
          style={{
            paddingTop: `${bannerHeight > 0 ? bannerHeight : 3}px`,
            transition: "padding-top 0.3s ease",
          }}
        >
          <div className="logo">
            <img src="/images/LandingPage/rivera-logo.png" className="logo-img" alt="Rivera Logo" />
            <span className="clinic-name">Rivera Veterinary Clinic</span>
          </div>
          <nav className="nav-links">
            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <a href="/login" className="btn primary-btn" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <FaUser style={{ marginRight: '6px' }} />
              Login
            </a>

          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      <section className="services" id="services">
        <motion.h2
          className="services-title"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Our Services
        </motion.h2>

        <motion.div
          className="service-cards-container"
          initial="hidden"
          whileInView="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              className="service-card"
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <img src={service.image} alt={service.title} />
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </motion.div>

          ))}
        </motion.div>
      </section>

      <section className="features-section" id="features">
        <div className="features-wrapper">
          <motion.div
            className="features-left"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="features-title">
              Why Choose <span>Us</span>
            </h2>
            <p className="features-description">
              Experience modern, stress-free pet care with smart tools, expert vets, and services designed for your convenience—online and in-clinic.
              Access everything we offer by logging in—it’s quick and helps us care for your pet better.
            </p>
            <p className="features-subtext">
              <em></em>
            </p>
            <img
              src="/images/LandingPage/feature-bg.png"
              alt="Pet graphic"
              className="features-illustration"
            />
          </motion.div>

          <motion.div
            className="features-right"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="features-grid">
              {features.map((feature, index) => (
                <motion.div
                  className="feature-card"
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="feature-icon">
                    {iconMap[feature.icon]}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>



      <section className="about-section" id="about">
        <div className="about-bg-wrapper">
          <img src="/images/LandingPage/about-bg.png" alt="Background" className="about-bg" />
          <div className="about-tint"></div>
        </div>

        <div className="about-overlay">
          <div className="about-card">
            <motion.div
              className="about-text"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <h2>About Us</h2>
              <p>
                Rivera Veterinary Clinic and Grooming Services is dedicated to providing quality pet care and grooming. Our expert team is committed to keeping your furry friends healthy and happy.
              </p>
              <p>
                To make your experience even better, we provide an easy-to-use online system where pet owners can schedule appointments, access medical records, and stay updated on your pet’s health anytime, anywhere.
              </p>
              <p>
                We encourage you to use this system for a more convenient and seamless way to care for your pets. Your pet’s well-being is our top priority, and this platform helps us serve you better.
              </p>
            </motion.div>

            <motion.div
              className="about-image"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              viewport={{ once: true }}
            >
              <img src="/images/LandingPage/vet-landing.png" alt="Veterinarian and pet" />
            </motion.div>
          </div>
        </div>
      </section>




      <section className="location-contact-section" id="contact">
        <motion.h2
          className="contact-title"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Contact Us
        </motion.h2>

        <div className="contact-content">
          <motion.div
            className="contact-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h3 className="clinic-name">
              <strong>Rivera Veterinary Clinic & Grooming Services</strong>
            </h3>

            <p className="contact-item">
              {/* ...phone icon and text */}
              Tel: 0927 392 4215
            </p>

            <p className="contact-item">
              {/* ...location icon and text */}
              Address: 9192 MacArthur Highway, Lolomboy, Bocaue, Bulacan
            </p>

            <p className="contact-item">
              {/* ...email icon and text */}
              Email: riveravetclinic@gmail.com
            </p>

            <p className="contact-item">
              {/* ...clock icon and text */}
              Hours: 8 AM – 6 PM (Daily)
            </p>
          </motion.div>

          <motion.div
            className="map-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
          >

            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3556.5126115441276!2d120.93675151028215!3d14.773987385673628!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b3b606d67ef9%3A0x6b55303d2e6fe11d!2sRIVERA%20VETERINARY%20CLINIC%20AND%20GROOMING%20SERVICES!5e1!3m2!1sen!2sph!4v1748055970459!5m2!1sen!2sph"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </motion.div>
        </div>
      </section>



      <footer className="footer">
        <div className="footer-container">
          {/* Logo/Clinic Info */}
          <div className="footer-section">
            <h3 className="footer-logo">Rivera Vet Clinic</h3>
            <p>Providing compassionate veterinary care and grooming services for your furry family members.</p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Pages</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4>Contact Us</h4>
            <p>9192 MacArthur Highway, Lolomboy, Bocaue, Bulacan</p>
            <p>0927 392 4215</p>
            <p>riveravetclinic@gmail.com</p>
          </div>

          {/* Social Icons */}
          <div className="footer-section social">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="https://www.facebook.com/riveravetclinic"><img src="/images/facebook.png" alt="Facebook" /></a>
              <a href="https://www.instagram.com/riveravetclinic"><img src="/images/instagram.png" alt="Instagram" /></a>
              <a href="https://www.tiktok.com/@riveravetclinic"><img src="/images/tik-tok.png" alt="Tik-Tok" /></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Rivera Veterinary Clinic. All rights reserved.</p>
        </div>
      </footer>

      {!showAssistant && (
        <div className="ai-assistant-btn-wrapper">
          <button
            className="ai-assistant-btn"
            onClick={() => setShowAssistant(!showAssistant)}
            aria-label="Toggle AI Assistant"
          >
            <FaComments size={22} color="white" />
            <span className="ai-assistant-tooltip">Chat with our AI Assistant</span>
          </button>
        </div>
      )}

      {showAssistant && (
        <AiAssistant onClose={() => setShowAssistant(false)} />
      )}


    </div>
  );
}