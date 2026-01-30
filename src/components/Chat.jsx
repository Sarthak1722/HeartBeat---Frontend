// src/components/Chat.jsx
import React, { useEffect, useRef, useState } from "react";
import socket from "../socket";

function makeGuestName() {
  return "User" + Math.floor(Math.random() * 9000 + 1000);
}
function initials(name) {
  return name.slice(0,2).toUpperCase();
}

export default function Chat({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [user] = useState(() => {
    const existing = sessionStorage.getItem("hb_user");
    if (existing) return existing;
    const g = makeGuestName();
    sessionStorage.setItem("hb_user", g);
    return g;
  });
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    function onChat(payload) {
      setMessages((m) => [...m, payload]);
    }
    function onTyping({ user: u, isTyping }) {
      setTypingUsers((t) => {
        const copy = { ...t };
        if (isTyping) copy[u] = true;
        else delete copy[u];
        return copy;
      });
    }

    socket.on("chat", onChat);
    socket.on("typing", onTyping);

    return () => {
      socket.off("chat", onChat);
      socket.off("typing", onTyping);
    };
  }, []);

  // auto-scroll when messages change
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function emitTypingState(isTyping) {
    socket.emit("typing", { roomId, user, isTyping });
  }

  function handleInput(e) {
    setText(e.target.value);
    // send typing start
    emitTypingState(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitTypingState(false);
    }, 900);
  }

  function handleSend(e) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit("chat", { roomId, user, message: trimmed });
    setText("");
    emitTypingState(false);
  }

  return (
    <div style={{ marginTop: 18, border: "1px solid #eee", padding: 12, borderRadius: 8, width: 420 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Chat — {roomId}</div>

      <div ref={listRef} style={{ maxHeight: 160, overflowY: "auto", padding: 6, background: "#fff", borderRadius: 6, border: "1px solid #f0f0f0" }}>
        {messages.length === 0 ? (
          <div style={{ color: "#888", fontSize: 13 }}>No messages yet. Say hi 👋</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {initials(m.user)}
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#444" }}>
                  <strong style={{ marginRight: 8 }}>{m.user}</strong>
                  <span style={{ color: "#888", fontSize: 11 }}>{new Date(m.serverTs || Date.now()).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: 14 }}>{m.message}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 8, minHeight: 22 }}>
        {Object.keys(typingUsers).length > 0 && (
          <div style={{ color: "#666", fontSize: 13 }}>
            {Object.keys(typingUsers).join(", ")} typing...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={text}
          onChange={handleInput}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" }}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>Send</button>
      </form>
    </div>
  );
}
