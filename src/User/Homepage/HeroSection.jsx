import React from 'react';
import HeroText from './HeroText';
import HeroImage from './HeroImage';
import './LandingPage.css'; // Make sure to update class names accordingly

export default function HeroSection() {
  return (
    <div className="home-container">
      {/* Optional: Uncomment if you want Navbar inside HeroSection */}
      {/* <Navbar /> */}

      <div className="home-container">
      <div className="home-banner-container">
        <div className="home-text-section">
          <HeroText />
        </div>
        <div className="home-image-section">
          <HeroImage />
        </div>
      </div>
    </div>
    </div>
  );
}