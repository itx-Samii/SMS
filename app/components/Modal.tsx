"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "700px",
  onSubmit
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const content = (
    <>
      {/* HEADER */}
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", backgroundColor: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {icon && (
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
              {icon}
            </div>
          )}
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-main)" }}>{title}</h3>
            {subtitle && (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: "0.5rem" }}>
          <X size={20} />
        </button>
      </div>

      {/* BODY */}
      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto", flex: 1 }}>
        {children}
      </div>

      {/* FOOTER */}
      {footer && (
        <div style={{ padding: "1.25rem 1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
          {footer}
        </div>
      )}
    </>
  );

  const modalContainer = (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 999999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
    >
      {onSubmit ? (
        <form 
          className="modal-content animate-scale-in" 
          onSubmit={onSubmit}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            maxWidth, width: "100%", margin: "auto", 
            background: "var(--surface)", borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255,255,255,0.05)",
            display: "flex", flexDirection: "column",
            maxHeight: "90vh", overflow: "hidden"
          }}
        >
          {content}
        </form>
      ) : (
        <div 
          className="modal-content animate-scale-in" 
          onClick={(e) => e.stopPropagation()}
          style={{ 
            maxWidth, width: "100%", margin: "auto", 
            background: "var(--surface)", borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255,255,255,0.05)",
            display: "flex", flexDirection: "column",
            maxHeight: "90vh", overflow: "hidden"
          }}
        >
          {content}
        </div>
      )}
    </div>
  );

  return createPortal(modalContainer, document.body);
}
