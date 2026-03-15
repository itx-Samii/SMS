"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import { Bell, LayoutDashboard, Presentation, BookOpen, Users, Shield, ClipboardList, Award, DollarSign, Search, Filter, Trash2, Check } from "lucide-react";

interface Notification {
  id: number;
  senderName: string;
  audience: string;
  title: string;
  description: string;
  dateTime: string;
  priority: string;
  status: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fake active tab for layout since this is a dedicated page
  const [activeTab, setActiveTab] = useState("notifications");

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

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setCurrentUser(JSON.parse(userStr));
    fetchNotifications();
  }, []);

  const markRead = async (id: number) => {
    try {
      await fetch("/api/notifications", { 
        method: "PATCH", 
        headers: {"Content-Type":"application/json"}, 
        body: JSON.stringify({id, status: 'Read'}) 
      });
      fetchNotifications();
    } catch (err) {}
  };

  const deleteNotification = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      fetchNotifications();
    } catch (err) {}
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || n.status === statusFilter;
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
              <Bell size={28} className="text-danger" /> System Notifications
            </h1>
            <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>Manage automated alerts and system-wide announcements</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              placeholder="Search by title or description..." 
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
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <Bell size={48} style={{ opacity: 0.2 }} />
              <p>No notifications found matching your criteria.</p>
            </div>
          ) : (
            filteredNotifications.map(n => (
              <div 
                key={n.id} 
                className="glass-card transition-all hover:scale-[1.01]" 
                style={{ 
                  display: "flex", flexDirection: "column", gap: "1rem",
                  borderLeft: n.status === 'Unread' ? "4px solid var(--danger)" : "4px solid transparent",
                  backgroundColor: n.status === 'Unread' ? "rgba(239,68,68,0.02)" : "var(--surface)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ 
                      width: "48px", height: "48px", borderRadius: "12px", 
                      backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <Bell size={24} />
                    </div>
                    <div>
                       <h3 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                         {n.title} 
                         {n.status === 'Unread' && <span className="badge badge-red">New</span>}
                         {n.priority === 'Urgent' && <span className="badge badge-danger">Urgent</span>}
                       </h3>
                       <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "var(--text-main)" }}>
                         From: {n.senderName}
                       </p>
                       <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.80rem", color: "var(--text-muted)" }}>
                         To: {n.audience} • Date: {n.dateTime}
                       </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                     {n.status === 'Unread' && (
                       <button onClick={() => markRead(n.id)} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--primary)", padding: "0.5rem 0.8rem" }}>
                         <Check size={16} /> Mark Read
                       </button>
                     )}
                     <button onClick={() => deleteNotification(n.id)} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--danger)", padding: "0.5rem 0.8rem" }}>
                       <Trash2 size={16} /> Delete
                     </button>
                  </div>
                </div>
                
                <div style={{ 
                  padding: "1rem", 
                  backgroundColor: "rgba(0,0,0,0.2)", 
                  borderRadius: "8px",
                  color: n.status === 'Unread' ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap"
                }}>
                  {n.description}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
