import React, { useState, useEffect, useContext, useRef } from 'react';
import { FaTimes, FaPaperPlane, FaVideo, FaSpinner } from 'react-icons/fa';
import './OnlineConsultation.css';
import axios from 'axios';
import { UserContext } from '../../hook/authContext';
import JitsiWrapper from './componentVet/jitsiApiVet';
import { io } from 'socket.io-client';

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

  useEffect(() => {
    const storedChats = localStorage.getItem("vetChats");
    if (storedChats) {
      setChats(JSON.parse(storedChats));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("vetChats", JSON.stringify(chats));
  }, [chats]);

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
    const handleReceiveMessage = (message) => {
      const { consultID, from, text, name, photo } = message;
      setChats(prev => ({
        ...prev,
        [consultID]: [...(prev[consultID] || []), { from, text, name, photo }]
      }));
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

  // Scroll to bottom whenever chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  const startChat = (id) => {
    setActiveChatId(id);
    sessionStorage.setItem("ConsultId", id);
    const vetName = `Dr. ${user.firstName}`
    socketRef.current.emit('joinConsult', { consultID: id, name: vetName, userType: 'vet' });

    if (!chats[id]) {
      setChats(prev => ({
        ...prev,
        [id]: [
          { from: 'bot', text: `You started consultation with ${fetchOC.find(r => r.channelConsult === id)?.ownerName}.` }
        ]
      }));
    }
  };

  const obtainConsult = () => {
    setActiveChatId(null);
    sessionStorage.removeItem('ConsultId');
    localStorage.removeItem("vetChats");
    fetchOnlineConsult();
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !activeChatId) return;

    const messageData = {
      consultID: activeChatId,
      from: 'vet',
      name: `Dr. ${user.firstName}`,
      text: inputMessage.trim(),
      photo: user.pic
    };

    socketRef.current.emit('sendMessage', messageData);

    setChats(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), messageData]
    }));

    setInputMessage('');
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
                      <button
                        className="view-proof-btn"
                        onClick={() => openProofModal(req.paymentProof)}
                      >
                        View Proof
                      </button>
                    </p>
                    <p><strong>Concern:</strong> {req.concern}</p>
                    <p><strong>Type:</strong> {req.consultationType}</p>
                    <button
                      className="accommodate-btn"
                      onClick={() => startChat(req.channelConsult)}
                    >
                      Accommodate
                    </button>
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
    </div>
  );
};

export default VetConsultationAdmin;
