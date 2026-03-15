"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import { MessageSquare, LayoutDashboard, CalendarCheck, BookOpen, Clock, Award, Bell, DollarSign, Search, Filter, Trash2, Check, Printer } from "lucide-react";
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

export default function TeacherMessagesPage() {
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
    { id: "assignments", label: "Assignments", icon: BookOpen },
    { id: "marks", label: "Marks Management", icon: Award },
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

  const deleteMessage = async (id: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
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
      roleTitle="TEACHER PORTAL" 
      userName={currentUser?.name}
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={(tab) => window.location.href = `/teacher/dashboard`}
    >
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MessageSquare size={28} className="text-primary" /> My Inbox
            </h1>
            <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>Communicate with students, parents, and administrative staff</p>
          </div>
          <button className="btn-primary" onClick={() => { setReplyData(undefined); setShowCompose(true); }} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MessageSquare size={18} /> Compose
          </button>
        </div>

        <div className="glass-card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input" 
              style={{ paddingLeft: "2.5rem", width: "100%", margin: 0 }} 
            />
          </div>
          <div style={{ position: "relative" }}>
            <Filter size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <select 
              className="form-input" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ paddingLeft: "2.5rem", width: "180px", margin: 0, cursor: "pointer" }}
            >
              <option value="ALL">All Messages</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading your messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <MessageSquare size={48} style={{ opacity: 0.2 }} />
              <p>Your inbox is empty.</p>
            </div>
          ) : (
            filteredMessages.map(m => (
              <div 
                key={m.id} 
                className="glass-card transition-all" 
                style={{ 
                  display: "flex", flexDirection: "column", gap: "1rem",
                  borderLeft: m.status === 'Unread' ? "4px solid var(--primary)" : "4px solid transparent",
                  backgroundColor: m.status === 'Unread' ? "rgba(59,130,246,0.02)" : "var(--surface)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ 
                      width: "48px", height: "48px", borderRadius: "12px", 
                      backgroundColor: "rgba(59,130,246,0.1)", color: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "bold", fontSize: "1.2rem", flexShrink: 0
                    }}>
                      {m.senderName.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                       <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{m.title}</h3>
                       <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "var(--text-main)" }}>
                         {m.senderName} <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>({m.senderRole})</span>
                       </p>
                       <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.80rem", color: "var(--text-muted)" }}>{m.dateTime}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                     {m.status === 'Unread' && (
                       <button onClick={() => markRead(m.id)} className="btn-ghost" style={{ color: "var(--primary)" }}>Mark Read</button>
                     )}
                     <button onClick={() => deleteMessage(m.id)} className="btn-ghost" style={{ color: "var(--danger)" }}>Delete</button>
                     <button onClick={() => {
                        setReplyData({ type: 'message', audience: 'USER', detailTarget: m.senderName, title: `Re: ${m.title}` });
                        setShowCompose(true);
                     }} className="btn-ghost">Reply</button>
                  </div>
                </div>
                <div style={{ padding: "1rem", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "8px", color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap" }}>
                  {m.messageText}
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
