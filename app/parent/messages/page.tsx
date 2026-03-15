"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import { MessageSquare, LayoutDashboard, CalendarCheck, BookOpen, Clock, Award, Bell, DollarSign, Search, Filter, Trash2, Users } from "lucide-react";
import ComposeMessageModal from "@/app/components/ComposeMessageModal";

interface Message {
  id: number;
  senderName: string;
  senderRole: string;
  audience: string;
  title: string;
  messageText: string;
  dateTime: string;
  priority: string;
  status: string;
}

export default function ParentMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCompose, setShowCompose] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [replyData, setReplyData] = useState<{audience?: string, detailTarget?: string, type?: 'message'|'notification', title?: string} | undefined>(undefined);

  const [activeTab, setActiveTab] = useState("messages");

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "marks", label: "Marks Management", icon: Award },
    { id: "assignments", label: "Assignments", icon: BookOpen },
    { id: "notices", label: "Announcements", icon: Bell },
  ];

  const fetchMessages = async (user: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?role=${user.role}&userId=${user.id}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchMessages(user);
    }
  }, []);

  const markRead = async (id: number) => {
    try {
      await fetch("/api/messages", { 
        method: "PATCH", 
        headers: {"Content-Type":"application/json"}, 
        body: JSON.stringify({id, status: 'Read'}) 
      });
      fetchMessages(currentUser);
    } catch (err) {}
  };

  const handleSendMessage = async (payload: any) => {
    try {
      const isMessage = payload.type === 'message';
      const endpoint = isMessage ? "/api/messages" : "/api/notifications";
      const body = { ...payload };
      delete body.type;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        if (isMessage) fetchMessages(currentUser);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = m.senderName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.messageText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout 
      roleTitle="PARENT PORTAL" 
      userName={currentUser?.name}
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={(tab) => window.location.href = `/parent/dashboard`}
    >
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MessageSquare size={28} className="text-primary" /> Communications
            </h1>
            <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>Message teachers or view school-wide announcements</p>
          </div>
          <button className="btn-primary" onClick={() => { setReplyData(undefined); setShowCompose(true); }}>Compose New</button>
        </div>

        <div className="glass-card" style={{ display: "flex", gap: "1rem", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <input 
            type="text" 
            placeholder="Search communications..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input" 
            style={{ flex: 1, margin: 0 }} 
          />
          <select 
            className="form-input" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "160px", margin: 0 }}
          >
            <option value="ALL">All Status</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Updating inbox...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "3rem" }}>No messages found.</div>
          ) : (
            filteredMessages.map(m => (
              <div 
                key={m.id} 
                className="glass-card" 
                style={{ 
                  borderLeft: m.status === 'Unread' ? "4px solid var(--primary)" : "4px solid transparent",
                  backgroundColor: m.status === 'Unread' ? "rgba(59,130,246,0.02)" : "var(--surface)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                   <div style={{ fontWeight: 600 }}>{m.title}</div>
                   <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{m.dateTime}</div>
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--primary)", fontWeight: 500 }}>{m.senderName}:</span> {m.messageText}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  {m.status === 'Unread' && (
                    <button onClick={() => markRead(m.id)} className="btn-ghost" style={{ fontSize: "0.8rem" }}>Mark Read</button>
                  )}
                  <button onClick={() => {
                    setReplyData({ type: 'message', audience: 'USER', detailTarget: m.senderName, title: `Re: ${m.title}` });
                    setShowCompose(true);
                  }} className="btn-ghost" style={{ fontSize: "0.8rem" }}>Reply</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ComposeMessageModal 
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleSendMessage}
        sender={{ id: currentUser?.id, name: currentUser?.name, role: currentUser?.role }}
        initialData={replyData}
      />
    </DashboardLayout>
  );
}
