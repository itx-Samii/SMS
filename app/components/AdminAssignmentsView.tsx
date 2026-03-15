import React, { useState, useEffect } from 'react';
import { BookOpen, Search, CheckCircle, Clock } from 'lucide-react';

export default function AdminAssignmentsView() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assnRes, subRes, classRes, studentRes] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/submissions"),
        fetch("/api/admin/classes"),
        fetch("/api/admin/users?role=STUDENT")
      ]);

      if (assnRes.ok) setAssignments(await assnRes.json());
      if (subRes.ok) setSubmissions(await subRes.json());
      if (classRes.ok) setClassesData(await classRes.json());
      if (studentRes.ok) setStudents(await studentRes.json());
    } catch {
      console.error("Failed to fetch admin assignments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getClassName = (classId: string) => {
    return classesData.find(c => c.id.toString() === classId)?.name || "Unknown Class";
  };

  const getMetrics = (assignmentId: string, classId: string) => {
    // Total students in that class
    const totalStudents = students.filter(s => s.classId?.toString() === classId).length;
    // Submissions for this assignment
    const assignmentSubmissions = submissions.filter(s => s.AssignmentID === assignmentId);
    
    const graded = assignmentSubmissions.filter(s => s.Status === 'Graded').length;
    const submitted = assignmentSubmissions.filter(s => s.Status === 'Submitted').length;
    const reviewed = graded; 
    const pendingReview = submitted;
    
    const totalReturned = graded + submitted;
    const missing = Math.max(0, totalStudents - totalReturned);

    return { totalStudents, graded, submitted, pendingReview, missing, totalReturned };
  };

  const filtered = assignments.filter(a => {
    const matchesSearch = a.Title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.Subject?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    
    let matchesClass = true;
    if (filterClass) matchesClass = a.ClassID === filterClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="animate-fade-in" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BookOpen size={24} style={{ color: "var(--primary)" }} /> Global Assignments Monitor
        </h2>
        <button className="btn-secondary" onClick={fetchData}><Clock size={16} style={{marginRight: "6px"}}/> Refresh Data</button>
      </div>

      <div className="glass-card" style={{ padding: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search Title or Subject..." 
            className="form-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.5rem", margin: 0, height: "42px" }}
          />
        </div>
        
        <select 
          className="form-input" 
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          style={{ width: "200px", margin: 0, height: "42px" }}
        >
          <option value="">All Classes</option>
          {classesData.map(c => (
            <option key={c.id} value={c.id.toString()}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Assignment Detials</th>
              <th>Class</th>
              <th>Status</th>
              <th>Completion Rate</th>
              <th>Grading Progress</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>Loading system data...</td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>No assignments found matching criteria.</td></tr>
            ) : (
              filtered.map(a => {
                const metrics = getMetrics(a.AssignmentID, a.ClassID);
                const isPastDue = new Date(a.DueDate) < new Date();
                const completionPercentage = metrics.totalStudents > 0 ? Math.round((metrics.totalReturned / metrics.totalStudents) * 100) : 0;
                
                return (
                  <tr key={a.AssignmentID}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.Title}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        Subj: {a.Subject} | Due: {a.DueDate}
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{getClassName(a.ClassID)}</span></td>
                    <td>
                      <span className={`badge ${a.Status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                        {a.Status} {isPastDue && '(Past Due)'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "150px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                           <span style={{color: "var(--text-muted)"}}>Turned in: {metrics.totalReturned}/{metrics.totalStudents}</span>
                           <span style={{fontWeight: 600}}>{completionPercentage}%</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                           <div style={{ width: `${completionPercentage}%`, height: "100%", backgroundColor: completionPercentage > 80 ? "var(--success)" : completionPercentage > 40 ? "var(--warning)" : "var(--danger)", borderRadius: "3px" }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--success)" }}><CheckCircle size={14} /> {metrics.graded} Graded</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--warning)" }}><Clock size={14} /> {metrics.pendingReview} Pending</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
