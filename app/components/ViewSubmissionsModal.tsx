import React, { useState, useEffect } from 'react';
import { Save, Eye, CheckCircle, Clock } from 'lucide-react';
import Modal from './Modal';

export default function ViewSubmissionsModal({ 
  isOpen, 
  onClose, 
  assignmentId,
  assignmentTitle,
  classId
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  assignmentId: string,
  assignmentTitle: string,
  classId: string
}) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !assignmentId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [subRes, stuRes] = await Promise.all([
          fetch(`/api/submissions?assignmentId=${assignmentId}`),
          fetch(`/api/admin/users?role=STUDENT`)
        ]);

        if (subRes.ok && stuRes.ok) {
          const subData = await subRes.json();
          const stuData = await stuRes.json();
          
          setSubmissions(subData);
          setStudents(stuData.filter((s: any) => s.classId === classId));
          
          const initialUpdates: Record<string, string> = {};
          subData.forEach((sub: any) => {
            initialUpdates[sub.SubmissionID] = sub.Status;
          });
          setStatusUpdates(initialUpdates);
        }
      } catch (err) {
        console.error("Failed to fetch submissions data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, assignmentId, classId]);

  const handleSaveStatuses = async () => {
    setIsSaving(true);
    try {
      const updatePromises = Object.entries(statusUpdates).map(([subId, newStatus]) => {
        const original = submissions.find(s => s.SubmissionID === subId);
        if (original && original.Status !== newStatus) {
           return fetch("/api/submissions", {
             method: "PATCH",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ id: subId, status: newStatus })
           });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      alert("Statuses updated successfully!");
      onClose();
    } catch {
      alert("Error saving statuses.");
    } finally {
      setIsSaving(false);
    }
  };

  const displayList = students.map(student => {
    const sub = submissions.find(s => s.StudentID === student.id.toString());
    return {
      student,
      submission: sub || null
    };
  });

  const footer = (
    <>
      <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
        Close
      </button>
      <button type="button" className="btn-primary" disabled={isSaving || submissions.length === 0} onClick={handleSaveStatuses} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Save size={18} /> {isSaving ? "Saving..." : "Save Marking Status"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Submissions"
      subtitle={`Assignment: ${assignmentTitle}`}
      icon={<Eye size={20} />}
      footer={footer}
      maxWidth="900px"
    >
      <div className="grid-metrics" style={{ marginBottom: "1.5rem" }}>
        <div className="glass-card" style={{ padding: "1rem" }}>
          <h4 style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Total Students</h4>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{students.length}</div>
        </div>
        <div className="glass-card" style={{ padding: "1rem" }}>
           <h4 style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Submitted</h4>
           <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--success)" }}>{submissions.length}</div>
        </div>
        <div className="glass-card" style={{ padding: "1rem" }}>
           <h4 style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Pending</h4>
           <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--warning)" }}>{students.length - submissions.length}</div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student (Roll #)</th>
              <th>Submission Date</th>
              <th>Text / Attachment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>Loading submissions...</td></tr>
            ) : displayList.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>No students found in this class.</td></tr>
            ) : (
              displayList.map(({ student, submission }) => (
                <tr key={student.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Roll #{student.rollNumber || 'N/A'}</div>
                  </td>
                  <td>
                    {submission ? (
                       <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                         {new Date(submission.SubmittedDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                       </span>
                    ) : (
                       <span className="badge badge-warning"><Clock size={12} /> Pending</span>
                    )}
                  </td>
                  <td style={{ maxWidth: "250px" }}>
                    {submission ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {submission.SubmissionText && (
                          <div style={{ fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={submission.SubmissionText}>
                            "{submission.SubmissionText}"
                          </div>
                        )}
                        {submission.Attachment ? (
                          <a href={submission.Attachment} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", fontSize: "0.85rem", textDecoration: "underline" }}>
                            View Attachment
                          </a>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No Link Provided</span>
                        )}
                      </div>
                    ) : (
                       <span style={{ fontSize: "0.85rem", color: "var(--border)" }}>-</span>
                    )}
                  </td>
                  <td>
                    {submission ? (
                      <select 
                        className="form-input" 
                        value={statusUpdates[submission.SubmissionID] || submission.Status}
                        onChange={(e) => setStatusUpdates({...statusUpdates, [submission.SubmissionID]: e.target.value})}
                        style={{ padding: "0.4rem", margin: 0, width: "130px", fontSize: "0.85rem", 
                          borderColor: statusUpdates[submission.SubmissionID] === 'Graded' ? 'var(--success)' : 
                                       statusUpdates[submission.SubmissionID] === 'Rejected' ? 'var(--danger)' : 'var(--border)'
                        }}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Graded">Graded (Pass)</option>
                        <option value="Rejected">Resubmit (Fail)</option>
                      </select>
                    ) : (
                       <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Awaiting Submission</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
