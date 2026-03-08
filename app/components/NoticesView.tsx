"use client";

import { useState, useEffect } from "react";
import { Bell, Trash2, Plus } from "lucide-react";

interface Notice {
  id: number;
  title: string;
  content: string;
  targetAudience: string;
  createdAt: string;
}

export default function NoticesView({ role }: { role: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin Create States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("ALL");

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notices");
      if (res.ok) {
        let data = await res.json();
        // Filter out strict audiences (If not ALL, and not matching role, filter it)
        if (role !== "ADMIN") {
          data = data.filter((n: Notice) => n.targetAudience === "ALL" || n.targetAudience === role + "S");
        }
        setNotices(data);
      }
    } catch {
       console.error("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [role]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, targetAudience })
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setShowCreateForm(false);
        fetchNotices();
      }
    } catch {
      console.error("Failed to create notice");
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm("Delete this notice?")) return;
    try {
      const res = await fetch(`/api/notices?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchNotices();
      }
    } catch {
      console.error("Failed to delete notice");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", color: "var(--text-muted)", textAlign: "center" }}>Loading announcements...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {role === "ADMIN" && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
           <button 
             className="btn-primary" 
             onClick={() => setShowCreateForm(!showCreateForm)}
             style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
           >
             {showCreateForm ? "Cancel" : <><Plus size={18} /> Publish Notice</>}
           </button>
        </div>
      )}

      {showCreateForm && role === "ADMIN" && (
        <div className="glass-card animate-fade-in" style={{ backgroundColor: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)" }}>
           <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)" }}><Bell size={20} /> New School Announcement</h3>
           <form onSubmit={handleCreateNotice} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
             <div>
               <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Title</label>
               <input required placeholder="e.g. Quarter Exams Schedule" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "0.75rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-main)" }} />
             </div>
             <div>
               <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Audience</label>
               <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)} style={{ width: "100%", padding: "0.75rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-main)" }}>
                 <option value="ALL">Everyone</option>
                 <option value="STUDENTS">Students Only</option>
                 <option value="TEACHERS">Teachers Only</option>
                 <option value="PARENTS">Parents Only</option>
               </select>
             </div>
             <div>
               <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Message Content</label>
               <textarea required placeholder="Write the details of the announcement..." value={content} onChange={e => setContent(e.target.value)} style={{ width: "100%", padding: "0.75rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-main)", minHeight: "120px", resize: "vertical" }} />
             </div>
             <button type="submit" className="btn-primary" style={{ alignSelf: "flex-end" }}>Post Announcement</button>
           </form>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {notices.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Bell size={48} style={{ opacity: 0.2 }} />
            <p>No notices available right now.</p>
          </div>
        ) : (
          notices.map(n => (
            <div key={n.id} className="glass-card transition-all hover:scale-[1.01]" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                   <div style={{ padding: "0.5rem", backgroundColor: "rgba(59,130,246,0.1)", borderRadius: "8px", color: "var(--primary)" }}>
                     <Bell size={20} />
                   </div>
                   <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>{n.title}</h3>
                 </div>
                 {role === "ADMIN" && (
                   <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span className="badge badge-blue">{n.targetAudience}</span>
                      <button onClick={() => handleDeleteNotice(n.id)} className="btn-ghost" style={{ padding: "0.5rem", color: "var(--danger)" }}>
                        <Trash2 size={18} />
                      </button>
                   </div>
                 )}
               </div>
               
               <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.6, padding: "0.5rem 0", whiteSpace: "pre-wrap" }}>
                 {n.content}
               </p>
               
               <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                 Posted on {new Date(n.createdAt).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
               </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
