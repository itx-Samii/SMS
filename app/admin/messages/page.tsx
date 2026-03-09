"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import { MessageSquare, LayoutDashboard, Presentation, BookOpen, Users, Shield, ClipboardList, Award, Bell, DollarSign, Search, Filter, Trash2, Check } from "lucide-react";
import ComposeMessageModal from "@/app/components/ComposeMessageModal";

interface Message {
  id: number;
  senderName: string;
  senderRole: string;
  messageText: string;
  dateTime: string;
  status: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCompose, setShowCompose] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fake active tab for layout since this is a dedicated page
  const [activeTab, setActiveTab] = useState("messages");

  const menuItems: MenuItem[] = [
    { id: "reports", label: "Dashboard", icon: LayoutDashboard },
    { id: "classes", label: "Classes & Students", icon: Presentation },
    { id: "teachers", label: "Teachers", icon: BookOpen },
    { id: "parents", label: "Parents", icon: Users },
    { id: "admins", label: "Admins", icon: Shield },
    { id: "attendance", label: "All Attendance", icon: ClipboardList },
    { id: "marks", label: "Marks Management", icon: Award },
    { id: "notices", label: "Announcements", icon: Bell },
    { id: "fees", label: "Fee Management", icon: DollarSign },
  ];

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages?receiverRole=ADMIN");
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
    if (userStr) setCurrentUser(JSON.parse(userStr));
    fetchMessages();
  }, []);

  const markRead = async (id: number) => {
    try {
      await fetch("/api/messages", { 
        method: "PATCH", 
        headers: {"Content-Type":"application/json"}, 
        body: JSON.stringify({id, status: 'Read'}) 
      });
      fetchMessages();
    } catch (err) {}
  };

  const deleteMessage = async (id: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
      fetchMessages();
    } catch (err) {}
  };

  const handleSendMessage = async (messageData: any) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...messageData,
          recipientId: "ALL"
        })
      });
      if (res.ok) {
        fetchMessages();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to send message");
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
      roleTitle="S-Manager Admin" 
      userName={currentUser?.name}
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={(tab) => window.location.href = `/admin/dashboard`} // Redirect back to dashboard for other tabs
    >
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MessageSquare size={28} className="text-primary" /> System Messages
            </h1>
            <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>View, manage, and reply to all system communications</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCompose(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MessageSquare size={18} /> Compose New
          </button>
        </div>

        <div className="glass-card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              placeholder="Search by sender or message text..." 
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
              <option value="ALL">All Status</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <MessageSquare size={48} style={{ opacity: 0.2 }} />
              <p>No messages found matching your criteria.</p>
            </div>
          ) : (
            filteredMessages.map(m => (
              <div 
                key={m.id} 
                className="glass-card transition-all hover:scale-[1.01]" 
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
                       <h3 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                         {m.senderName} 
                         {m.status === 'Unread' && <span className="badge badge-blue">New</span>}
                       </h3>
                       <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                         Role: <span style={{ color: "var(--text-main)" }}>{m.senderRole}</span> • Sent on: {m.dateTime}
                       </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                     {m.status === 'Unread' && (
                       <button onClick={() => markRead(m.id)} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--primary)", padding: "0.5rem 0.8rem" }}>
                         <Check size={16} /> Mark Read
                       </button>
                     )}
                     <button onClick={() => deleteMessage(m.id)} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--danger)", padding: "0.5rem 0.8rem" }}>
                       <Trash2 size={16} /> Delete
                     </button>
                  </div>
                </div>
                
                <div style={{ 
                  padding: "1rem", 
                  backgroundColor: "rgba(0,0,0,0.2)", 
                  borderRadius: "8px",
                  color: m.status === 'Unread' ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap"
                }}>
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
      />
    </DashboardLayout>
  );
}
