import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { chatAPI, userAPI } from "../services/api";
import { connectSocket, getSocket, disconnectSocket } from "../services/socket";

interface ChatItem {
  _id: string;
  other: { id: string; name: string; email: string; avatar?: string } | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
}

interface Message {
  _id: string;
  sender: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

const Chat: React.FC = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatOther, setActiveChatOther] = useState<ChatItem["other"]>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(0);

  useEffect(() => {
    if (!user?.id) return;
    const s = connectSocket();
    s.emit("user-online", user.id);
    return () => {
      s.emit("user-offline", user.id);
      disconnectSocket();
    };
  }, [user?.id]);

  useEffect(() => {
    Promise.all([chatAPI.getChats(), userAPI.list()])
      .then(([chatsRes, usersRes]) => {
        setChats(chatsRes.chats || []);
        setUsers(usersRes.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    setActiveChatOther(chats.find((c) => c._id === activeChatId)?.other || null);
    chatAPI.getMessages(activeChatId).then((res) => setMessages(res.messages || []));
    const s = getSocket();
    if (s) s.emit("join-chat", activeChatId);
    return () => {
      if (s) s.emit("leave-chat", activeChatId);
    };
  }, [activeChatId, chats]);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onMsg = (payload: Message & { chatId: string }) => {
      if (payload.chatId === activeChatId) {
        setMessages((prev) => [...prev, payload]);
      }
      setChats((prev) =>
        prev.map((c) =>
          c._id === payload.chatId
            ? {
                ...c,
                lastMessage: payload.content?.substring(0, 100) || c.lastMessage,
                lastMessageTime: payload.createdAt || c.lastMessageTime,
              }
            : c
        )
      );
    };
    const onTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.isTyping) setTypingUser(data.userId);
      else setTypingUser(null);
    };
    s.on("receive-message", onMsg);
    s.on("user-typing", onTyping);
    return () => {
      s.off("receive-message", onMsg);
      s.off("user-typing", onTyping);
    };
  }, [activeChatId]);

  useEffect(() => {
    typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
    return () => clearTimeout(typingTimeoutRef.current);
  }, [typingUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = async (participantId: string) => {
    const res = await chatAPI.getOrCreateChat(participantId);
    const newChat = res.chat;
    setChats((prev) => {
      const exists = prev.some((c) => c._id === newChat._id);
      if (exists) return prev;
      return [{ ...newChat, lastMessage: null, lastMessageTime: null }, ...prev];
    });
    setActiveChatId(newChat._id);
    setActiveChatOther(newChat.other);
    setShowNewChat(false);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !activeChatId || !user) return;
    const s = getSocket();
    if (!s) return;
    s.emit("stop-typing", { chatId: activeChatId, userId: user.id });
    s.emit("send-message", {
      chatId: activeChatId,
      senderId: user.id,
      senderName: user.name,
      senderEmail: user.email,
      content: text,
    });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onTyping = () => {
    if (!activeChatId || !user) return;
    getSocket()?.emit("typing", {
      chatId: activeChatId,
      userId: user.id,
      senderName: user.name,
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const sidebarStyle: React.CSSProperties = {
    width: 320,
    minWidth: 280,
    height: "100vh",
    background: "rgba(0,0,0,0.25)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyle: React.CSSProperties = {
    padding: "20px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-dark)" }}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
              }}
            >
              💬
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "#f1f5f9",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Logout
          </button>
        </div>
        <button
          onClick={() => setShowNewChat(true)}
          style={{
            margin: 16,
            padding: "14px 20px",
            borderRadius: 14,
            border: "2px dashed rgba(168,85,247,0.5)",
            background: "rgba(168,85,247,0.1)",
            color: "#c084fc",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          + New chat
        </button>
        <div style={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: 24, color: "#94a3b8", textAlign: "center" }}>Loading chats...</div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => setActiveChatId(chat._id)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: activeChatId === chat._id ? "rgba(168,85,247,0.15)" : "transparent",
                  color: "#f1f5f9",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #06b6d4, #22c55e)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                  }}
                >
                  {chat.other?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{chat.other?.name || "Unknown"}</div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#94a3b8",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chat.lastMessage || "No messages yet"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {activeChatId ? (
          <>
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #ec4899, #f59e0b)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                }}
              >
                {activeChatOther?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{activeChatOther?.name || "Chat"}</div>
                {typingUser && (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>typing...</div>
                )}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {messages.map((msg) => {
                const isMe = msg.sender === user?.id;
                return (
                  <div
                    key={msg._id}
                    style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: 16,
                        background: isMe
                          ? "linear-gradient(135deg, #a855f7, #ec4899)"
                          : "rgba(255,255,255,0.08)",
                        borderBottomRightRadius: isMe ? 4 : 16,
                        borderBottomLeftRadius: isMe ? 16 : 4,
                      }}
                    >
                      {!isMe && (
                        <div style={{ fontSize: 12, color: "#c084fc", marginBottom: 4 }}>
                          {msg.senderName}
                        </div>
                      )}
                      <div style={{ wordBreak: "break-word" }}>{msg.content}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.6)",
                          marginTop: 4,
                        }}
                      >
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div
              style={{
                padding: 16,
                borderTop: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    onTyping();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  style={{
                    flex: 1,
                    padding: "14px 18px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#f1f5f9",
                    fontSize: 15,
                    resize: "none",
                    minHeight: 48,
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 14,
                    border: "none",
                    background: input.trim()
                      ? "linear-gradient(135deg, #a855f7, #ec4899)"
                      : "rgba(255,255,255,0.1)",
                    color: "white",
                    fontWeight: 600,
                    cursor: input.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: 18,
            }}
          >
            Select a chat or start a new one
          </div>
        )}
      </main>

      {/* New chat modal */}
      {showNewChat && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowNewChat(false)}
        >
          <div
            style={{
              background: "linear-gradient(180deg, rgba(30,20,50,0.98), rgba(15,15,26,0.98))",
              borderRadius: 24,
              padding: 32,
              maxWidth: 400,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                marginBottom: 20,
                background: "linear-gradient(90deg, #06b6d4, #22c55e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Start new chat
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {users.map((u) => (
                <button
                  key={u._id}
                  onClick={() => startChat(u._id)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #a855f7, #ec4899)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNewChat(false)}
              style={{
                marginTop: 20,
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
