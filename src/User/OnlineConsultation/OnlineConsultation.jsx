import React, { useState, useContext, useEffect, useRef } from 'react';
import { FaPaperPlane, FaVideo, FaRegWindowClose } from 'react-icons/fa';
import './OnlineConsultation.css';
import { UserContext } from '../../hook/authContext';
import axios from 'axios';
import JitsiWrapper from './component/jitsiApi';
import { io } from 'socket.io-client';
import DateTimeModal from './component/DateTimeModal';
import { fi } from 'date-fns/locale';

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
  const defaultBotMessages = [
    { from: 'bot', text: '👋 Hello! Thank you for submitting your consultation request.' },
    { from: 'bot', text: 'Please wait while one of our licensed veterinarians reviews your concern.' },
  ];

  const [messages, setMessages] = useState([...defaultBotMessages]);

  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [petList, setPetList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const mergeWithBot = (msgs) => [...defaultBotMessages, ...msgs];

  const handleConfirm = (data) => {
    setSelectedDateTime(data);
    console.log("Selected:", data);
  };

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
      formData.append("user_id", user.id);
      formData.append("pet_name", fillUp.pet_name);
      formData.append("pet_type", fillUp.pet_type);
      formData.append("pet_species", fillUp.pet_species);
      formData.append("concern_description", fillUp.concern_description);
      formData.append("consult_type", fillUp.consult_type);
      formData.append("photo", fillUp.file_payment);
      formData.append("set_date", selectedDateTime?.date.toLocaleDateString('en-CA'));
      formData.append("set_time", selectedDateTime?.time);

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/online_consult/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api`, {
          UID: user.id,
          title_notify: 'Submit Request Successfully',
          type_notify: 'Online Consultation',
          details: `Thank you for submitting the Online Consultation Request. 
                    Please wait for our veterinarian to review your request.`,
        });
      } catch (notifyErr) {
        console.error("Notification error:", notifyErr);
      }

      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/notifications/vetadminapi/post`, {
          UID: user.id,
          title_notify: "Requested Online Consultation",
          type_notify: "Online Consultation",
          details: `${fillUp.owner_name} has requested an online consultation. On date of ${selectedDateTime?.date.toLocaleDateString('en-CA')} at ${selectedDateTime?.time}.`,
        });
      } catch (NErr) {
        console.error("Notification error:", NErr);
      }

      if (!res.data.success) {
        setShowModal(true);
        setMessageModal('Your Request Error. Please try again!')
        setFormSubmitted(false);
      } else {
        setShowModal(true)
        setMessageModal('Your Request is ' + res.data.message);
        setFillUp({
          owner_name: ``,
          pet_name: "",
          pet_type: "",
          pet_species: "",
          concern_description: "",
          consult_type: "",
          file_payment: '',
        });

        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        setSelectedDateTime(null);
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
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/pet_infos/fetch/${user.username}`);
        if (res.data) {
          setPetList(res.data);
        } else {
          console.error("Failed to fetch pets:", res.data.error);
        }
      } catch (err) {
        console.error("Error fetching pet list:", err);
      }
    };
    fetchPets();
  }, [user.username]);

  const handlePetSelect = (e) => {
    const selectedPetName = e.target.value;
    const selectedPet = petList.find(pet => pet.petName === selectedPetName);

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

    if (channelConsultID) {
      localStorage.removeItem(`chat_${channelConsultID}`);
    }

    setChannelConsultID(null);
    setStartCall(false);
    setFormSubmitted(false);
    setMessages([
      { from: 'bot', text: '👋 Hello! Thank you for submitting your consultation request.' },
      { from: 'bot', text: 'Please wait while one of our licensed veterinarians reviews your concern.' },
    ]);
    setMessage('');
    setFillUp({});
  };

  const handleSendMessage = () => {
    if (message.trim() === '' || !socketRef.current) return;

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');

    const msgObj = { from: 'user', text: message, name };

    // Emit via socket
    socketRef.current.emit('sendMessage', { consultID: channelConsultID, ...msgObj });

    // Update local state immediately
    setMessages(prev => mergeWithBot([...prev.slice(defaultBotMessages.length), msgObj]));
    setMessage('');
  };

  // Fetch messages only from DB, but always prepend the 2 default bot messages
  useEffect(() => {
    if (!channelConsultID) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/consult_messages/${channelConsultID}`);
        if (res.data.success) {
          const dbMessages = res.data.messages.map(m => ({
            from: m.sender_type,
            text: m.message_text,
            name: m.sender_name,
          }));
          setMessages(mergeWithBot(dbMessages));
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };

    fetchMessages();
  }, [channelConsultID]);

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

      const name = [
        user.firstName,
        user.lastName,
      ].filter(Boolean).join(' ');

      socketRef.current.emit('joinConsult', {
        consultID: channelConsultID,
        userType: 'user',
        name: name
      });
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });

    socketRef.current.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on('systemMessage', (msg) => {
      setMessages((prev) => [...prev, {
        from: 'bot',
        text: msg,
        photo: 'https://i.ibb.co/GtY8N6t/vet-avatar.png'
      }]);
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
                <option key={idx} value={pet.petName}>
                  {pet.petName}
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
              className='or-textarea'
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
            <label>Set Schedule</label>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="select-date-btn"
            >
              {selectedDateTime
                ? `${selectedDateTime.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} @ ${selectedDateTime.time}`
                : "Select Consultation Date & Time"}
            </button>
            <DateTimeModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onConfirm={handleConfirm}
            />
          </div>

          <div className="form-group">
            <label>Payment Proof (Screenshot or Receipt)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              required
              ref={fileInputRef}
            />
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
                {messages.map((msg, index) => {
                  // Log the message sender
                  console.log(`[Chat] msg.from: ${msg.from}`, msg);

                  let avatar = '';

                  if (msg.photo) {
                    avatar = msg.photo;
                  } else if (msg.from === 'vet') {
                    avatar = `${process.env.REACT_APP_MAIN_URL}/images/logo.png`;
                  } else if (msg.from === 'user') {
                    avatar = user.pic;
                  } else if (msg.from === 'bot') {
                    avatar = 'https://i.ibb.co/GtY8N6t/vet-avatar.png';
                  }

                  return (
                    <div key={index} className={`chat-message-wrapper ${msg.from}`}>
                      <img
                        src={avatar}
                        alt={msg.from}
                        className="chat-avatar"
                      />
                      <div className={`chat-message ${msg.from}`}>{msg.text}</div>
                    </div>
                  );
                })}
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
