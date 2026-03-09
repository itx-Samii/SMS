"use client";

import React, { useState } from "react";
import { X, Send, Bell, MessageSquare, Users, Shield, GraduationCap, BookOpen } from "lucide-react";

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: any) => Promise<boolean>;
  sender: { id: number; name: string; role: string };
}

export default function ComposeMessageModal({ 
  isOpen, 
  onClose, 
  onSend,
  sender 
}: ComposeMessageModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    recipientRole: "ALL",
    recipientId: "ALL",
    type: "notification" as 'notification' | 'message'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await onSend({
      ...formData,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role
    });

    setIsSubmitting(false);
    if (success) {
      setFormData({
        title: "",
        content: "",
        recipientRole: "ALL",
        recipientId: "ALL",
        type: "notification"
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "550px" }}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Compose Announcement</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Send a system-wide or targeted notification
              </p>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: "0.5rem" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="form-label">Type</label>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'notification'})}
                    style={{ 
                      flex: 1, 
                      padding: "0.6rem", 
                      borderRadius: "8px", 
                      fontSize: "0.85rem",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      gap: "0.5rem",
                      border: "1px solid",
                      backgroundColor: formData.type === 'notification' ? "rgba(59,130,246,0.1)" : "transparent",
                      borderColor: formData.type === 'notification' ? "var(--primary)" : "var(--border)",
                      color: formData.type === 'notification' ? "var(--primary)" : "var(--text-muted)",
                      cursor: "pointer"
                    }}
                  >
                    <Bell size={16} /> Notification
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'message'})}
                    style={{ 
                      flex: 1, 
                      padding: "0.6rem", 
                      borderRadius: "8px", 
                      fontSize: "0.85rem",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      gap: "0.5rem",
                      border: "1px solid",
                      backgroundColor: formData.type === 'message' ? "rgba(59,130,246,0.1)" : "transparent",
                      borderColor: formData.type === 'message' ? "var(--primary)" : "var(--border)",
                      color: formData.type === 'message' ? "var(--primary)" : "var(--text-muted)",
                      cursor: "pointer"
                    }}
                  >
                    <MessageSquare size={16} /> Message
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Audience</label>
                <select 
                  className="form-input"
                  value={formData.recipientRole}
                  onChange={(e) => setFormData({...formData, recipientRole: e.target.value})}
                  style={{ marginTop: "0.25rem" }}
                >
                  <option value="ALL">Everyone</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="TEACHER">Teachers Only</option>
                  <option value="PARENT">Parents Only</option>
                  <option value="ADMIN">Admins Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Title</label>
              <input 
                required
                className="form-input"
                placeholder="e.g. Monthly Exam Result Published"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="form-label">Message Content</label>
              <textarea 
                required
                className="form-input"
                placeholder="Write your announcement here..."
                rows={5}
                style={{ resize: "vertical" }}
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
              />
            </div>

            <div style={{ 
              padding: "0.75rem", 
              borderRadius: "8px", 
              backgroundColor: "rgba(59,130,246,0.05)", 
              border: "1px dashed rgba(59,130,246,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <div style={{ color: "var(--primary)" }}>
                {formData.recipientRole === 'ALL' && <Users size={20} />}
                {formData.recipientRole === 'STUDENT' && <GraduationCap size={20} />}
                {formData.recipientRole === 'TEACHER' && <BookOpen size={20} />}
                {formData.recipientRole === 'PARENT' && <Users size={20} />}
                {formData.recipientRole === 'ADMIN' && <Shield size={20} />}
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                This {formData.type} will be visible to <strong>{formData.recipientRole === 'ALL' ? 'all users' : `all ${formData.recipientRole.toLowerCase()}s`}</strong> in the system.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {isSubmitting ? "Sending..." : <><Send size={18} /> Send {formData.type === 'notification' ? 'Announcement' : 'Message'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
