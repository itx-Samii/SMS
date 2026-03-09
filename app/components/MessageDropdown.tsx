"use client";

import { MessageSquare, Check, X, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

interface Message {
  id: number;
  senderName: string;
  senderRole: string;
  messageText: string;
  dateTime: string;
  status: string;
}

interface MessageDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function MessageDropdown({ isOpen, onClose, messages, onMarkRead, onDelete }: MessageDropdownProps) {
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

  const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "AA";

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
          <MessageSquare size={18} className="text-primary" /> Messages
        </h3>
        <span className="badge badge-blue">{messages.filter(m => m.status === 'Unread').length} New</span>
      </div>

      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p style={{ margin: 0 }}>No new messages</p>
          </div>
        ) : (
          messages.slice(0, 5).map(m => ( // Show only top 5 recent
            <div 
              key={m.id} 
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border)',
                backgroundColor: m.status === 'Unread' ? 'rgba(59,130,246,0.05)' : 'transparent',
                display: 'flex',
                gap: '0.75rem',
                transition: 'background-color 0.2s',
                position: 'relative'
              }}
              className="group hover:bg-opacity-20 hover:bg-white/5"
            >
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "10px", 
                backgroundColor: "rgba(59,130,246,0.1)", color: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "bold", fontSize: "0.85rem", flexShrink: 0
              }}>
                {getInitials(m.senderName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <span style={{ fontWeight: 600, fontSize: '0.9rem', color: m.status === 'Unread' ? 'var(--text-main)' : 'var(--text-muted)' }}>{m.senderName}</span>
                       <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}>{m.senderRole}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {m.dateTime.split(' ')[1]} {/* Show only time if today, complex logic omitted for brevity */}
                    </span>
                 </div>
                 <p style={{ 
                   margin: 0, fontSize: '0.85rem', color: m.status === 'Unread' ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)',
                   whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                 }}>
                   {m.messageText}
                 </p>
                 
                 {/* Hover actions */}
                 <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {m.status === 'Unread' && (
                      <button onClick={(e) => { e.stopPropagation(); onMarkRead(m.id); }} className="text-primary hover:text-white" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Check size={12} /> Mark Read
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDelete(m.id); }} className="text-danger hover:text-white" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Link 
        href="/admin/messages" 
        onClick={onClose}
        style={{ 
          padding: '0.75rem', 
          textAlign: 'center', 
          backgroundColor: 'rgba(255,255,255,0.02)', 
          color: 'var(--primary)',
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
        View All Messages <ArrowRight size={14} />
      </Link>
    </div>
  );
}
