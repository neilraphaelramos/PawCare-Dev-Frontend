import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./VerifyPage.css";

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying... ⏳");
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetch(`${process.env.REACT_APP_API_URL}/verify?token=${token}`)
        .then(async (res) => {
          const text = await res.text();
          if (res.ok) {
            setStatus(`✅ ${text}`);
            setIsVerified(true);
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
    <div className="verify-container">
      <div className="verify-card">
        <h2 className="verify-title">Email Verification</h2>
        <p className="verify-status">{status}</p>

        {isVerified && (
          <p className="verify-redirect">
            Redirecting to login... or{" "}
            <button
              onClick={() => navigate("/login")}
              className="verify-button"
            >
              Go Now
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
