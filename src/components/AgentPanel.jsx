import React, { useState } from 'react';
import { PaperPlaneRight, Robot } from '@phosphor-icons/react';

const AgentPanel = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { text: "Hello! I am KABAW. How can I optimize your harvest today?", sender: "agent" }
  ]);

  const handleSend = () => {
    if (query.trim()) {
      setMessages([...messages, { text: query, sender: "user" }]);
      setQuery('');
      setTimeout(() => {
        setMessages(prev => [...prev, { text: "I'll analyze the latest production summary for you.", sender: "agent" }]);
      }, 1000);
    }
  };

  return (
    <div className="right-panel">
      <div className="chat-panel">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#d4f84f', padding: '10px', borderRadius: '1rem', color: '#123f26' }}>
              <Robot size={24} weight="fill" />
            </div>
            <div>
              <h2>KABAW Agent</h2>
              <p>Powered by AI</p>
            </div>
          </div>
        </div>
        <div className="chat-history">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-input-area">
          <input type="text" placeholder="Ask about crops..." value={query} onChange={e => setQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} />
          <button className="send-btn" onClick={handleSend}><PaperPlaneRight size={20} weight="fill" /></button>
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;
