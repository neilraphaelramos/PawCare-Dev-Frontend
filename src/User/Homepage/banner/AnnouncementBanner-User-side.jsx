import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function AnnouncementBanner({ onHeightChange }) {
  const [announcement, setAnnouncement] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const bannerRef = useRef(null);

  // Fetch announcement
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get("server-api/announcements/fetch");

        if (res.data.success && res.data.data.length > 0) {
          const fetched = res.data.data[0];

          // Check expiration before displaying
          if (fetched.expiration_date) {
            const expirationTime = new Date(fetched.expiration_date).getTime();
            if (Date.now() >= expirationTime) {
              setShowBanner(false);
              return;
            }
          }

          setAnnouncement(fetched);
          setShowBanner(true);
        } else {
          // No announcements
          setShowBanner(false);
        }
      } catch (err) {
        console.error("Error fetching announcement:", err);
        setShowBanner(false);
      }
    };

    fetchAnnouncement();
  }, []);

  // Adjust layout height
  useEffect(() => {
    if (bannerRef.current && onHeightChange) {
      onHeightChange(showBanner ? bannerRef.current.offsetHeight : 0);
    }
  }, [announcement, showBanner, onHeightChange]);

  // Auto-hide on expiration
  useEffect(() => {
    if (!announcement || !announcement.expiration_date) return;

    const expirationTime = new Date(announcement.expiration_date).getTime();
    const now = Date.now();

    if (now >= expirationTime) {
      setShowBanner(false);
      return;
    }

    const timeout = setTimeout(() => {
      setShowBanner(false);
    }, expirationTime - now);

    return () => clearTimeout(timeout);
  }, [announcement]);

  const handleClose = () => {
    setShowBanner(false);
    if (onHeightChange) onHeightChange(0);
  };

  if (!announcement || !showBanner) return null;

  return (
    <div
      ref={bannerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#26a0a0",
        color: "#fff",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        borderRadius: "0 0 8px 8px",
        fontFamily: "Inter, sans-serif",
        zIndex: 1100,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginRight: "130px",
          marginLeft: "120px",
          minWidth: "180px",
        }}
      >
        <span style={{ fontWeight: 500, fontSize: "14px" }}>📢 Announcement</span>
        <h3 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 700 }}>
          {announcement.title}
        </h3>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div
          style={{
            flex: 1,
            fontSize: "14px",
            lineHeight: "1.6",
            wordBreak: "break-word",
          }}
        >
          {announcement.content}
        </div>

        {announcement.button_text && announcement.button_link && (
          <a
            href={announcement.button_link}
            style={{
              backgroundColor: "#222",
              color: "#fff",
              borderRadius: "4px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {announcement.button_text}
          </a>
        )}

        <button
          onClick={handleClose}
          style={{
            background: "transparent",
            color: "#fff",
            border: "none",
            fontSize: "18px",
            fontWeight: "600",
            cursor: "pointer",
            marginLeft: "100px",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default AnnouncementBanner;
