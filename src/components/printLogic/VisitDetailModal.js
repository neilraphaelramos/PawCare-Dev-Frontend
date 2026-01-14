import React, { useRef, useState, useEffect, useContext, use } from "react";
import "./VisitDetailModal.css";
import '../../modal/modal_design.css';
import { useReactToPrint } from "react-to-print";
import { UserContext } from "../../hook/authContext";
import axios from 'axios';

const formatTimeToAMPM = (time) => {
  if (!time) return "N/A";

  // supports HH:mm or HH:mm:ss
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minute} ${ampm}`;
};

const VisitDetailModal = ({ selectedVisit, selectedPet, onClose, role, printName, setSelectedVisit, Saving, processing }) => {
    if (!selectedVisit) return null;
    const [printBy, setPrintBy] = useState("");
    const [isSwitch, setIsSwitch] = useState(true);
    const { user } = useContext(UserContext);
    const contentRef = useRef(null);
    const actionsRef = useRef(null);
    const [messageModal, setMessageModal] = useState("");
    const [showMessageModal, setShowMessageModal] = useState(false);
    const reactToPrint = useReactToPrint({
        contentRef,
        documentTitle: `Visit_${selectedPet?.name}`,
        onAfterPrint: () => {
            setIsSwitch(false);
        },
        onPrintError: () => {
            setIsSwitch(false);
        },
    });

    const previousTimeRef = useRef(selectedVisit?.time || '');

    const handleVisitTimeChange = (e) => {
        const value = e.target.value;
        if (!value) return;

        const [hour, minute] = value.split(":").map(Number);
        const totalMinutes = hour * 60 + minute;

        const minTime = 8 * 60;
        const maxTime = 17 * 60;

        if (totalMinutes < minTime || totalMinutes > maxTime) {
            setMessageModal("Time must be between 8:00 AM and 5:00 PM");
            setShowMessageModal(true);

            setSelectedVisit(prev => ({
                ...prev,
                time: previousTimeRef.current
            }));
            return;
        }

        previousTimeRef.current = value;
        setSelectedVisit(prev => ({
            ...prev,
            time: value
        }));
    };

    const handleCloseModalMessage = () => {
        setMessageModal("");
        setShowMessageModal(false);
    };

    const logVetAction = async (action) => {
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/logs-vet/set-action-in`,
                {
                    UID: user.id,
                    vetName: printName,
                    action_vet: action
                }
            );
            console.log("✔ Vet action logged:", action);
        } catch (err) {
            console.error("❌ Failed to log vet action:", err);
        }
    };

    const handleVetSave = async () => {
        if (role === "Veterinarian") {
            await logVetAction(`Edited/Updated visit history of ${selectedPet?.name}`);
        }
        Saving();
    };

    const handleVetPrint = async () => {
        if (role === "Veterinarian") {
            await logVetAction(`Printed visit record for ${selectedPet?.name}`);
        }

        setIsSwitch(true);

        setTimeout(() => {
            reactToPrint();
        }, 500);
    };

    useEffect(() => {
        if (!actionsRef.current) return;

        if (role === "User") {
            setPrintBy({ name: "System Generated" });
            setIsSwitch(true);
            actionsRef.current.style.display = "none";
        } else if (role === "Veterinarian") {
            setPrintBy({ name: printName });
            setIsSwitch(false);
            actionsRef.current.style.display = "block";
        } else {
            setPrintBy({ name: `${printName}-Admin` });
            setIsSwitch(false);
            actionsRef.current.style.display = "block";
        }

    }, [role, printName]);

    useEffect(() => {
        if (selectedVisit?.time) {
            previousTimeRef.current = selectedVisit.time;
        }
    }, [selectedVisit]);

    return (
        <div className="all-visit-detail-modal-overlay">
            <div className="all-visit-detail-modal" ref={contentRef}>
                <div className='all-user-print-button'>
                    <button
                        className="all-print-btn"
                        onClick={handleVetPrint}
                    >Print
                    </button>
                    <button className="all-close-btn" onClick={() => onClose(null)}>×</button>
                </div>

                <div className="all-mr-header-section">
                    <img src="/images/LandingPage/rivera-logo.png" alt="Clinic Logo" className="mr-clinic-logo" />
                    <div className="all-mr-clinic-details">
                        <h1>PetCare Animal Clinic</h1>
                        <p>123 Veterinary Street, Bocaue, Bulacan</p>
                        <p>Contact: (044) 123-4567 | Email: petcare@clinic.com</p>
                        <p>Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="all-scrollable-print">
                    {/* Printable Header */}

                    {/* Patient Medical Summary */}
                    <div className="all-section-summary-page1">
                        <h2 className="all-section-title">Patient Medical Summary</h2>

                        <div className="all-detail-field">
                            <div className="all-detail-label">Pet Name:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedPet.name}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedPet.name}
                                    disabled
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Owner Name:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedPet.ownerName}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedPet.ownerName}
                                    disabled
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Species:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedPet.species}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedPet.species}
                                    disabled
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Owner Address:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.ownerAddress}</div>
                            ) : (
                                <textarea
                                    type="text"
                                    value={selectedVisit.ownerAddress || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, ownerAddress: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Age:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedPet.age}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedPet.age}
                                    disabled
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Owner Phone Number:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.ownerPhoneNum}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.ownerPhoneNum || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, ownerPhoneNum: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Diagnosis:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.diagnosis}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.diagnosis}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, diagnosis: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Owner Email:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.ownerEmail}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.ownerEmail}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, ownerEmail: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Date Visit:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.date || 'N/A'}</div>
                            ) : (
                                <input
                                    type="date"
                                    value={selectedVisit.date || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, date: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Time Visit:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">
                                    {selectedVisit.status === "Confinement"
                                        ? "Under Confinement"
                                        : selectedVisit.time
                                            ? formatTimeToAMPM(selectedVisit.time)
                                            : "N/A"}
                                </div>
                            ) : (
                                <input
                                    type="time"
                                    value={selectedVisit.time || ''}
                                    onChange={handleVisitTimeChange}
                                    className="all-editable-input"
                                    min="08:00"
                                    max="17:00"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Date Discharged:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.completed || 'N/A'}</div>
                            ) : (
                                <input
                                    type="date"
                                    value={selectedVisit.completed}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, completed: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Patient Status:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.status || 'N/A'}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.status}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, status: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Nursing Issues:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.nursingIssues || 'N/A'}</div>
                            ) : (
                                <textarea
                                    value={selectedVisit.nursingIssues || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, nursingIssues: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Care Plan:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.carePlan || 'N/A'}</div>
                            ) : (
                                <textarea
                                    value={selectedVisit.carePlan || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, carePlan: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Local Status Check:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.localStatus || 'N/A'}</div>
                            ) : (
                                <textarea
                                    value={selectedVisit.localStatus || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, localStatus: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                    </div>

                    <div className="all-page-break" />

                    {/* Medical Assessment */}
                    <div className="all-section-summary-page2">
                        <h2 className="all-section-title">Medical Assessment</h2>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Main Complaint:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.complaint || 'N/A'}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.complaint}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, complaint: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Additional Complaints:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.additionalComplaint || 'N/A'}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.additionalComplaint || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, additionalComplaint: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Weight:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.weight || 'N/A'}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.weight || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, weight: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Height:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.height || 'N/A'}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.height || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, height: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">BMI:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.bmi || 'N/A'}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.bmi || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, bmi: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Blood Pressure:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.bloodPressure || 'N/A'}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.bloodPressure || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, bloodPressure: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Pulse:</div>
                            {isSwitch ? (
                                <div className="all-detail-value">{selectedVisit.pulse || 'N/A'}</div>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedVisit.pulse || ''}
                                    onChange={(e) => setSelectedVisit({ ...selectedVisit, pulse: e.target.value })}
                                    className="all-editable-input"
                                />
                            )}
                        </div>

                        {/* Prescriptions */}
                        <h2 className="all-section-title">Prescriptions</h2>
                        <div className="all-detail-field">
                            <div className="all-detail-label">Medications:</div>
                            <div className="all-detail-value">
                                <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                                    {isSwitch ? (
                                        <li>{selectedVisit.medications || "N/A"}</li>
                                    ) : (
                                        <textarea
                                            value={selectedVisit.medications || ''}
                                            onChange={(e) => setSelectedVisit({ ...selectedVisit, medications: e.target.value })}
                                            className="all-editable-input"
                                        />
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Signature */}
                    <div className="all-signature-block">
                        <div className="all-signature-line"></div>
                        <div className="all-signature-caption">Veterinarian: {selectedVisit.veterinarianName || 'Not Assigned'}</div>
                    </div>

                    <div className="all-detail-actions" ref={actionsRef}>
                        <button
                            className="all-save-btn"
                            onClick={handleVetSave}
                            disabled={processing}
                        >
                            {processing ? "Saving..." : "Save Changes"}
                        </button>
                    </div>

                    <div className="all-print-footer">Print by: {printBy.name}</div>
                </div>
            </div>

            {showMessageModal && (
                <div className="All-Message-modal-overlay">
                    <div className="All-Message-modal">
                        <div className="All-Message-modal-header">
                            <h2>Alert Message</h2>
                        </div>

                        <div className="All-Message-modal-body">
                            <p>{messageModal}</p>
                        </div>

                        <div className="All-Message-modal-footer">
                            <button
                                className="All-Message-close-btn"
                                onClick={handleCloseModalMessage}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitDetailModal;
