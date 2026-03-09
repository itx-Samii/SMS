"use client";

import { Bell, Check, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

interface Notification {
  id: number;
  title: string;
  description: string;
  dateTime: string;
  status: string;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function NotificationDropdown({ isOpen, onClose, notifications, onMarkRead, onDelete }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="dropdown-panel animate-scale-in"
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: '0',
        width: '350px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        zIndex: 100,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={18} className="text-primary" /> Notifications
        </h3>
        <span className="badge badge-red">{notifications.filter(n => n.status === 'Unread').length} New</span>
      </div>

      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p style={{ margin: 0 }}>No new notifications</p>
          </div>
        ) : (
          notifications.slice(0, 5).map(n => (
            <div 
              key={n.id} 
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border)',
                backgroundColor: n.status === 'Unread' ? 'rgba(239,68,68,0.05)' : 'transparent',
                display: 'flex',
                gap: '0.75rem',
                transition: 'background-color 0.2s',
              }}
              className="hover:bg-opacity-20 hover:bg-white/5"
            >
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "10px", 
                backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                <Bell size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: n.status === 'Unread' ? 'var(--text-main)' : 'var(--text-muted)' }}>{n.title}</span>
                 </div>
                 <p style={{ 
                   margin: 0, fontSize: '0.85rem', color: n.status === 'Unread' ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)',
                   lineHeight: 1.4
                 }}>
                   {n.description}
                 </p>
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      {n.dateTime}
                 </span>
                 
                 <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {n.status === 'Unread' && (
                      <button onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }} className="text-primary hover:text-white" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Check size={12} /> Mark Read
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDelete(n.id); }} className="text-danger hover:text-white" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Link 
        href="/admin/notifications" 
        onClick={onClose}
        style={{ 
          padding: '0.75rem', 
          textAlign: 'center', 
          backgroundColor: 'rgba(255,255,255,0.02)', 
          color: 'var(--danger)',
          fontSize: '0.85rem',
          fontWeight: 500,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          borderTop: '1px solid var(--border)',
          transition: 'background-color 0.2s'
        }}
        className="hover:bg-white/5"
      >
        View All Notifications <ArrowRight size={14} />
      </Link>
    </div>
  );
}
