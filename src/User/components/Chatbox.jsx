import React, { useState, useEffect } from "react";
import "./Chatbox.css";
import { FaTimes, FaPaperPlane, FaChevronDown } from "react-icons/fa";

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I’m your Symptoms Checker. Tell me what your pet is experiencing.", sender: "system" },
  ]);
  const [input, setInput] = useState("");

  const toggleChat = () => setIsOpen(!isOpen);

  // Simulated AI response (frontend only, no backend)
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === "user") {
      // Simple simulated AI reply after delay
      const timer = setTimeout(() => {
        let reply = "Hmm, I suggest you monitor the symptoms closely.";
        const text = lastMsg.text.toLowerCase();

        if (text.includes("vomit") || text.includes("throw up")) {
          reply =
            "Vomiting can be caused by several issues like infections or diet. Please consider visiting a veterinarian soon.";
        } else if (text.includes("cough") || text.includes("sneeze")) {
          reply =
            "Coughing or sneezing might indicate respiratory issues. Consulting a vet is recommended.";
        } else if (text.includes("lethargic") || text.includes("tired")) {
          reply =
            "Lethargy can be serious. Keep an eye on your pet and get professional advice if it persists.";
        }

        setMessages((prev) => [...prev, { text: reply, sender: "system" }]);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input.trim(), sender: "user" }]);
      setInput("");
    }
  };

  return (
    <div className="chatbox-wrapper">
      {isOpen ? (
        <div className="chatbox fb-style">
          <div className="chat-header">
            <div className="chat-profile">
              <img src="/images/logo.png" alt="Profile" className="chat-avatar" />
              <span>Symptoms Checker</span>
            </div>
            <FaChevronDown className="close-icon" onClick={toggleChat} />
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>
                {msg.sender === "user" ? (
                  <>
                    <div className="message-bubble">{msg.text}</div>
                    <img src="/images/max.jpg" alt="User" className="chat-avatar user-avatar" />
                  </>
                ) : (
                  <>
                    <img src="/images/logo.png" alt="Bot" className="chat-avatar" />
                    <div className="message-bubble">{msg.text}</div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="chat-input-section">
            <input
              type="text"
              placeholder="Type your pet's symptoms..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <FaPaperPlane className="send-icon" onClick={handleSend} />
          </div>
        </div>
      ) : (
        <div className="chat-header-collapsed" onClick={toggleChat}>
          <img src="/images/logo.png" alt="Chat" className="chat-avatar" />
          <span className="chat-title">Symptoms Checker</span>
          <FaChevronDown className="chat-close" />
        </div>
      )}
    </div>
  );
}
