import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Edit, Trash2, Eye } from 'lucide-react';
import AssignmentModal from './AssignmentModal';
import ViewSubmissionsModal from './ViewSubmissionsModal';

export default function TeacherAssignmentsView({ user, subjects }: { user: any, subjects: any[] }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState<any>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assignments?teacherId=${user.id}`);
      if (res.ok) {
        setAssignments(await res.json());
      }
    } catch {
      console.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAssignments();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment? This will also remove student submissions.')) return;
    try {
      const res = await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchAssignments();
    } catch {
      console.error("Failed to delete assignment");
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.Title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesSubject = filterSubject ? a.Subject === filterSubject : true;
    const matchesStatus = filterStatus ? a.Status === filterStatus : true;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  return (
    <>
      <div className="animate-fade-in" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BookOpen size={24} style={{ color: "var(--primary)" }} /> Manage Assignments
        </h2>
        <button 
          className="btn-primary" 
          onClick={() => { setEditingAssignment(null); setIsModalOpen(true); }} 
          style={{ borderRadius: "8px" }}
        >
          <Plus size={18} /> Create New Assignment
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search by Title..." 
            className="form-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.5rem", margin: 0, height: "42px" }}
          />
        </div>
        
        <select 
          className="form-input" 
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          style={{ width: "200px", margin: 0, height: "42px" }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>

        <select 
          className="form-input" 
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ width: "160px", margin: 0, height: "42px" }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Assignment Title</th>
              <th>Subject</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Loading assignments...</td></tr>
            ) : filteredAssignments.length === 0 ? (
               <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>No assignments found matching criteria.</td></tr>
            ) : (
              filteredAssignments.map(a => (
                <tr key={a.AssignmentID}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>#{a.AssignmentID}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.Title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Class {a.ClassID} / Sec {a.SectionID}</div>
                  </td>
                  <td>{a.Subject}</td>
                  <td>
                    <span style={{ color: (new Date(a.DueDate) < new Date() && a.Status !== 'Closed') ? "var(--danger)" : "inherit" }}>
                      {a.DueDate}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${a.Priority === 'Urgent' ? 'badge-danger' : a.Priority === 'Important' ? 'badge-warning' : 'badge-blue'}`}>
                      {a.Priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${a.Status === 'Active' ? 'badge-success' : a.Status === 'Closed' ? 'badge-danger' : 'badge-warning'}`}>
                      {a.Status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                       <button title="View Submissions" className="btn-secondary" style={{ padding: "0.4rem", borderRadius: "6px" }} onClick={() => setViewingSubmissionsFor(a)}>
                         <Eye size={16} />
                       </button>
                       <button title="Edit Assignment" className="btn-secondary" style={{ padding: "0.4rem", borderRadius: "6px" }} onClick={() => { setEditingAssignment(a); setIsModalOpen(true); }}>
                         <Edit size={16} />
                       </button>
                       <button title="Delete Assignment" className="btn-secondary" style={{ padding: "0.4rem", borderRadius: "6px", color: "var(--danger)" }} onClick={() => handleDelete(a.AssignmentID)}>
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      <AssignmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
        subjects={subjects} 
        existingAssignment={editingAssignment} 
        onSaveSuccess={() => {
          setIsModalOpen(false);
          fetchAssignments();
        }}
      />

      <ViewSubmissionsModal 
        isOpen={!!viewingSubmissionsFor} 
        onClose={() => setViewingSubmissionsFor(null)} 
        assignmentId={viewingSubmissionsFor?.AssignmentID} 
        assignmentTitle={viewingSubmissionsFor?.Title} 
        classId={viewingSubmissionsFor?.ClassID} 
      />
    </>
  );
}
