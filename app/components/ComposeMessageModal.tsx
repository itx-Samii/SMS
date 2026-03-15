"use client";

import React, { useState, useEffect } from "react";
import { Send, Bell, MessageSquare, Users, Shield, GraduationCap, BookOpen, AlertCircle } from "lucide-react";
import Modal from "./Modal";

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: any) => Promise<boolean>;
  sender: { id: number; name: string; role: string };
  initialData?: {
    type?: 'notification' | 'message';
    audience?: string;
    detailTarget?: string;
    title?: string;
  };
}

export default function ComposeMessageModal({ 
  isOpen, 
  onClose, 
  onSend,
  sender,
  initialData
}: ComposeMessageModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "ALL", // ALL, STUDENT, TEACHER, PARENT, ADMIN, CLASS, SECTION, USER
    detailTarget: "", // captures Class ID, User contact/search, etc.
    priority: "Normal", // Normal, Important, Urgent
    type: "notification" as 'notification' | 'message'
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || "",
        content: "",
        audience: initialData?.audience || "ALL",
        detailTarget: initialData?.detailTarget || "",
        priority: "Normal",
        type: initialData?.type || "notification"
      });
      setErrorMsg("");
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!formData.title.trim()) return setErrorMsg("Title cannot be empty.");
    if (!formData.content.trim()) return setErrorMsg("Message body cannot be empty.");
    if (['CLASS', 'SECTION', 'USER'].includes(formData.audience) && !formData.detailTarget.trim()) {
      return setErrorMsg(`Please provide a specific target for ${formData.audience}`);
    }

    setIsSubmitting(true);
    
    // Construct final audience string. If it's a specific target, we prepend the type.
    const finalAudience = ['CLASS', 'SECTION', 'USER'].includes(formData.audience) 
      ? `${formData.audience}:${formData.detailTarget}` 
      : formData.audience;

    const payload = formData.type === 'message' ? {
      type: 'message',
      senderName: sender.name,
      senderRole: sender.role,
      audience: finalAudience,
      title: formData.title,
      messageText: formData.content,
      priority: formData.priority
    } : {
      type: 'notification',
      senderName: sender.name,
      audience: finalAudience,
      title: formData.title,
      description: formData.content,
      priority: formData.priority
    };

    const success = await onSend(payload);

    setIsSubmitting(false);
    if (success) {
      alert(`${formData.type === 'notification' ? 'Notification' : 'Message'} sent successfully`);
      setFormData({
        title: "",
        content: "",
        audience: "ALL",
        detailTarget: "",
        priority: "Normal",
        type: "notification"
      });
      onClose();
    }
  };

  const footer = (
    <>
      <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </button>
      <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {isSubmitting ? "Sending..." : <><Send size={18} /> Send {formData.type === 'notification' ? 'Announcement' : 'Message'}</>}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose Announcement"
      subtitle="Send a system-wide or targeted notification"
      icon={<Send size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="600px"
    >
      {/* ROW 1: Type & Priority */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Type</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'notification'})}
              style={{ 
                flex: 1, 
                padding: "0.5rem", 
                borderRadius: "8px", 
                fontSize: "0.85rem",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: "0.4rem",
                border: "1px solid",
                backgroundColor: formData.type === 'notification' ? "rgba(59,130,246,0.1)" : "transparent",
                borderColor: formData.type === 'notification' ? "var(--primary)" : "var(--border)",
                color: formData.type === 'notification' ? "var(--primary)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Bell size={16} /> Notification
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'message'})}
              style={{ 
                flex: 1, 
                padding: "0.5rem", 
                borderRadius: "8px", 
                fontSize: "0.85rem",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: "0.4rem",
                border: "1px solid",
                backgroundColor: formData.type === 'message' ? "rgba(59,130,246,0.1)" : "transparent",
                borderColor: formData.type === 'message' ? "var(--primary)" : "var(--border)",
                color: formData.type === 'message' ? "var(--primary)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <MessageSquare size={16} /> Message
            </button>
          </div>
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Priority</label>
          <select 
            className="form-input"
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value})}
            style={{ padding: "0.5rem", margin: 0, height: "38px" }}
          >
            <option value="Normal">Normal</option>
            <option value="Important">Important</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* ROW 2: Audience & Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Audience</label>
          <select 
            className="form-input"
            value={formData.audience}
            onChange={(e) => setFormData({...formData, audience: e.target.value, detailTarget: ""})}
            style={{ padding: "0.5rem", margin: 0, height: "38px" }}
          >
            <option value="ALL">Everyone</option>
            <option value="STUDENT">All Students</option>
            <option value="TEACHER">All Teachers</option>
            <option value="PARENT">All Parents</option>
            <option value="ADMIN">All Admins</option>
            <option value="CLASS">Specific Class</option>
            <option value="SECTION">Specific Section</option>
            <option value="USER">Specific User</option>
          </select>
        </div>

        {/* Dynamic Audience Detail Inputs */}
        <div>
          {['CLASS', 'SECTION', 'USER'].includes(formData.audience) ? (
            <div className="animate-fade-in">
              <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>
                {formData.audience === 'CLASS' ? 'Class ID' : formData.audience === 'SECTION' ? 'Section Format' : "User's exact name or ID"}
              </label>
              <input 
                type={formData.audience === 'CLASS' ? "number" : "text"} 
                className="form-input" 
                style={{ padding: "0.5rem", margin: 0, height: "38px", width: "100%" }} 
                placeholder={formData.audience === 'CLASS' ? "e.g. 1" : formData.audience === 'SECTION' ? "e.g. 1-Sec-A" : "e.g. John Doe or 1042"} 
                value={formData.detailTarget} 
                onChange={(e) => setFormData({...formData, detailTarget: e.target.value})} 
              />
            </div>
          ) : (
             <div style={{ height: "100%" }}></div> // Empty placeholder
          )}
        </div>
      </div>

      {/* ROW 3: Title */}
      <div>
        <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Title</label>
        <input 
          required
          className="form-input"
          placeholder="e.g. Monthly Exam Result Published"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
      </div>

      {/* ROW 4: Content */}
      <div>
        <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Message Content</label>
        <textarea 
          required
          className="form-input"
          placeholder="Write your announcement here..."
          rows={4}
          style={{ resize: "vertical", margin: 0, padding: "0.75rem" }}
          value={formData.content}
          onChange={(e) => setFormData({...formData, content: e.target.value})}
        />
      </div>

      <div style={{ 
        padding: "0.5rem 0.75rem", 
        borderRadius: "8px", 
        backgroundColor: formData.priority === 'Urgent' ? "rgba(239, 68, 68, 0.05)" : "rgba(59,130,246,0.05)", 
        border: formData.priority === 'Urgent' ? "1px dashed rgba(239, 68, 68, 0.3)" : "1px dashed rgba(59,130,246,0.3)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}>
        <div style={{ color: formData.priority === 'Urgent' ? "var(--danger)" : "var(--primary)" }}>
          {['ALL', 'CLASS', 'SECTION'].includes(formData.audience) && <Users size={20} />}
          {formData.audience === 'STUDENT' && <GraduationCap size={20} />}
          {formData.audience === 'TEACHER' && <BookOpen size={20} />}
          {formData.audience === 'PARENT' && <Users size={20} />}
          {formData.audience === 'ADMIN' && <Shield size={20} />}
          {formData.audience === 'USER' && <MessageSquare size={20} />}
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
          This {formData.type} will be sent with <strong>{formData.priority}</strong> priority to <strong>{formData.audience === 'ALL' ? 'everyone' : ['CLASS','SECTION','USER'].includes(formData.audience) ? `specific ${formData.audience.toLowerCase()} target` : `all ${formData.audience.toLowerCase()}s`}</strong> in the system.
        </p>
      </div>
      
      {errorMsg && (
        <div style={{ color: "var(--danger)", fontSize: "0.85rem", textAlign: "center", padding: "0.5rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
          {errorMsg}
        </div>
      )}
    </Modal>
  );
}
