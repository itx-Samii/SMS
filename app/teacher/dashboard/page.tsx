"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import MetricCard from "@/app/components/MetricCard";
import NoticesView from "@/app/components/NoticesView";
import TeacherAssignmentsView from "@/app/components/TeacherAssignmentsView";
import { Users, ClipboardCheck, Award, BookOpen, MessageSquare, LayoutDashboard, CheckCircle, Bell, Book, Clock, BarChart3, Trophy } from "lucide-react";
import ClassPerformanceAnalytics from "@/app/components/ClassPerformanceAnalytics";
import MeritList from "@/app/components/MeritList";
import { exportToCSV } from "@/lib/exportUtils";
import { User as UserIcon } from "lucide-react";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split("T")[0]);
  const [bulkAttendance, setBulkAttendance] = useState<Record<number, string>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [assessmentType, setAssessmentType] = useState("Quiz");
  const [remarks, setRemarks] = useState("");
  const [obtained, setObtained] = useState("");
  const [total, setTotal] = useState("100");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Assignment states
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDesc, setAssignmentDesc] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("");
  const [assignmentSubject, setAssignmentSubject] = useState("");

  // Subject Management
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [message, setMessage] = useState("");
  const [timetable, setTimetable] = useState<any[]>([]);
  const [classPerformance, setClassPerformance] = useState<any>(null);

  // Messaging States
  const [parents, setParents] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "attendance", label: "Mark Attendance", icon: ClipboardCheck },
    { id: "performance", label: "Class Performance", icon: BarChart3 },
    { id: "subjects", label: "Manage Subjects", icon: Book },
    { id: "results", label: "Exam Results", icon: Award },
    { id: "assignments", label: "Assignments", icon: BookOpen, badge: assignments.length },
    { id: "ranking", label: "Class Ranking", icon: Trophy },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: parents.length },
    { id: "notices", label: "Announcements", icon: Bell },
    { id: "timetable", label: "My Schedule", icon: Clock },
    { id: "my-profile", label: "My Profile", icon: UserIcon },
  ];

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/");
      return;
    }
    const u = JSON.parse(userStr);
    if (u.role !== "TEACHER") {
      router.push("/");
      return;
    }
    setUser(u);

    const fetchInitialData = async () => {
      try {
        const [usersRes, classesRes] = await Promise.all([
          fetch("/api/admin/users?role=STUDENT"),
          fetch("/api/admin/classes")
        ]);
        
        if (usersRes.ok) {
          const data = await usersRes.json();
          if (u.assignedClassId) {
             setStudents(data.filter((s: any) => s.classId === u.assignedClassId));
          } else {
             setStudents(data);
          }
        }
        
        if (classesRes.ok) {
          setClasses(await classesRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch initial data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [router]);
  useEffect(() => {
    if (user?.id) {
       fetchAssignments();
       fetchParents();
       fetchMarks();
       fetchAttendanceRecords();
       if (user.assignedClassId) {
         fetchSubjects();
         fetchClassPerformance(user.assignedClassId);
       }
       fetchTimetable();
    }
  }, [user, historyDate, activeTab]);

  const fetchClassPerformance = async (classId: any) => {
    try {
      const res = await fetch(`/api/analytics/class?classId=${classId}`);
      if (res.ok) setClassPerformance(await res.json());
    } catch { console.error("Failed to fetch class performance"); }
  };

  const fetchTimetable = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/timetable?teacherId=${user.id}`);
      if (res.ok) setTimetable(await res.json());
    } catch { console.error("Failed to fetch timetable"); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`/api/teacher/subjects?classId=${user.assignedClassId}`);
      if (res.ok) setSubjects(await res.json());
    } catch {
      console.error("Failed to fetch subjects");
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      const res = await fetch("/api/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: user.assignedClassId, name: newSubjectName })
      });
      if (res.ok) {
        setNewSubjectName("");
        fetchSubjects();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to add subject");
      }
    } catch {
      alert("Error adding subject");
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Delete this subject? This won't delete past marks but will remove it from new entries.")) return;
    try {
      const res = await fetch(`/api/teacher/subjects?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchSubjects();
    } catch {
      alert("Error deleting subject");
    }
  };

  useEffect(() => {
    if (selectedParentId && user?.id) {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedParentId, user]);

  const fetchMarks = async () => {
    try {
      const res = await fetch(`/api/teacher/marks?teacherId=${user?.id}`);
      if (res.ok) {
        setMarks(await res.json());
      }
    } catch {
      console.error("Failed to fetch marks");
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const res = await fetch(`/api/teacher/attendance?classId=${user?.assignedClassId}&date=${historyDate}`);
      if (res.ok) {
        setAttendanceRecords(await res.json());
      }
    } catch {
      console.error("Failed to fetch attendance");
    }
  };

  // Pre-populate bulk attendance with 'P' when students load or date changes
  useEffect(() => {
    const initial: Record<number, string> = {};
    students.forEach(s => {
      initial[s.id] = "P";
    });
    setBulkAttendance(initial);
  }, [students, attendanceDate]);

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`/api/assignments?teacherId=${user?.id}`);
      if (res.ok) {
        setAssignments(await res.json());
      }
    } catch {
      console.error("Failed to fetch assignments");
    }
  };

  const fetchParents = async () => {
    try {
      const res = await fetch(`/api/teacher/parents?teacherId=${user?.id}`);
      if (res.ok) {
        setParents(await res.json());
      }
    } catch {
       console.error("Failed to fetch parents.");
    }
  };

  const fetchChatMessages = async () => {
    if (!selectedParentId) return;
    try {
      const res = await fetch(`/api/messages?userId=${user.id}&otherUserId=${selectedParentId}`);
      if (res.ok) {
        setChatMessages(await res.json());
      }
    } catch {
       console.error("Failed to fetch messages.");
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !selectedParentId) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedParentId,
          content: newChatMessage
        })
      });
      if (res.ok) {
        setNewChatMessage("");
        fetchChatMessages();
      }
    } catch {
      console.error("Failed to send message.");
    }
  };

  const handleBulkMarkAttendance = async () => {
    setMessage("");
    if (!user?.assignedClassId) {
      setMessage("No class assigned to you.");
      return;
    }
    
    const records = students.map(s => ({
      studentId: s.id,
      classId: user.assignedClassId,
      section: s.section,
      date: attendanceDate,
      status: bulkAttendance[s.id] || "P"
    }));

    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, teacherId: user.id })
      });
      if (res.ok) {
        setMessage("Attendance marked for entire class!");
        fetchAttendanceRecords();
      } else {
        setMessage("Failed to mark attendance.");
      }
    } catch {
      setMessage("Error marking attendance.");
    }
  };

  const handleDeleteAttendance = async (id: number) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      const res = await fetch(`/api/teacher/attendance?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchAttendanceRecords();
    } catch {
      console.error("Failed to delete attendance");
    }
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!user?.assignedClassId) {
      setMessage("You must be assigned to a Class to enter marks.");
      return;
    }
    if (!selectedSubject) {
      setMessage("Please select a subject.");
      return;
    }
    try {
      const res = await fetch("/api/teacher/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           studentId: selectedStudent, 
           classId: user.assignedClassId,
           section: students.find(s => s.id.toString() === selectedStudent)?.section || "A",
           teacherId: user.id,
           subject: selectedSubject,
           assessmentType,
           obtained, 
           total,
           date: date || new Date().toISOString().split('T')[0],
           remarks
        })
      });
      if (res.ok) {
        setMessage(`${assessmentType} Marks added successfully!`);
        setObtained("");
        setRemarks("");
        fetchMarks();
      } else {
        const d = await res.json();
        setMessage(d.error || "Error adding marks.");
      }
    } catch {
      setMessage("Error adding marks.");
    }
  };
  
  const handleDeleteMark = async (id: number) => {
    if (!confirm('Delete this mark record?')) return;
    try {
      const res = await fetch(`/api/teacher/marks?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchMarks();
    } catch {
      console.error("Failed to delete mark");
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!user?.assignedClassId) {
      setMessage("You must be assigned to a class to create assignments.");
      return;
    }
    if (!assignmentSubject) {
      setMessage("Please select a subject.");
      return;
    }
    
    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: assignmentTitle,
          description: assignmentDesc,
          dueDate: assignmentDate,
          subject: assignmentSubject,
          classId: user.assignedClassId,
          teacherId: user.id
        })
      });
      if (res.ok) {
        setMessage("Assignment posted successfully!");
        setAssignmentTitle("");
        setAssignmentDesc("");
        setAssignmentDate("");
        setAssignmentSubject("");
        fetchAssignments();
      } else {
        const d = await res.json();
        setMessage(d.error || "Error creating assignment.");
      }
    } catch {
      setMessage("Error creating assignment.");
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout 
      roleTitle="Teacher Portal" 
      userName={user.name} 
      menuItems={menuItems} 
      activeTab={activeTab} 
      setActiveTab={(tab) => { setActiveTab(tab); setMessage(""); }}
    >
      
      {message && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--success)", borderRadius: "8px", color: "var(--success)" }}>
          {message}
        </div>
      )}

      {activeTab === "dashboard" && (
        <div className="animate-fade-in">
          <div className="grid-metrics">
            <MetricCard title="Total Students" value={students.length} icon={Users} colorClass="bg-blue" />
            <MetricCard title="Active Assignments" value={assignments.length} icon={BookOpen} colorClass="bg-orange" />
            <MetricCard title="Parent Contacts" value={parents.length} icon={MessageSquare} colorClass="bg-green" />
            <MetricCard title="Class Assigned" value={`Class ${user.assignedClassId || 'N/A'}`} icon={CheckCircle} colorClass="bg-purple" />
          </div>
          
          <div className="grid-bento">
            <div className="glass-card">
              <div className="table-header" style={{ padding: "0 0 1rem 0", marginBottom: "1rem" }}>
                <span>My Students</span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Roll #</th><th>Student Name</th><th>Father's Name</th><th>Contact Info</th><th>Gender</th></tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>No students found in your class.</td></tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id}>
                          <td style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{s.rollNumber ? `#${s.rollNumber}` : "N/A"}</td>
                          <td style={{ fontWeight: 500 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div className="avatar" style={{ width: 32, height: 32 }}>
                                  <img src={`https://ui-avatars.com/api/?name=${s.name}&background=1e293b&color=fff`} alt="" style={{ width: "100%", height: "100%" }} />
                                </div>
                                {s.name}
                            </div>
                          </td>
                          <td>{s.fatherName || "-"}</td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "0.9rem" }}>{s.contactNumber || "-"}</span>
                              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.parentContactNumber ? `P: ${s.parentContactNumber}` : ""}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${s.gender === 'Female' ? 'badge-purple' : 'badge-blue'}`}>
                              {s.gender || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="glass-card">
              <div className="table-header" style={{ padding: "0 0 1rem 0", marginBottom: "1rem" }}>
                <span>Quick Actions</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button className="btn-secondary" onClick={() => setActiveTab("attendance")} style={{ justifyContent: "flex-start", padding: "1rem" }}>
                  <ClipboardCheck size={18} style={{ color: "var(--primary)" }} /> Mark Today's Attendance
                </button>
                <button className="btn-secondary" onClick={() => setActiveTab("assignments")} style={{ justifyContent: "flex-start", padding: "1rem" }}>
                  <BookOpen size={18} style={{ color: "var(--primary)" }} /> Create New Assignment
                </button>
                <button className="btn-secondary" onClick={() => setActiveTab("results")} style={{ justifyContent: "flex-start", padding: "1rem" }}>
                  <Award size={18} style={{ color: "var(--primary)" }} /> Post Exam Results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === "attendance" || activeTab === "results") && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }} className="animate-fade-in">
          <div style={{ flex: "1 1 100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Conditional Content based on Active Tab */}
            {activeTab === "attendance" ? (
              <>
                {/* Header with Title and Current Selection */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div className="badge badge-blue" style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}>
                       Class {user.assignedClassId} / {students[0]?.section || "N/A"}
                    </div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Mark Attendance</h2>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface)", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <ClipboardCheck size={18} style={{ color: "var(--primary)" }} />
                    <span style={{ fontWeight: 500 }}>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Attendance Summary Cards */}
                <div className="grid-metrics" style={{ width: "100%" }}>
                  <MetricCard title="Total Students" value={students.length} icon={Users} colorClass="bg-blue" />
                  <MetricCard title="Present" value={Object.values(bulkAttendance).filter(v => v === "P").length} icon={CheckCircle} colorClass="bg-green" />
                  <MetricCard title="Absent" value={Object.values(bulkAttendance).filter(v => v === "A").length} icon={ClipboardCheck} colorClass="bg-orange" />
                  <MetricCard title="Leave" value={Object.values(bulkAttendance).filter(v => v === "L").length} icon={ClipboardCheck} colorClass="bg-purple" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem", width: "100%" }}>
                  {/* Left Side: Attendance List */}
                  <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <h3 style={{ fontSize: "1.2rem" }}>Mark Student Attendance</h3>
                      <input 
                        type="date" 
                        value={attendanceDate} 
                        onChange={e => setAttendanceDate(e.target.value)}
                        style={{ width: "auto", padding: "0.5rem" }}
                      />
                    </div>
                    
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr><th>Roll #</th><th>Student Name</th><th>Father Name</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {students.map(s => (
                            <tr key={s.id}>
                            <td style={{ color: "var(--text-muted)" }}>{s.rollNumber ? `#${s.rollNumber}` : "N/A"}</td>
                              <td style={{ fontWeight: 500 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <div className="avatar" style={{ width: 28, height: 28 }}>
                                    <img src={`https://ui-avatars.com/api/?name=${s.name}&background=1e293b&color=fff`} alt="" />
                                  </div>
                                  {s.name}
                                </div>
                              </td>
                              <td style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{s.fatherName}</td>
                              <td>
                                <select 
                                  value={bulkAttendance[s.id] || "P"} 
                                  onChange={e => setBulkAttendance({ ...bulkAttendance, [s.id]: e.target.value })}
                                  style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", width: "110px" }}
                                >
                                  <option value="P">Present</option>
                                  <option value="A">Absent</option>
                                  <option value="L">Leave</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button className="btn-primary" onClick={handleBulkMarkAttendance} style={{ marginTop: "1.5rem", width: "100%" }}>
                       Submit Class Attendance
                    </button>
                  </div>

                  {/* Right Side: Attendance History */}
                  <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <h3 style={{ fontSize: "1.1rem" }}>Attendance History</h3>
                      <div style={{ position: "relative" }}>
                        <ClipboardCheck size={18} style={{ color: "var(--primary)" }} />
                        <input 
                          type="date" 
                          value={historyDate} 
                          onChange={e => setHistoryDate(e.target.value)}
                          style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer" }}
                        />
                      </div>
                    </div>

                    <div className="table-container" style={{ maxHeight: "500px", overflowY: "auto" }}>
                      <table>
                        <thead>
                          <tr><th>Student (Roll #)</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.length === 0 ? <tr><td colSpan={2} style={{ textAlign: "center", padding: "2rem" }}>No records for {historyDate}</td></tr> :
                            attendanceRecords.map(r => (
                              <tr key={r.id}>
                                <td>
                                  <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{r.studentName} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>#{r.rollNumber}</span></div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Father: {r.fatherName}</div>
                                </td>
                                <td>
                                  <span className={`badge ${r.status === 'P' ? 'badge-success' : r.status === 'A' ? 'badge-danger' : 'badge-warning'}`}>
                                    {r.status === 'P' ? 'Present' : r.status === 'A' ? 'Absent' : 'Leave'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === "results" ? (
              <div className="glass-card" style={{ maxWidth: "600px" }}>
                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Post Exam Results</h3>
                <form onSubmit={handleAddResult} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Class Assigned</label>
                      <input disabled value={`Class ${user.assignedClassId || 'N/A'}`} style={{ opacity: 0.5 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Subject</label>
                      <select required value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                        <option value="">-- Choose Subject --</option>
                        {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Assessment Type</label>
                      <select required value={assessmentType} onChange={e => setAssessmentType(e.target.value)}>
                        <option value="Quiz">Quiz</option>
                        <option value="Assignment">Assignment</option>
                        <option value="Class Test">Class Test</option>
                        <option value="Monthly Test">Monthly Test</option>
                        <option value="Mid Term Exam">Mid Term Exam</option>
                        <option value="Final Exam">Final Exam</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Date</label>
                      <input required type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Select Student</label>
                    <select required value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                      <option value="">-- Choose Student --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.rollNumber ? `#${s.rollNumber}` : ""} {s.name}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Obtained Marks</label>
                      <input type="number" required step="0.1" value={obtained} onChange={e => setObtained(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Total Marks</label>
                      <input type="number" required step="0.1" value={total} onChange={e => setTotal(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">Publish Result</button>
                </form>
              </div>
            ) : null}
          </div>

          {activeTab === "results" && (
            <div className="table-container animate-fade-in" style={{ flex: "1 1 500px", maxWidth: "800px" }}>
              <div className="table-header">
                <span>Recent Marks Entries ({user.subject || 'All'})</span>
                <button 
                  className="btn-secondary" 
                  style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                  onClick={() => exportToCSV(marks, `Marks_Export_Class_${user.assignedClassId}_${new Date().toISOString().split('T')[0]}`)}
                >
                  Export CSV
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Student</th>
                    <th>Assessment</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.length === 0 ? <tr><td colSpan={6} style={{textAlign: "center", padding: "2rem"}}>No marks recorded yet.</td></tr> :
                    marks.map((m, i) => (
                      <tr key={m.id}>
                        <td style={{ color: "var(--text-muted)" }}>#{m.id}</td>
                        <td style={{ fontWeight: 500 }}>{m.studentName} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>#{m.rollNumber}</span></td>
                        <td>
                          <span className="badge badge-blue">{m.assessmentType}</span>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{m.date}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.obtained} / {m.total}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{Number(m.percentage).toFixed(1)}%</div>
                        </td>
                        <td>
                          <span className={`badge ${['A+','A'].includes(m.grade) ? 'badge-success' : ['B','C'].includes(m.grade) ? 'badge-warning' : 'badge-danger'}`}>
                            {m.grade}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleDeleteMark(m.id)} className="btn-ghost" style={{ color: "var(--danger)", padding: "0.3rem" }}>Delete</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}

          {/* End Results Tab Content */}
        </div>
      )}

      {activeTab === "assignments" && (
        <TeacherAssignmentsView user={user} subjects={subjects} />
      )}

      {activeTab === "ranking" && (
        <div className="animate-fade-in">
           <div style={{ marginBottom: "2rem" }}>
             <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Class Ranking & Merit List</h2>
             <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Academic standings for Class {user?.assignedClassId}</p>
           </div>
           <MeritList 
             initialClassId={user?.assignedClassId?.toString()} 
             classes={[{id: user?.assignedClassId, name: `Class ${user?.assignedClassId}`}]} 
             subjects={subjects}
             hideFilters={false} 
           />
        </div>
      )}

      {activeTab === "performance" && classPerformance && (
        <ClassPerformanceAnalytics 
          data={classPerformance} 
          title="Class Academic Analytics" 
          subtitle={`Detailed performance metrics for your assigned class`} 
        />
      )}

      {activeTab === "timetable" && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>My Weekly Schedule</h2>
            <div className="badge badge-blue">Teacher ID: #{user.id}</div>
          </div>
          
          <div className="glass-card">
            <div className="table-header">
               <span>Classes Assigned</span>
            </div>
            <div className="table-container">
               <table>
                 <thead>
                   <tr>
                     <th>Day</th>
                     <th>Subject</th>
                     <th>Class & Section</th>
                     <th>Time</th>
                     <th>Room</th>
                   </tr>
                 </thead>
                 <tbody>
                   {timetable.length === 0 ? (
                     <tr><td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>No periods scheduled for you yet.</td></tr>
                   ) : (
                     timetable
                      .sort((a, b) => {
                        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                        if (a.day !== b.day) return days.indexOf(a.day) - days.indexOf(b.day);
                        return a.startTime.localeCompare(b.startTime);
                      })
                      .map(t => (
                       <tr key={t.id}>
                         <td style={{ fontWeight: 600 }}>{t.day}</td>
                         <td><span className="badge badge-purple">{t.subject}</span></td>
                         <td>Class {t.classId} - {t.sectionId}</td>
                         <td>
                           <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                             <Clock size={14} style={{ color: "var(--primary)" }} />
                             {t.startTime} - {t.endTime}
                           </div>
                         </td>
                         <td>{t.room}</td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "my-profile" && (
        <div className="animate-fade-in" style={{ padding: "1rem" }}>
          <div className="glass-card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}>
            {/* Header */}
            <div style={{ height: "160px", background: "linear-gradient(135deg, var(--primary) 0%, var(--accent-pink) 100%)", position: "relative" }}>
               <div style={{ position: "absolute", bottom: "-50px", left: "40px", display: "flex", alignItems: "flex-end", gap: "1.5rem" }}>
                 <div className="avatar" style={{ width: "120px", height: "120px", border: "4px solid var(--bg-dark)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                   <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e293b&color=fff&size=128`} alt={user.name} />
                 </div>
                 <div style={{ marginBottom: "15px" }}>
                   <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{user.name}</h2>
                   <div style={{ display: "flex", gap: "0.5rem" }}>
                     <span className="badge badge-purple">Teacher ID: #{user.id}</span>
                     <span className="badge badge-blue">Class Assigned: {user.assignedClassId || 'None'}</span>
                   </div>
                 </div>
               </div>
            </div>

            <div style={{ padding: "70px 40px 40px 40px" }}>
               <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2.5rem" }}>
                 
                 {/* Personal Info */}
                 <div>
                   <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                     <UserIcon size={20} color="var(--primary)" />
                     <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Personal Profile</h3>
                   </div>
                   <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                     <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                       <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Contact</span>
                       <span style={{ fontWeight: 500 }}>{user.contactNumber || "N/A"}</span>
                     </div>
                     <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                       <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Role</span>
                       <span className="badge badge-purple" style={{ width: "fit-content" }}>{user.role}</span>
                     </div>
                     <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                       <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Joining Date</span>
                       <span style={{ fontWeight: 500 }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                     </div>
                   </div>
                 </div>

                 {/* Official Record */}
                 <div>
                   <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                     <CheckCircle size={20} color="var(--primary)" />
                     <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Official Assignment</h3>
                   </div>
                   <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                     <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", alignItems: "center" }}>
                       <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Assigned Class</span>
                       <span className="badge badge-blue" style={{ width: "fit-content" }}>Class {user.assignedClassId || 'None'}</span>
                     </div>
                     <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                       <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Specialization</span>
                       <span style={{ fontWeight: 500 }}>{user.subject || "General Teacher"}</span>
                     </div>
                     <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                       <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Total Students</span>
                       <span style={{ fontWeight: 500 }}>{students.length} Under Supervision</span>
                     </div>
                   </div>
                 </div>
               </div>

               <div style={{ marginTop: "3rem", padding: "1.5rem", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                  <h4 style={{ marginBottom: "1rem", fontWeight: 600 }}>Quick System Status</h4>
                  <div style={{ display: "flex", gap: "2rem" }}>
                     <div>
                       <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem" }}>Pending Assignments</span>
                       <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--orange)" }}>{assignments.length}</span>
                     </div>
                     <div>
                        <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem" }}>Today's Date</span>
                        <span style={{ fontWeight: 700, fontSize: "1.2rem" }}>{new Date().toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div style={{ display: "flex", gap: "1.5rem", height: "calc(100vh - 180px)", minHeight: "500px" }} className="animate-fade-in">
          <div className="glass-card" style={{ flex: "0 0 320px", display: "flex", flexDirection: "column", padding: "1rem" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Parent Contacts</h3>
            {parents.length === 0 ? <p style={{color: "var(--text-muted)", padding: "1rem", textAlign: "center"}}>No parents registered for your class.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
                {parents.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => setSelectedParentId(p.id.toString())}
                    style={{ 
                      padding: "1rem", 
                      textAlign: "left", 
                      borderRadius: "8px", 
                      border: "none", 
                      backgroundColor: selectedParentId === p.id.toString() ? "var(--primary)" : "transparent",
                      color: selectedParentId === p.id.toString() ? "#fff" : "var(--text-main)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => { if (selectedParentId !== p.id.toString()) e.currentTarget.style.backgroundColor = "var(--surface-hover)" }}
                    onMouseLeave={(e) => { if (selectedParentId !== p.id.toString()) e.currentTarget.style.backgroundColor = "transparent" }}
                  >
                    <div className="avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>
                      <img src={`https://ui-avatars.com/api/?name=${p.name}&background=1e293b&color=fff`} alt="" style={{ width: "100%", height: "100%" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: "0.8rem", color: selectedParentId === p.id.toString() ? "rgba(255,255,255,0.8)" : "var(--text-muted)"}}>Parent of {p.child?.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
            {selectedParentId ? (
              <>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div className="avatar">
                    <img src={`https://ui-avatars.com/api/?name=${parents.find(p=>p.id.toString()===selectedParentId)?.name}&background=1e293b&color=fff`} alt="" style={{ width: "100%", height: "100%" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem" }}>{parents.find(p => p.id.toString() === selectedParentId)?.name}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--success)" }}>Online</p>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "var(--bg-dark)" }}>
                  {chatMessages.length === 0 ? (
                    <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto" }}>No messages yet. Send a message to start the conversation.</p>
                  ) : (
                    chatMessages.map(m => {
                      const isMine = m.senderId === user.id;
                      return (
                        <div key={m.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                          <div style={{ 
                            padding: "0.75rem 1rem", 
                            borderRadius: "12px", 
                            backgroundColor: isMine ? "var(--primary)" : "var(--surface)", 
                            color: "#fff",
                            borderBottomRightRadius: isMine ? 0 : "12px",
                            borderBottomLeftRadius: !isMine ? 0 : "12px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                          }}>
                            {m.content}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem", textAlign: isMine ? "right" : "left" }}>
                            {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <form onSubmit={sendChatMessage} style={{ display: "flex", padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                  <input 
                    required
                    placeholder="Type your message here..." 
                    value={newChatMessage}
                    onChange={e => setNewChatMessage(e.target.value)}
                    style={{ flex: 1, marginRight: "1rem" }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: "0 1.5rem" }}>Send</button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: "1rem" }}>
                <MessageSquare size={48} style={{ opacity: 0.2 }} />
                <p>Select a parent from the left panel to open chat.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "notices" && (
        <NoticesView role="TEACHER" />
      )}

      {activeTab === "subjects" && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Manage Class Subjects</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Define the subjects being taught in your assigned class.</p>
          </div>

          {!user?.assignedClassId ? (
            <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
               <Book size={64} style={{ opacity: 0.1, margin: "0 auto 1.5rem auto" }} />
               <p>You are not assigned as a Class Teacher. Contact Admin to assign you a class.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem", alignItems: "flex-start" }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.1rem" }}>Add New Subject</h3>
                <form onSubmit={handleAddSubject} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                   <div>
                     <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Subject Name</label>
                     <input required placeholder="e.g. Computer Science" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
                   </div>
                   <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }}>Add to Class</button>
                </form>
              </div>

              <div className="table-container">
                <div className="table-header">
                  <span>Class Subjects List</span>
                </div>
                <table>
                  <thead>
                    <tr><th>Subject Name</th><th style={{ textAlign: "right" }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 ? (
                      <tr><td colSpan={2} style={{ textAlign: "center", padding: "2rem" }}>No subjects defined yet.</td></tr>
                    ) : (
                      subjects.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600, color: "var(--primary)" }}>{s.name}</td>
                          <td style={{ textAlign: "right" }}>
                             <button onClick={() => handleDeleteSubject(s.id)} className="btn-ghost" style={{ color: "var(--danger)", padding: "0.4rem" }}>Remove</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </DashboardLayout>
  );
}
