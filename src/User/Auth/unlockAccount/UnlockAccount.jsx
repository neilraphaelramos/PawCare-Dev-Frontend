import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "../Auth.css";
import "./UnlockAccount.css";

export default function UnlockAccount() {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("Verifying your unlock request...");

    const token = searchParams.get("token");

    useEffect(() => {
        async function unlockAccount() {
            try {
                const res = await axios.post(
                    `${process.env.REACT_APP_API_URL}/unlock-account`,
                    { userId, token }
                );

                if (res.data.success) {
                    setStatus("success");
                    setMessage("Your account has been successfully unlocked! You can now log in.");

                    setTimeout(() => navigate("/login"), 3000);
                } else {
                    setStatus("error");
                    setMessage(res.data.message || "Unlock request failed.");
                }
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.error || "Invalid or expired unlock link.");
            }
        }

        unlockAccount();
    }, [userId, token, navigate]);

    return (
        <div className="login-container">
            <div className="login-form-section">
                <div className="login-card">

                    {status === "loading" && (
                        <>
                            <h2>Unlocking Account...</h2>
                            <p>Please wait...</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <h2>🎉 Account Unlocked</h2>
                            <p>{message}</p>
                            <button className="unlock-btn" onClick={() => navigate("/login")}>
                                Go to Login
                            </button>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <h2>❌ Unlock Failed</h2>
                            <p>{message}</p>
                            <button className="unlock-btn" onClick={() => navigate("/login")}>
                                Back to Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
