import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ResetFormDesign.css";
import "../../../modal/modal_design.css";

export default function ResetRequestForm() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messageModal, setMessageModal] = useState("");
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const openModal = (message) => {
        setMessageModal(message);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/reset-password-request`,
                { email }
            );

            if (res.data.message) {
                openModal("✅ " + res.data.message);
                setEmail("");
                navigate("/login");
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
                <img src="images/bg4.png" alt="Dog" />
            </div>

            <div className="reset-form-section">
                <div className="reset-card">
                    <h1>Reset Password</h1>
                    <p className="reset-subtext">
                        Enter your email to receive a password reset link.
                    </p>

                    <form onSubmit={handleSubmit} className="reset-form">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Sending..." : "Send Reset Link"}
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
