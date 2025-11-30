import React, { useState, useEffect, useContext, useRef } from 'react';
import { FaTimes, FaPaperPlane, FaVideo, FaSpinner } from 'react-icons/fa';
import './OnlineConsultation.css';
import '../../modal/modal_design.css'
import axios from 'axios';
import { UserContext } from '../../hook/authContext';
import JitsiWrapper from './componentAdmin/jitsiApiAdmin';
import { io } from 'socket.io-client';
import { MessageSquare } from 'lucide-react';

const VetConsultationAdmin = () => {
  const [filter, setFilter] = useState('all');
  const [activeChatId, setActiveChatId] = useState(null);
  const [chats, setChats] = useState({});
  const [inputMessage, setInputMessage] = useState('');
  const [fetchOC, setFetchOC] = useState([]);
  const [inCall, setInCall] = useState(false);
  const { user, tokenData } = useContext(UserContext);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineData, setDeclineData] = useState(null);

  // Fetch consultations
  const fetchOnlineConsult = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/online_consult`);
      setFetchOC(res.data.fetchData);
    } catch (err) {
      console.error("Error fetching consultations:", err);
      setError("Failed to load consultations. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isOnCalling = sessionStorage.getItem('inCalling');
    const ConsultID = sessionStorage.getItem("ConsultId");
    setInCall(isOnCalling === 'true');
    setActiveChatId(ConsultID);
    fetchOnlineConsult();

    // Initialize Socket.IO client only once
    const socket = io(process.env.REACT_APP_API_URL);
    socketRef.current = socket;

    // Define handlers
    const handleReceiveMessage = async (message) => {
      const { consultID, from, text, name, photo } = message;

      setChats((prev) => ({
        ...prev,
        [consultID]: [...(prev[consultID] || []), { from, text, name, photo }],
      }));

      // 🟢 Save incoming user message to DB
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/consult_messages/save`, {
          consult_id: consultID,
          sender_type: from,
          sender_name: name,
          message_text: text,
        });
      } catch (err) {
        console.error("Error saving incoming message:", err);
      }
    };


    const handleSystemMessage = ({ consultID, message }) => {
      setChats(prev => ({
        ...prev,
        [consultID]: [...(prev[consultID] || []), { from: 'system', text: message }]
      }));
    };

    // Attach handlers
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('systemMessage', handleSystemMessage);

    // Cleanup
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('systemMessage', handleSystemMessage);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const storedChatId = sessionStorage.getItem("ConsultId");
    if (!storedChatId) return;

    setActiveChatId(storedChatId);

    const initializeChat = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/consult_messages/${storedChatId}`);
        const messagesFromDB = res.data.success
          ? res.data.messages.map((m) => ({
            from: m.sender_type,
            name: m.sender_name,
            text: m.message_text,
          }))
          : [];

        setChats((prev) => ({
          ...prev,
          [storedChatId]: messagesFromDB.length
            ? messagesFromDB
            : [
              {
                from: "bot",
                text: `You resumed consultation with ${fetchOC.find((r) => r.channelConsult === storedChatId)?.ownerName || "the user"
                  }.`,
              },
            ],
        }));
      } catch (err) {
        console.error("Error initializing chat messages:", err);
      }
    };

    if (fetchOC.length > 0) {
      initializeChat();
    }
  }, [fetchOC]);

  // Scroll to bottom whenever chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  const startChat = async (id) => {
    setActiveChatId(id);
    sessionStorage.setItem("ConsultId", id);
    const adminName = "Admin";

    socketRef.current.emit("joinConsult", {
      consultID: id,
      name: adminName,
      userType: "vet",
    });

    try {
      // 🟢 Fetch messages from database
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/consult_messages/${id}`);
      const messagesFromDB = res.data.success
        ? res.data.messages.map((m) => ({
          from: m.sender_type,
          name: m.sender_name,
          text: m.message_text,
        }))
        : [];

      setChats((prev) => ({
        ...prev,
        [id]: messagesFromDB.length
          ? messagesFromDB
          : [
            {
              from: "bot",
              text: `You started consultation with ${fetchOC.find((r) => r.channelConsult === id)?.ownerName
                }.`,
            },
          ],
      }));
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const obtainConsult = () => {
    setActiveChatId(null);
    sessionStorage.removeItem('ConsultId');
    localStorage.removeItem("vetChats");
    fetchOnlineConsult();
  };

  const handleUpdateStatus = async (consultID, newStatus, date, time) => {
    try {
      const res = await axios.patch(
        `${process.env.REACT_APP_API_URL}/online_consult/update-status/${consultID}`,
        { status: newStatus }
      );

      if (res.data.success) {
        const userId = res.data.user_id;

        // 2️⃣ Prepare readable date/time for approved consultations
        let detailsMessage = `Your online consultation request has been ${newStatus}.`;
        if (newStatus === "Approved" && date && time) {
          const readableDate = new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          detailsMessage = `Your online consultation on ${readableDate} at ${time} has been approved.`;
        }

        await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api`, {
          UID: userId,
          title_notify: `Consultation ${newStatus}`,
          type_notify: "Consultation",
          details: detailsMessage,
        });

        await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api/send-notification`, {
          UID: userId,
          type: "Consultation",
          title: `Consultation ${newStatus}`,
          message: detailsMessage,
        });

        fetchOnlineConsult();
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status. Please try again.");
    }
  };

  const confirmDecline = async () => {
    if (!declineData) return;

    try {
      const res = await axios.patch(
        `${process.env.REACT_APP_API_URL}/online_consult/update-status/${declineData.channelConsult}`,
        {
          status: "Declined",
          decline_reason: declineReason
        }
      );

      if (res.data.success) {
        const userId = res.data.user_id; // 🔥 GET USER ID

        await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api`, {
          UID: userId,
          title_notify: "Consultation Declined",
          type_notify: "Consultation",
          details: `Your online consultation request has been declined. Reason: ${declineReason}`,
        });

        await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api/send-notification`, {
          UID: userId,
          type: "Consultation",
          title: `Consultation Declined`,
          message: `Your online consultation request has been declined. Reason: ${declineReason}`,
          mess1: 'Request Received',
          mess2: 'we have received your Consultation request'
        });

        // Clean up modal
        setShowDeclineModal(false);
        setDeclineReason("");
        setDeclineData(null);
        fetchOnlineConsult();
      }

    } catch (err) {
      console.error("Error declining consultation:", err);
      alert("Failed to submit decline reason.");
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeChatId) return;

    const messageData = {
      consultID: activeChatId,
      from: "vet",
      name: "Admin",
      text: inputMessage.trim(),
      photo: `${process.env.REACT_APP_MAIN_URL}/images/logo.png`,
    };

    // 🟣 Emit message via socket
    socketRef.current.emit("sendMessage", messageData);

    // 🟢 Save to state
    setChats((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), messageData],
    }));

    setInputMessage("");

    // 🟢 Save to database
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/consult_messages/save`, {
        consult_id: activeChatId,
        sender_type: "vet",
        sender_name: "Admin",
        message_text: inputMessage.trim(),
      });
    } catch (err) {
      console.error("Error saving message to DB:", err);
    }
  };


  const openProofModal = (proofUrl) => {
    setSelectedProof(proofUrl);
    setShowProofModal(true);
  };

  const closeProofModal = () => {
    setSelectedProof(null);
    setShowProofModal(false);
  };

  return (
    <div className="vet-admin-container">
      <h2>Vet Consultation Requests</h2>

      {isLoading && (
        <div className="loading-overlay">
          <FaSpinner className="loading-spinner" />
          <p>Loading consultations...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchOnlineConsult}>Retry</button>
        </div>
      )}

      {!inCall ? (
        <>
          <div className="filter-buttons">
            <button className={filter === 'all' ? 'active-filter' : ''} onClick={() => setFilter('all')}>All</button>
            <button className={filter === 'urgent' ? 'active-filter' : ''} onClick={() => setFilter('urgent')}>Urgent</button>
            <button className={filter === 'regular' ? 'active-filter' : ''} onClick={() => setFilter('regular')}>Regular</button>
          </div>

          <div className="requests-list">
            {fetchOC.filter(req => filter === 'all' || req.consultationType === filter).length === 0 ? (
              <div className="admin-no-requests">
                No Consultation Requests Found.
              </div>
            ) : (
              fetchOC
                .filter(req => filter === 'all' || req.consultationType === filter)
                .map(req => (
                  <div key={req.id} className={`request-card ${req.consultationType}`}>
                    <h3>{req.petName} ({req.petSpecies})</h3>
                    <p><strong>Pet Type:</strong> {req.petType}</p>
                    <p><strong>Owner:</strong> {req.ownerName}</p>
                    <p>
                      <strong>Payment Proof:</strong>{' '}
                      <a
                        className="admin-view-proof-btn"
                        onClick={() => openProofModal(req.paymentProof)}
                      >
                        View Receipt
                      </a>
                    </p>
                    <p><strong>Concern:</strong> {req.concern}</p>
                    <p>
                      <strong>Type:</strong>{' '}
                      <span className={`admin-consult-type ${req.consultationType}`}>
                        {req.consultationType}
                      </span>
                    </p>
                    <p><strong>Date:</strong> {req.setDate || "Null"}</p>
                    <p><strong>Time:</strong> {req.setTime || "Null"}</p>
                    <p><strong>Status:</strong>{' '}
                      <span className={`status-badge ${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </p>
                    {req.status === 'Declined' && (
                      <p><strong>Reason Declined:</strong> {req.reason || "Null"}</p>
                    )}
                    <div className='btn-container-footer'>
                      <button
                        className='approve-btn-admin'
                        onClick={() => handleUpdateStatus(req.channelConsult, 'Approved', req.setDate, req.setTime)}
                      >
                        Approved
                      </button>
                      <button
                        className='decline-btn-admin'
                        onClick={() => {
                          setDeclineData(req);
                          setShowDeclineModal(true);
                        }}
                      >
                        Declined
                      </button>
                      <button
                        className={`accommodate-btn-admin`}
                        onClick={() => startChat(req.channelConsult)}
                      >
                        <MessageSquare />
                      </button>
                    </div>

                  </div>
                ))
            )}
          </div>

          {activeChatId && (
            <div className="chat-panel">
              <div className="chat-header">
                <h3>
                  Chat with {fetchOC.find(r => r.channelConsult === activeChatId)?.ownerName}
                </h3>
                <button className="close-chat-btn" onClick={obtainConsult}><FaTimes /></button>
              </div>

              <div className="chat-messages">
                {(chats[activeChatId] || []).map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.from === 'vet' ? 'from-vet' : msg.from === 'user' ? 'from-user' : 'from-system'}`}>
                    {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-row">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage}><FaPaperPlane /></button>
                <button className="call-btn" onClick={() => { setInCall(true); sessionStorage.setItem("inCalling", true); }}><FaVideo /></button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="video-call-overlay">
          <div className="video-call-header">
            <button onClick={() => { setInCall(false); sessionStorage.removeItem('inCalling'); }} className="close-call-btn"><FaTimes /></button>
          </div>
          <div className="video-call-body">
            <JitsiWrapper
              roomName={`vpaas-magic-cookie-d26ed00354e841dbabe6a987da039e25/${activeChatId}`}
              displayName={`${user.firstName} ${user.lastName}`}
              email={user.email}
              jwt={tokenData}
              onApiReady={(api) => {
                api.executeCommand("sendChatMessage", "👋 Hello, I’m your vet!");
                api.addEventListener("incomingMessage", (event) => {
                  setChats(prev => ({
                    ...prev,
                    [activeChatId]: [...(prev[activeChatId] || []), { from: "user", text: event.message }]
                  }));
                });
              }}
              onCallEnd={() => { setInCall(false); sessionStorage.removeItem('inCalling'); }}
            />
          </div>
        </div>
      )}

      {showProofModal && (
        <div className="proof-modal-overlay" onClick={closeProofModal}>
          <div className="proof-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeProofModal}><FaTimes /></button>
            {selectedProof ? (
              selectedProof.endsWith(".pdf") ? (
                <iframe src={selectedProof} title="Payment Proof" className="proof-frame" />
              ) : (
                <img src={selectedProof} alt="Payment Proof" className="proof-image" />
              )
            ) : (
              <p>No proof available</p>
            )}
          </div>
        </div>
      )}

      {showDeclineModal && (
        <div className="all-decline-modal-overlay" onClick={() => setShowDeclineModal(false)}>
          <div className="all-decline-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Decline Appointment</h3>
            <p>Please provide a reason for declining this appointment:</p>

            <textarea
              className="all-decline-textarea"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter reason..."
            />

            <div className="all-decline-actions">
              <button
                className="all-decline-confirm"
                disabled={!declineReason.trim()}
                onClick={confirmDecline}
              >
                Confirm Decline
              </button>

              <button
                className="all-decline-cancel"
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VetConsultationAdmin;
