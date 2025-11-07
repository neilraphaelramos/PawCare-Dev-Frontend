import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function VerifyReset() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    const id = searchParams.get("id");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token || !id) {
            setError("Invalid reset link.");
            setLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL}/reset-password-request/reset/validate`,
                    {
                        params: { token, id },
                    }
                );

                if (res.data.message) {
                    navigate(`/reset-password?token=${token}&id=${id}`);
                } else {
                    setError("Invalid reset link.");
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token, id, navigate]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: "100px" }}>
                <h2>Verifying reset link...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: "center", marginTop: "100px" }}>
                <h2>{error}</h2>
                <p>
                    Please request a new password reset link{" "}
                    <a href="/reset-password-request">here</a>.
                </p>
            </div>
        );
    }

    return null;
}
