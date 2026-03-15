"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Bell, MessageSquare, Menu, User, GraduationCap, Sun, Moon } from "lucide-react";
import MessageDropdown from "./MessageDropdown";
import NotificationDropdown from "./NotificationDropdown";
import ComposeMessageModal from "./ComposeMessageModal";

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
}

export default function DashboardLayout({
  roleTitle,
  userName,
  menuItems,
  activeTab,
  setActiveTab,
  children,
  modals
}: {
  roleTitle: string;
  userName?: string;
  menuItems: MenuItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  children: React.ReactNode;
  modals?: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("light-theme", savedTheme === "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("light-theme", newTheme === "light");
  };

  // Dropdown & Notification States
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [replyData, setReplyData] = useState<{audience?: string, detailTarget?: string, type?: 'message'|'notification', title?: string} | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<{id: number, name: string, role: string} | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const fetchMessagesAndNotifications = async () => {
    try {
       // Since Layout runs on all dashboards, we fetch globally and the APIs 
       // filter by 'ALL' or specific roles based on who is logged in (handled by API/URL params in real-world, simplifying here for demo)
       const userStr = localStorage.getItem("user");
       const user = userStr ? JSON.parse(userStr) : null;
       const q = user ? `?role=${user.role}&userId=${user.id}` : '';
       
       const [msgRes, notifRes] = await Promise.all([
         fetch(`/api/messages${q}`),
         fetch('/api/notifications')
       ]);
       
       if (msgRes.ok) setMessages(await msgRes.json());
       if (notifRes.ok) setNotifications(await notifRes.json());
    } catch (err) {
       console.error("Failed to fetch notification data");
    }
  };

  useEffect(() => {
    fetchMessagesAndNotifications();
    // Poll every 30s
    const interval = setInterval(fetchMessagesAndNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markMessageRead = async (id: number) => {
    try {
      await fetch("/api/messages", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({id, status: 'Read'}) });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'Read' } : m));
    } catch (err) {}
  };

  const deleteMessage = async (id: number) => {
    try {
      await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
      setMessages(prev => prev.filter(m => m.id !== id));
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
        if (isMessage) fetchMessagesAndNotifications();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to send", payload.type);
      return false;
    }
  };

  const markNotificationRead = async (id: number) => {
    try {
      await fetch("/api/notifications", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({id, status: 'Read'}) });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' } : n));
    } catch (err) {}
  };

  const deleteNotification = async (id: number) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {}
  };

  const unreadMessagesCount = messages.filter(m => m.status === 'Unread').length;
  const unreadNotificationsCount = notifications.filter(n => n.status === 'Unread').length;

  const currentTabLabel = menuItems.find(m => m.id === activeTab)?.label || "Dashboard";

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>
          <GraduationCap size={28} style={{ color: "var(--primary)" }} />
          {roleTitle}
        </h2>
        
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "1rem", overflowY: "auto", paddingRight: "4px" }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={20} />
                <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span style={{ 
                    backgroundColor: activeTab === item.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)", 
                    padding: "2px 8px", 
                    borderRadius: "99px", 
                    fontSize: "0.75rem", 
                    color: activeTab === item.id ? "#fff" : "var(--primary)" 
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
           <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
             <div className="avatar">
               {userName ? (
                 <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563eb&color=fff`} alt="user" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
               ) : (
                 <User size={20} color="var(--text-muted)" />
               )}
             </div>
             <div>
               <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", textTransform: "capitalize", maxWidth: "120px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                 {userName || "User"}
               </p>
             </div>
           </div>
           <button onClick={handleLogout} className="btn-ghost" style={{ padding: "0.5rem" }} title="Log out">
             <LogOut size={18} />
           </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="topbar">
           <div className="topbar-title">
             <Menu size={24} color="var(--text-muted)" style={{ cursor: "pointer", display: "none" }} className="mobile-menu-btn" />
             <span>{currentTabLabel}</span>
           </div>
           
           <div className="topbar-actions">
             <button onClick={toggleTheme} className="btn-ghost" style={{ padding: "0.5rem" }} title="Toggle Theme">
               {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             
             {/* Message Dropdown Trigger */}
             <div style={{ position: "relative" }}>
               <button 
                onClick={() => { setShowMessageDropdown(!showMessageDropdown); setShowNotificationDropdown(false); }}
                className="btn-ghost" 
                style={{ position: "relative", padding: "0.5rem" }}
               >
                 <MessageSquare size={20} />
                 {unreadMessagesCount > 0 && (
                   <span style={{ 
                     position: "absolute", top: 4, right: 4, minWidth: "16px", height: "16px", 
                     backgroundColor: "var(--primary)", color: "#fff", borderRadius: "50%",
                     fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center",
                     fontWeight: 700, border: "2px solid var(--bg-dark)"
                   }}>
                     {unreadMessagesCount}
                   </span>
                 )}
               </button>
               <MessageDropdown 
                 isOpen={showMessageDropdown} 
                 onClose={() => setShowMessageDropdown(false)}
                 messages={messages}
                  onMarkRead={markMessageRead}
                  userRole={currentUser?.role || ""}
                 onDelete={deleteMessage}
                 onReply={(m) => {
                   setReplyData({
                     type: 'message',
                     audience: 'USER',
                     detailTarget: m.senderName,
                     title: `Re: ${m.title}`
                   });
                   setShowMessageDropdown(false);
                   setShowComposeModal(true);
                 }}
               />
             </div>

             {/* Notification Dropdown Trigger */}
             <div style={{ position: "relative" }}>
               <button 
                onClick={() => { setShowNotificationDropdown(!showNotificationDropdown); setShowMessageDropdown(false); }}
                className="btn-ghost" 
                style={{ position: "relative", padding: "0.5rem" }}
               >
                 <Bell size={20} />
                 {unreadNotificationsCount > 0 && (
                   <span style={{ 
                     position: "absolute", top: 4, right: 4, minWidth: "16px", height: "16px", 
                     backgroundColor: "var(--danger)", color: "#fff", borderRadius: "50%",
                     fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center",
                     fontWeight: 700, border: "2px solid var(--bg-dark)"
                   }}>
                     {unreadNotificationsCount}
                   </span>
                 )}
               </button>
               <NotificationDropdown 
                 isOpen={showNotificationDropdown} 
                 onClose={() => setShowNotificationDropdown(false)}
                 notifications={notifications}
                 onMarkRead={markNotificationRead}
                 onDelete={deleteNotification}
               />
             </div>
           </div>
        </header>
        
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
      
      {/* Modals rendered here escape the stacking context of the animate-fade-in children */}
      {modals}
      
      <ComposeMessageModal 
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSend={handleSendMessage}
        sender={{ 
          id: currentUser?.id || 0, 
          name: currentUser?.name || 'System', 
          role: currentUser?.role || 'ADMIN' 
        }}
        initialData={replyData}
      />
    </div>
  );
}
