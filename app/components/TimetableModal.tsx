"use client";

import React, { useState, useEffect } from "react";
import { Clock, Book, User, MapPin, CalendarDays, Plus, Info } from "lucide-react";
import Modal from "./Modal";

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingEntry?: any | null;
  classes: any[];
  teachers: any[];
}

export default function TimetableModal({
  isOpen,
  onClose,
  onSuccess,
  editingEntry,
  classes,
  teachers
}: TimetableModalProps) {
  const [formData, setFormData] = useState({
    classId: "",
    sectionId: "Sec-A",
    day: "Monday",
    subject: "",
    teacherId: "",
    startTime: "08:00",
    endTime: "08:45",
    room: "",
    status: "Active"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        setFormData({
          classId: editingEntry.classId.toString(),
          sectionId: editingEntry.sectionId,
          day: editingEntry.day,
          subject: editingEntry.subject,
          teacherId: editingEntry.teacherId.toString(),
          startTime: editingEntry.startTime,
          endTime: editingEntry.endTime,
          room: editingEntry.room || "",
          status: editingEntry.status || "Active"
        });
      } else {
        setFormData({
          classId: "",
          sectionId: "Sec-A",
          day: "Monday",
          subject: "",
          teacherId: "",
          startTime: "08:00",
          endTime: "08:45",
          room: "",
          status: "Active"
        });
      }
      setErrorMsg("");
    }
  }, [isOpen, editingEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Basic validation
    if (formData.startTime >= formData.endTime) {
      setErrorMsg("End time must be after start time.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!editingEntry;
      const bodyData = isEdit ? { ...formData, id: editingEntry.id } : formData;

      const res = await fetch("/api/timetable", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save timetable entry.");
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
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : editingEntry ? "Update Schedule" : "Add Entry"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}
      subtitle={editingEntry ? "Update an existing period or session" : "Schedule a new period for a class"}
      icon={editingEntry ? <Clock size={20} /> : <Plus size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="550px"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        
        {/* Class Selection */}
        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Select Class</label>
          <select 
            required 
            className="form-input"
            value={formData.classId}
            onChange={e => setFormData({...formData, classId: e.target.value})}
          >
            <option value="">-- Choose Class --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Section Selection */}
        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Section</label>
          <select 
            required 
            className="form-input"
            value={formData.sectionId}
            onChange={e => setFormData({...formData, sectionId: e.target.value})}
          >
            <option value="Sec-A">Sec-A</option>
            <option value="Sec-B">Sec-B</option>
            <option value="Sec-C">Sec-C</option>
            <option value="Sec-D">Sec-D</option>
          </select>
        </div>

        {/* Day Selection */}
        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Day</label>
          <select 
            required 
            className="form-input"
            value={formData.day}
            onChange={e => setFormData({...formData, day: e.target.value})}
          >
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Subject</label>
          <div style={{ position: "relative" }}>
            <Book size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              required 
              className="form-input"
              style={{ paddingLeft: "36px" }}
              placeholder="e.g. Mathematics" 
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
            />
          </div>
        </div>

        {/* Teacher Selection */}
        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Assigned Teacher</label>
          <select 
            required 
            className="form-input"
            value={formData.teacherId}
            onChange={e => setFormData({...formData, teacherId: e.target.value})}
          >
            <option value="">-- Choose Teacher --</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Room */}
        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Classroom / Room #</label>
          <div style={{ position: "relative" }}>
            <MapPin size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              required 
              className="form-input"
              style={{ paddingLeft: "36px" }}
              placeholder="e.g. Room 302" 
              value={formData.room}
              onChange={e => setFormData({...formData, room: e.target.value})}
            />
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Start Time</label>
          <input 
            required 
            type="time"
            className="form-input"
            value={formData.startTime}
            onChange={e => setFormData({...formData, startTime: e.target.value})}
          />
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>End Time</label>
          <input 
            required 
            type="time"
            className="form-input"
            value={formData.endTime}
            onChange={e => setFormData({...formData, endTime: e.target.value})}
          />
        </div>

        {errorMsg && (
          <div style={{ gridColumn: "1 / -1", color: "var(--danger)", fontSize: "0.85rem", textAlign: "center", padding: "0.85rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <Info size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
            {errorMsg}
          </div>
        )}
      </div>
    </Modal>
  );
}
