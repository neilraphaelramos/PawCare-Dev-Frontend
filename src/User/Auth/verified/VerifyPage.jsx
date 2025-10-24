import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying... ⏳");
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetch(`server-api/verify?token=${token}`)
        .then(async (res) => {
          const text = await res.text();
          if (res.ok) {
            setStatus(`✅ ${text}`);
            setIsVerified(true);

            // ⏰ Auto-redirect after 3 seconds
            setTimeout(() => {
              navigate("/login");
            }, 3000);
          } else {
            setStatus(`❌ ${text}`);
          }
        })
        .catch((err) => {
          console.error(err);
          setStatus("❌ Verification failed. Please try again.");
        });
    } else {
      setStatus("❌ Invalid verification link.");
    }
  }, [token, navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <h2>Email Verification</h2>
        <p>{status}</p>

        {isVerified && (
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#555" }}>
            Redirecting to login... or{" "}
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "#4caf50",
                color: "#fff",
                border: "none",
                padding: "5px 10px",
                borderRadius: "5px",
                cursor: "pointer",
                marginLeft: "5px",
              }}
            >
              Go Now
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
