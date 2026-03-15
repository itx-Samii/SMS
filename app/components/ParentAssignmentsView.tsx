import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Clock, CheckCircle, Eye, AlertCircle } from 'lucide-react';

export default function ParentAssignmentsView({ childId, classId }: { childId: string, classId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!classId || !childId) return;

      const [assnRes, subRes] = await Promise.all([
        fetch(`/api/assignments?classId=${classId}`),
        fetch(`/api/submissions?studentId=${childId}`)
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
    if (childId && classId) fetchData();
  }, [childId, classId]);

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
    <div className="animate-fade-in" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BookOpen size={24} style={{ color: "var(--primary)" }} /> Child's Assignments
        </h2>
      </div>

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
          <option value="Pending">Pending Tasks</option>
          <option value="Submitted">Submitted / Graded</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Assignment Title</th>
              <th>Subject</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Child's Status</th>
              <th>Teacher Feedback</th>
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
                       <span className="badge badge-danger"><AlertCircle size={12} style={{marginRight: "4px"}} /> Rejected</span>
                    )}
                  </td>
                  <td>
                    {a.submissionData && a.submissionStatus === 'Graded' ? (
                       <span style={{ fontSize: "0.85rem", color: "var(--success)" }}>Passed & Accepted</span>
                    ) : a.submissionData && a.submissionStatus === 'Rejected' ? (
                       <span style={{ fontSize: "0.85rem", color: "var(--danger)" }}>Teacher requested resubmission</span>
                    ) : (
                       <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
