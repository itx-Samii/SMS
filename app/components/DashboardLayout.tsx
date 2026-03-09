"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Bell, MessageSquare, Menu, User, GraduationCap, Sun, Moon } from "lucide-react";

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
  modals,
  onMessageClick,
  onNotificationClick,
  unreadMessages = 0,
  unreadNotifications = 0
}: {
  roleTitle: string;
  userName?: string;
  menuItems: MenuItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  children: React.ReactNode;
  modals?: React.ReactNode;
  onMessageClick?: () => void;
  onNotificationClick?: () => void;
  unreadMessages?: number;
  unreadNotifications?: number;
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

  const currentTabLabel = menuItems.find(m => m.id === activeTab)?.label || "Dashboard";

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>
          <GraduationCap size={28} style={{ color: "var(--primary)" }} />
          {roleTitle}
        </h2>
        
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "1rem" }}>
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
             <button 
              onClick={onMessageClick}
              className="btn-ghost" 
              style={{ position: "relative", padding: "0.5rem" }}
             >
               <MessageSquare size={20} />
               {unreadMessages > 0 && (
                 <span style={{ 
                   position: "absolute", 
                   top: 4, 
                   right: 4, 
                   minWidth: "16px", 
                   height: "16px", 
                   backgroundColor: "var(--primary)", 
                   color: "#fff",
                   borderRadius: "50%",
                   fontSize: "0.65rem",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   fontWeight: 700,
                   border: "2px solid var(--bg-dark)"
                 }}>
                   {unreadMessages}
                 </span>
               )}
             </button>
             <button 
              onClick={onNotificationClick}
              className="btn-ghost" 
              style={{ position: "relative", padding: "0.5rem" }}
             >
               <Bell size={20} />
               {unreadNotifications > 0 && (
                 <span style={{ 
                   position: "absolute", 
                   top: 4, 
                   right: 4, 
                   width: "10px", 
                   height: "10px", 
                   backgroundColor: "var(--danger)", 
                   borderRadius: "50%",
                   border: "2px solid var(--bg-dark)"
                 }}></span>
               )}
             </button>
           </div>
        </header>
        
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
      
      {/* Modals rendered here escape the stacking context of the animate-fade-in children */}
      {modals}
    </div>
  );
}
