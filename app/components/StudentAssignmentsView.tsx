import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Eye, UploadCloud, Clock, CheckCircle } from 'lucide-react';
import SubmitAssignmentModal from './SubmitAssignmentModal';

export default function StudentAssignmentsView({ user }: { user: any }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [answeringAssignment, setAnsweringAssignment] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user?.classId) return;

      const [assnRes, subRes] = await Promise.all([
        fetch(`/api/assignments?classId=${user.classId}`),
        fetch(`/api/submissions?studentId=${user.id}`)
      ]);

      if (assnRes.ok && subRes.ok) {
        setAssignments(await assnRes.json());
        setSubmissions(await subRes.json());
      }
    } catch {
      console.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  // Combine data
  const mergedList = assignments.map(a => {
    const sub = submissions.find(s => s.AssignmentID === a.AssignmentID);
    return {
       ...a,
       submissionStatus: sub ? sub.Status : 'Pending',
       submissionData: sub || null
    };
  });

  const filtered = mergedList.filter(a => {
    const matchesSearch = a.Title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    
    let matchesStatus = true;
    if (filterStatus === "Pending") matchesStatus = a.submissionStatus === "Pending";
    if (filterStatus === "Submitted") matchesStatus = ["Submitted", "Graded"].includes(a.submissionStatus);
    if (filterStatus === "Rejected") matchesStatus = a.submissionStatus === "Rejected";

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="animate-fade-in" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BookOpen size={24} style={{ color: "var(--primary)" }} /> My Assignments
        </h2>
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
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ width: "200px", margin: 0, height: "42px" }}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending (Not Submitted)</option>
          <option value="Submitted">Submitted / Graded</option>
          <option value="Rejected">Rejected (Resubmit)</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Assignment Title</th>
              <th>Subject</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>My Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>Loading assignments...</td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>No assignments found matching criteria.</td></tr>
            ) : (
              filtered.map(a => (
                <tr key={a.AssignmentID}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.Title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.Description}>
                      {a.Description}
                    </div>
                  </td>
                  <td>{a.Subject}</td>
                  <td>
                    <span style={{ color: (new Date(a.DueDate) < new Date() && a.submissionStatus === 'Pending') ? "var(--danger)" : "inherit" }}>
                      {a.DueDate}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${a.Priority === 'Urgent' ? 'badge-danger' : a.Priority === 'Important' ? 'badge-warning' : 'badge-blue'}`}>
                      {a.Priority}
                    </span>
                  </td>
                  <td>
                    {a.submissionStatus === 'Pending' ? (
                       <span className="badge badge-warning"><Clock size={12} style={{marginRight: "4px"}} /> Pending</span>
                    ) : a.submissionStatus === 'Submitted' ? (
                       <span className="badge badge-blue"><Eye size={12} style={{marginRight: "4px"}} /> In Review</span>
                    ) : a.submissionStatus === 'Graded' ? (
                       <span className="badge badge-success"><CheckCircle size={12} style={{marginRight: "4px"}} /> Graded</span>
                    ) : (
                       <span className="badge badge-danger">Rejected (Resubmit)</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                       {a.submissionStatus === 'Pending' || a.submissionStatus === 'Rejected' ? (
                         <button className="btn-primary" style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={() => setAnsweringAssignment(a)}>
                           <UploadCloud size={14} /> Submit Work
                         </button>
                       ) : (
                         <button className="btn-secondary" style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.85rem" }} onClick={() => setAnsweringAssignment(a)}>
                           View My Submission
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      <SubmitAssignmentModal 
        isOpen={!!answeringAssignment} 
        onClose={() => setAnsweringAssignment(null)} 
        user={user} 
        assignment={answeringAssignment} 
        onSaveSuccess={() => {
          setAnsweringAssignment(null);
          fetchData();
        }}
      />
    </>
  );
}
