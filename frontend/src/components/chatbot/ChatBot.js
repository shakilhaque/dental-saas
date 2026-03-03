import React, { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../../api';

const DISCLAIMER = '⚠️ AI responses are for general information only, not medical advice.';

export default function ChatBot({ tenantSubdomain, tenantName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `👋 Hello! I'm your AI dental assistant for **${tenantName || 'our clinic'}**.\n\nI can help you with:\n• Dental health questions\n• Appointment booking guidance\n• Post-treatment care advice\n• Clinic information\n\nHow can I help you today?`, time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Date.now().toString());
  const [bookingIntent, setBookingIntent] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, time: new Date() }]);
    setLoading(true);

    try {
      const { data } = await chatAPI.sendMessage({ message: userMsg, sessionId });
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.message, time: new Date() }]);
      if (data.data.bookingIntent) setBookingIntent(true);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble right now. Please call the clinic directly. 😊", time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  };

  const quickQuestions = [
    "What are your opening hours?",
    "How do I book an appointment?",
    "What services do you offer?",
    "I have tooth pain, what should I do?",
    "Post-extraction care tips"
  ];

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: '50%', background: '#1e40af', border: 'none',
        boxShadow: '0 4px 20px rgba(30,64,175,0.4)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, zIndex: 1000, transition: 'transform 0.2s',
        transform: open ? 'scale(0.9)' : 'scale(1)'
      }}>
        {open ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, width: 360, height: 520,
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', zIndex: 999,
          border: '1px solid #e2e8f0'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
            padding: '14px 16px', borderRadius: '16px 16px 0 0',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 28 }}>🦷</span>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>Dental AI Assistant</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>🟢 Online • Replies instantly</div>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ padding: '8px 12px', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: 11, color: '#92400e' }}>
            {DISCLAIMER}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10
              }}>
                {msg.role === 'assistant' && <span style={{ fontSize: 18, marginRight: 6, alignSelf: 'flex-end' }}>🦷</span>}
                <div style={{
                  maxWidth: '78%',
                  padding: '9px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? '#1e40af' : '#f8fafc',
                  color: msg.role === 'user' ? 'white' : '#1e293b',
                  fontSize: 13, lineHeight: 1.5,
                  border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none'
                }}
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🦷</span>
                <div style={{ background: '#f8fafc', padding: '9px 14px', borderRadius: '12px 12px 12px 2px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Thinking...</span>
                </div>
              </div>
            )}
            {bookingIntent && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 12 }}>
                <strong>📅 Want to book?</strong><br />
                <a href="/patient/appointments" style={{ color: '#1e40af', fontSize: 12 }}>Click here to book an appointment →</a>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div style={{ padding: '4px 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {quickQuestions.slice(0, 3).map(q => (
                <button key={q} onClick={() => { setInput(q); }} style={{
                  padding: '4px 10px', background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: 20, fontSize: 11, color: '#1d4ed8', cursor: 'pointer'
                }}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything about dental health..."
              style={{
                flex: 1, padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 20,
                fontSize: 13, outline: 'none'
              }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
              width: 36, height: 36, borderRadius: '50%', background: '#1e40af', border: 'none',
              color: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: !input.trim() ? 0.5 : 1
            }}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
