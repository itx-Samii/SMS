"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import { MessageSquare, LayoutDashboard, CalendarCheck, BookOpen, Clock, Award, Bell, DollarSign, Search, Filter, Trash2, Check } from "lucide-react";

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

export default function StudentMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  const filteredMessages = messages.filter(m => {
    const matchesSearch = m.senderName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.messageText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout 
      roleTitle="STUDENT PORTAL" 
      userName={currentUser?.name}
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={(tab) => window.location.href = `/student/dashboard`}
    >
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MessageSquare size={28} className="text-primary" /> Messages
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>Check notifications from your teachers and the school admin</p>
        </div>

        <div className="glass-card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input" 
              style={{ paddingLeft: "2.5rem", width: "100%", margin: 0 }} 
            />
          </div>
          <select 
            className="form-input" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "180px", margin: 0 }}
          >
            <option value="ALL">All Status</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
              No messages found.
            </div>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "rgba(59,130,246,0.1)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      {m.senderName.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{m.title}</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-main)" }}>From: {m.senderName} ({m.senderRole})</p>
                    </div>
                  </div>
                  {m.status === 'Unread' && (
                    <button onClick={() => markRead(m.id)} className="btn-ghost" style={{ fontSize: "0.8rem", color: "var(--primary)" }}>Mark Read</button>
                  )}
                </div>
                <div style={{ padding: "0.75rem", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "6px", fontSize: "0.95rem", color: "var(--text-main)" }}>
                  {m.messageText}
                </div>
                <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.dateTime}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
