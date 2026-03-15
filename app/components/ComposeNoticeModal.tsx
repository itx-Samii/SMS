"use client";

import React, { useState, useEffect } from "react";
import { Bell, Send } from "lucide-react";
import Modal from "./Modal";

interface ComposeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComposeNoticeModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: ComposeNoticeModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setContent("");
      setTargetAudience("ALL");
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || !content.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, targetAudience })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to create notice.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </button>
      <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {isSubmitting ? "Posting..." : <><Send size={18} /> Post Announcement</>}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New School Announcement"
      subtitle="Publish a notice for student, teacher, or parent noticeboards"
      icon={<Bell size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="600px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Title</label>
          <input 
            required 
            placeholder="e.g. Quarter Exams Schedule" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Audience</label>
          <select 
            className="form-input"
            value={targetAudience} 
            onChange={e => setTargetAudience(e.target.value)}
          >
            <option value="ALL">Everyone</option>
            <option value="STUDENTS">Students Only</option>
            <option value="TEACHERS">Teachers Only</option>
            <option value="PARENTS">Parents Only</option>
          </select>
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Message Content</label>
          <textarea 
            required 
            placeholder="Write the details of the announcement..." 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            className="form-input"
            style={{ minHeight: "150px", resize: "vertical" }}
          />
        </div>

        {errorMsg && (
          <div style={{ color: "var(--danger)", fontSize: "0.85rem", textAlign: "center", padding: "0.5rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
            {errorMsg}
          </div>
        )}
      </div>
    </Modal>
  );
}
