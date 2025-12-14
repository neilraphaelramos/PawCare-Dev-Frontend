import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./AiAssistant.css";

const frequentQuestions = [
  { question: "Why is my dog vomiting?" },
  { question: "Can my cat be vaccinated today?" },
  { question: "How often should I deworm my pet?" }
];

const AiChatBox = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I’m Dr. Paws, your AI pet guide.\n\nI can help answer pet-related questions and guide you on how to use the system. Please note that I am not a replacement for a licensed veterinarian." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (msg) => {
    if (!msg.trim()) return;

    const userMessage = { sender: "user", text: msg };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ask-ai/api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });

      const data = await response.json();
      const aiMessage = { sender: "ai", text: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Oops! Something went wrong. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (q) => {
    sendMessage(q.question);
  };

  return (
    <div className="ai-chatbox-container">
      <div className="ai-chatbox-header">
        <span>🐾 PetCare AI Chatbot</span>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="ai-chatbox-body">
        {messages.map((msg, idx) => (
          <div key={idx} className={`ai-message ${msg.sender === "ai" ? "ai" : "user"}`}>
            {msg.sender === "ai" ? (
              <div>
                <div className="ai-avatar">🐾 Dr. Paws</div>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
              </div>
            ) : (
              msg.text
            )}
          </div>
        ))}

        {loading && <div className="ai-message ai">Typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-faq-footer">
        <div className="ai-faq-toggle" onClick={() => setFaqOpen(!faqOpen)}>
          <span>💡 Common Questions</span>
          <span>{faqOpen ? "▲" : "▼"}</span>
        </div>
        {faqOpen && (
          <div className="ai-faq-list">
            {frequentQuestions.map((q, i) => (
              <button key={i} onClick={() => handleQuestionClick(q)}>
                {q.question}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ai-chatbox-footer">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
        />
        <button onClick={() => sendMessage(input)} className="send-ai-enter">
          Send
        </button>
      </div>
    </div>
  );
};

export default AiChatBox;
