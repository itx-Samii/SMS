"use client";

import React from "react";
import { X, Bell, MessageSquare, Clock, CheckCircle2, User } from "lucide-react";

interface Message {
  id: number;
  senderName: string;
  senderRole: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  type: 'notification' | 'message';
}

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onMarkRead: (id: number) => void;
  onCompose?: () => void;
  title: string;
  typeFilter: 'notification' | 'message';
}

export default function MessagesModal({ 
  isOpen, 
  onClose, 
  messages, 
  onMarkRead, 
  onCompose,
  title,
  typeFilter 
}: MessagesModalProps) {
  if (!isOpen) return null;

  const filteredMessages = messages.filter(m => m.type === typeFilter);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "10px", 
              backgroundColor: "rgba(59,130,246,0.1)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "var(--primary)"
            }}>
              {typeFilter === 'notification' ? <Bell size={20} /> : <MessageSquare size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{title}</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                You have {filteredMessages.filter(m => !m.isRead).length} unread {typeFilter}s
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {onCompose && (
              <button 
                className="btn-primary" 
                onClick={onCompose}
                style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "8px" }}
              >
                + New
              </button>
            )}
            <button className="btn-ghost" onClick={onClose} style={{ padding: "0.5rem" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", padding: "1rem" }}>
          {filteredMessages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              <div style={{ marginBottom: "1rem", opacity: 0.3 }}>
                {typeFilter === 'notification' ? <Bell size={48} /> : <MessageSquare size={48} />}
              </div>
              <p>No {typeFilter}s found</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredMessages.map((msg) => (
                <div 
                  key={msg.id}
                  style={{ 
                    padding: "1rem", 
                    borderRadius: "12px", 
                    backgroundColor: msg.isRead ? "rgba(255,255,255,0.02)" : "rgba(59,130,246,0.05)",
                    border: "1px solid",
                    borderColor: msg.isRead ? "var(--border)" : "rgba(59,130,246,0.2)",
                    position: "relative",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--bg-lighter)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={14} color="var(--text-muted)" />
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                        {msg.senderName} 
                        <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.75rem", marginLeft: "0.4rem" }}>
                          ({msg.senderRole})
                        </span>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      <Clock size={12} />
                      {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <h4 style={{ margin: "0 0 0.4rem 0", fontSize: "1rem", color: !msg.isRead ? "var(--primary)" : "var(--text-main)" }}>
                    {msg.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {msg.content}
                  </p>

                  {!msg.isRead && (
                    <button 
                      onClick={() => onMarkRead(msg.id)}
                      style={{ 
                        marginTop: "0.75rem",
                        padding: "0.4rem 0.75rem",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        backgroundColor: "rgba(59,130,246,0.1)",
                        color: "var(--primary)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem"
                      }}
                    >
                      <CheckCircle2 size={14} />
                      Mark as Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: "center" }}>
          <button className="btn-secondary" onClick={onClose} style={{ width: "100%" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
