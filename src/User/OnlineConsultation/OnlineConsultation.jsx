import React, { useState, useContext, useEffect, useRef } from 'react';
import { FaPaperPlane, FaVideo, FaRegWindowClose } from 'react-icons/fa';
import './OnlineConsultation.css';
import { UserContext } from '../../hook/authContext';
import axios from 'axios';
import JitsiWrapper from './component/jitsiApi';
import { io } from 'socket.io-client';

const OnlineConsultation = () => {
  const { user } = useContext(UserContext);

  const fullName = {
    first: user.firstName,
    middle: user.middleName,
    last: user.lastName,
    suffix: user.suffix,
  };

  const processName = Object.values(fullName).filter(Boolean).join(" ");

  const [fillUp, setFillUp] = useState({
    owner_name: processName,
    pet_name: "",
    pet_type: "",
    pet_species: "",
    concern_description: "",
    consult_type: "",
    file_payment: '',
  });


  const [formSubmitted, setFormSubmitted] = useState(false);
  const [startCall, setStartCall] = useState(false);
  const [channelConsultID, setChannelConsultID] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: '👋 Hello! Thank you for submitting your consultation request.' },
    { from: 'bot', text: 'Please wait while one of our licensed veterinarians reviews your concern.' },
  ]);

  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [petList, setPetList] = useState([]);

  const handleInputChange = (e) => {
    setFillUp({ ...fillUp, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFillUp((prev) => ({
        ...prev,
        file_payment: file,
      }));
    }
  };

  const handleMessageModalClose = () => {
    setShowModal(false)
    setIsSubmitted(false)
  }

  const handleOpenCall = () => {
    if (!channelConsultID) return; // safety check
    setStartCall(true);
    sessionStorage.setItem("startCall", JSON.stringify(true));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    try {
      const formData = new FormData();
      formData.append("owner_name", fillUp.owner_name);
      formData.append("pet_name", fillUp.pet_name);
      formData.append("pet_type", fillUp.pet_type);
      formData.append("pet_species", fillUp.pet_species);
      formData.append("concern_description", fillUp.concern_description);
      formData.append("consult_type", fillUp.consult_type);
      formData.append("file_payment", fillUp.file_payment);

      const res = await axios.post("/server-api/online_consult/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      try {
        await axios.post('/server-api/notifications/api', {
          UID: user.id,
          title_notify: 'Submit Request Successfully',
          type_notify: 'Online Consultation',
          details: `Thank you for submitting the Online Consultation Request. 
                    Please wait for our veterinarian to review your request.`,
        });
      } catch (notifyErr) {
        console.error("Notification error:", notifyErr);
      }

      if (!res.data.success) {
        setShowModal(true);
        setMessageModal('Your Request Error. Please try again!')
        setFormSubmitted(false);
      } else {
        setShowModal(true)
        setMessageModal('Your Request is ' + res.data.message);
        const consultID = res.data.channel_consult_ID;
        setChannelConsultID(consultID);
        setFormSubmitted(true);

        // store in session but DO NOT auto-start call
        sessionStorage.setItem("channelConsultID", consultID);
        sessionStorage.setItem("isSubmitted", JSON.stringify(true));
        sessionStorage.setItem("startCall", JSON.stringify(false));
      }
    } catch (err) {
      console.error("Error requesting consultation:", err);
    }
  };

  useEffect(() => {
    const dataConsult = sessionStorage.getItem("channelConsultID");
    const isSubmitted = JSON.parse(sessionStorage.getItem('isSubmitted') || 'false');
    const dataSetCall = JSON.parse(sessionStorage.getItem('startCall') || 'false');
    setChannelConsultID(dataConsult);
    setFormSubmitted(isSubmitted);
    setStartCall(dataSetCall);
  }, []);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const res = await axios.get(`/server-api/fetch_pet/${user.username}`);
        if (res.data.success) {
          setPetList(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching pet list:", err);
      }
    };
    fetchPets();
  }, [user.username]);

  const handlePetSelect = (e) => {
    const selectedPetName = e.target.value;
    const selectedPet = petList.find(pet => pet.pet_name === selectedPetName);

    setFillUp((prev) => ({
      ...prev,
      pet_name: selectedPetName,
      pet_type: selectedPet ? selectedPet.petType : '',
      pet_species: selectedPet ? selectedPet.species : '',
    }));
  };

  const handleCloseCall = () => {
    sessionStorage.removeItem("channelConsultID");
    sessionStorage.removeItem("isSubmitted");
    sessionStorage.removeItem("startCall");

    setChannelConsultID(null);
    setStartCall(false);
    setFormSubmitted(false);
    setMessages([
      { from: 'bot', text: '👋 Hello! Thank you for submitting your consultation request.' },
      { from: 'bot', text: 'Please wait while one of our licensed veterinarians reviews your concern.' },
    ]);
    setMessage('');
  };

  const handleSendMessage = () => {
    if (message.trim() === '' || !socketRef.current) return;

    const msgObj = { from: 'user', text: message };
    socketRef.current.emit('sendMessage', { consultID: channelConsultID, ...msgObj });
    setMessages((prev) => [...prev, msgObj]);
    setMessage('');
  };

  // Auto-scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!channelConsultID) return;

    console.log('[Socket] Initializing connection...');

    socketRef.current = io(process.env.REACT_APP_API_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('[Socket] Connected with ID:', socketRef.current.id);

      socketRef.current.emit('joinConsult', {
        consultID: channelConsultID,
        userType: 'user',
      });
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });

    socketRef.current.on('receiveMessage', (msg) => {
      console.log('[Socket] Received message:', msg);
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on('systemMessage', (msg) => {
      console.log('[Socket] System message:', msg);
      setMessages((prev) => [...prev, { from: 'bot', text: msg }]);
    });

    return () => {
      if (socketRef.current) {
        console.log('[Socket] Disconnecting...');
        socketRef.current.disconnect();
      }
    };
  }, [channelConsultID]);

  return (
    <div className="consultation-container">
      <h2>Online Consultation</h2>

      {!formSubmitted ? (
        <form className="consultation-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Pet Name</label>
            <select name="pet_name" onChange={handlePetSelect} required>
              <option value="">Select your pet</option>
              {petList.map((pet, idx) => (
                <option key={idx} value={pet.pet_name}>
                  {pet.pet_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Pet Type</label>
            <input
              name="pet_type"
              type="text"
              value={fillUp.pet_type}
              placeholder='Your Pet Type'
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Pet Species</label>
            <input
              name="pet_type"
              type="text"
              value={fillUp.pet_species}
              placeholder='Your Pet Species'
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Concern Description</label>
            <textarea
              name='concern_description'
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Describe your concern..."
            ></textarea>
          </div>

          <div className="form-group">
            <label>Consultation Type</label>
            <select name='consult_type' onChange={handleInputChange} required>
              <option value="">Select type</option>
              <option value="regular">Regular (300 pesos)</option>
              <option value="urgent">Urgent (500 pesos)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Payment Proof (Screenshot or Receipt)</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} required />
          </div>

          <div className="form-group">
            <label>Where to Pay:</label>
            <div className="payment-instructions">
              <p><strong>GCash:</strong> 0917-123-4567 (PawCare Clinic)</p>
              <p><strong>Bank Transfer:</strong> BPI - Account No. 1234-5678-90</p>
              <p><strong>Note:</strong> Please include your name and pet's name in the reference.</p>
            </div>
          </div>

          <div className="form-group full-width">
            <button className="user-dashboard-primary-btn" type="submit" disabled={isSubmitted}>
              {isSubmitted ? 'Submitting...' : 'Submit Consultation Request'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className='box-close-call'>
            <FaRegWindowClose className='btn-close-call' onClick={handleCloseCall} />
          </div>

          {!startCall ? (
            <div className="chat-section">
              <div className="chat-box">
                {messages.map((msg, index) => (
                  <div key={index} className={`chat-message-wrapper ${msg.from}`}>
                    <img
                      src={msg.from === 'user'
                        ? user.pic
                        : 'https://i.ibb.co/GtY8N6t/vet-avatar.png'
                      }
                      alt={msg.from}
                      className="chat-avatar"
                    />
                    <div className={`chat-message ${msg.from}`}>{msg.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-row">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage}><FaPaperPlane /></button>
                <button className="call-btn" onClick={handleOpenCall}><FaVideo /></button>
              </div>
            </div>
          ) : (
            <JitsiWrapper
              roomName={`vpaas-magic-cookie-d26ed00354e841dbabe6a987da039e25/${channelConsultID}`}
              displayName={processName}
              email={user.email}
              onApiReady={(api) => {
                console.log("Jitsi API Ready", api);
                api.executeCommand("sendChatMessage", "👋 Hello doctor!");
                api.addEventListener("incomingMessage", (event) => {
                  setMessages((prev) => [...prev, { from: "bot", text: event.message }]);
                });
                api.addEventListener("videoConferenceLeft", () => {
                  console.log("Jitsi call ended");
                  setStartCall(false); // go back to chat
                  sessionStorage.setItem("startCall", JSON.stringify(false));
                });
              }}
            />
          )}
        </>
      )}
      {showModal && (
        <div className="messageconsult-overlay" onClick={() => setShowModal(false)}>
          <div
            className="messageconsult-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="messageconsult-header">
              <h3>Consultation Notice</h3>
            </div>
            <div className="messageconsult-body">
              <p>{messageModal}</p>
            </div>
            <div className="messageconsult-footer">
              <button
                onClick={handleMessageModalClose}
                className="messageconsult-close-btn"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineConsultation;
