import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ResetFormDesign.css";

export default function ResetPasswordForm() {
    const navigate = useNavigate();
    const location = useLocation();

    // Extract query parameters
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    const id = searchParams.get("id");

    const [form, setForm] = useState({ password: "", confirmPassword: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messageModal, setMessageModal] = useState("");
    const [showModal, setShowModal] = useState(false);

    const isPasswordMatch = form.confirmPassword
        ? form.password === form.confirmPassword
        : null;

    // Handle form input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Modal helpers
    const openModal = (message) => {
        setMessageModal(message);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        navigate("/login"); // Redirect after modal closes
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Password strength regex
        const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!strongPasswordRegex.test(form.password)) {
            openModal(
                "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
            );
            setIsSubmitting(false);
            return;
        }

        if (form.password !== form.confirmPassword) {
            openModal("Passwords do not match.");
            setIsSubmitting(false);
            return;
        }

        if (!token || !id) {
            openModal("Invalid or missing reset link.");
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await axios.patch(
                `${process.env.REACT_APP_API_URL}/reset-password-request/reset`,
                {
                    newPassword: form.password, // Backend expects `newPassword`
                    userId: parseInt(id),       // Convert ID to number
                    token: token
                }
            );

            if (res.data.message) {
                openModal("✅ " + res.data.message);
            } else if (res.data.error) {
                openModal(res.data.error);
            }
        } catch (err) {
            console.error(err);
            openModal("Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="reset-container">
            <div className="reset-image-section">
                <img src="/images/bg4.png" alt="Dog" />
            </div>

            <div className="reset-form-section">
                <div className="reset-card">
                    <h1>Set New Password</h1>

                    <form onSubmit={handleSubmit} className="reset-form">
                        <input
                            type="password"
                            name="password"
                            placeholder="New Password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm New Password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        {form.confirmPassword && (
                            <p
                                className={`reset-password-match ${
                                    isPasswordMatch ? "match" : "no-match"
                                }`}
                            >
                                {isPasswordMatch
                                    ? "✅ Passwords match"
                                    : "❌ Passwords do not match"}
                            </p>
                        )}

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>

            {showModal && (
                <div className="All-Message-modal-overlay">
                    <div className="All-Message-modal">
                        <div className="All-Message-modal-header">
                            <h2>Alert Message</h2>
                        </div>

                        <div className="All-Message-modal-body">
                            <p>{messageModal}</p>
                        </div>
                        <div className="All-Message-modal-footer">
                            <button className="All-Message-close-btn" onClick={closeModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
