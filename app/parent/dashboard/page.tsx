"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import MetricCard from "@/app/components/MetricCard";
import NoticesView from "@/app/components/NoticesView";
import ParentAssignmentsView from "@/app/components/ParentAssignmentsView";
import { LayoutDashboard, CalendarCheck, Award, DollarSign, MessageSquare, Users, Bell, BookOpen, Printer, CalendarDays, Clock, BarChart3 } from "lucide-react";
import VoucherPreviewModal from "@/app/components/VoucherPreviewModal";
import PerformanceAnalytics from "@/app/components/PerformanceAnalytics";
import MeritList from "@/app/components/MeritList";

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Messaging States
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "performance", label: "Performance", icon: BarChart3 },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "results", label: "Results", icon: Award },
    { id: "assignments", label: "Assignments", icon: BookOpen },
    { id: "fees", label: "Fee Status", icon: DollarSign },
    { id: "timetable", label: "Timetable", icon: CalendarDays },
    { id: "notices", label: "Announcements", icon: Bell },
    { id: "messages", label: "Messaging", icon: MessageSquare, badge: teachers.length },
  ];

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/");
      return;
    }
    const u = JSON.parse(userStr);
    if (u.role !== "PARENT") {
      router.push("/");
      return;
    }
    if (!u.childId) {
      alert("No child assigned to this parent account.");
      setLoading(false);
      return;
    }
    setUser(u);

    const fetchRecords = async () => {
      try {
        const res = await fetch(`/api/student/records?studentId=${u.childId}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
          if (d.student?.classId) fetchTimetable(d.student.classId);
          fetchPerformance(u.childId);
        }
    } catch (err) {
      console.error("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async (studentId: any) => {
    try {
      const res = await fetch(`/api/analytics/student?studentId=${studentId}`);
      if (res.ok) setPerformanceData(await res.json());
    } catch { console.error("Failed to fetch performance data"); }
  };

  const fetchTimetable = async (classId: any) => {
    try {
      const res = await fetch(`/api/student/timetable?classId=${classId}`);
      if (res.ok) setTimetable(await res.json());
    } catch { console.error("Failed to fetch timetable"); }
  };

  fetchRecords();
  }, [router]);

  useEffect(() => {
    if (user?.id) {
       fetchTeachers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeacherId && user?.id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedTeacherId, user]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`/api/parent/teachers?parentId=${user.id}`);
      if (res.ok) {
        setTeachers(await res.json());
      }
    } catch {
       console.error("Failed to fetch teachers.");
    }
  };

  const fetchMessages = async () => {
    if (!selectedTeacherId) return;
    try {
      const res = await fetch(`/api/messages?userId=${user.id}&otherUserId=${selectedTeacherId}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch {
       console.error("Failed to fetch messages.");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeacherId) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedTeacherId,
          content: newMessage
        })
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch {
      console.error("Failed to send message.");
    }
  };

  if (!user) return null;

  // Calculate metrics
  let attendancePercentage = 100;
  if (data?.attendances?.length > 0) {
    const presents = data.attendances.filter((a: any) => a.status === 'P').length;
    attendancePercentage = Math.round((presents / data.attendances.length) * 100);
  }

  const pendingFees = data?.fees?.reduce((acc: number, f: any) => acc + (f.status !== 'Paid' ? parseFloat(f.remainingFee) : 0), 0) || 0;
  const latestResult = data?.marks?.length > 0 ? `${Number(data.marks[data.marks.length-1].percentage).toFixed(1)}%` : (data?.results?.[0] ? `${data.results[0].percentage}%` : "N/A");

  return (
    <DashboardLayout 
      roleTitle="Parent Portal" 
      userName={user.name} 
      menuItems={menuItems} 
      activeTab={activeTab} 
      setActiveTab={(tab) => { setActiveTab(tab); }}
      modals={
        <VoucherPreviewModal 
          isOpen={showVoucherModal} 
          onClose={() => setShowVoucherModal(false)} 
          voucher={selectedVoucher ? { 
            ...selectedVoucher, 
            studentName: data?.student?.name, 
            className: data?.student?.class || data?.student?.classId 
          } : null}
        />
      }
    >

      {loading ? (
         <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading child's records...</div>
      ) : !data ? (
         <div style={{ padding: "2rem", color: "var(--danger)" }}>Failed to load records or no child assigned.</div>
      ) : (
        <>
          {activeTab === "dashboard" && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div className="avatar" style={{ width: 48, height: 48 }}>
                   <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.student.name)}&background=10b981&color=fff&size=48`} alt="" style={{ width: "100%", height: "100%" }} />
                </div>
                <div>
                   <h2 style={{ fontSize: "1.25rem" }}>Child Overview: {data.student.name}</h2>
                   <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{data.student.class || 'No Class Assigned'}</p>
                </div>
              </div>

              <div className="grid-metrics">
                <MetricCard title="Attendance" value={`${attendancePercentage}%`} icon={CalendarCheck} colorClass="bg-blue" />
                <MetricCard title="Pending Fees" value={`Rs. ${pendingFees.toFixed(2)}`} icon={DollarSign} colorClass="bg-orange" />
                <MetricCard title="Latest Result" value={latestResult} subtitle={data.results?.[0] ? `Grade ${data.results[0].grade}` : 'No exams yet'} icon={Award} colorClass="bg-purple" />
                <MetricCard title="Direct Teachers" value={teachers.length} icon={Users} colorClass="bg-green" />
              </div>

              <div className="grid-bento">
                <div className="glass-card">
                  <div className="table-header" style={{ padding: "0 0 1rem 0", marginBottom: "1rem" }}>
                    <span>Recent Attendance</span>
                    <button className="btn-ghost" onClick={() => setActiveTab("attendance")} style={{ fontSize: "0.85rem", padding: "0" }}>View All ›</button>
                  </div>
                  <div>
                    {data.attendances.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", padding: "1rem" }}>No attendance records.</p>
                    ) : (
                      data.attendances.slice(0, 3).map((a: any) => (
                        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "1rem", borderBottom: "1px solid var(--border)" }}>
                           <span>{a.date}</span>
                           <span className={`badge ${a.status === 'P' ? 'badge-success' : 'badge-danger'}`}>{a.status === 'P' ? 'Present' : 'Absent'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="glass-card">
                  <div className="table-header" style={{ padding: "0 0 1rem 0", marginBottom: "1rem" }}>
                    <span>Quick Actions</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                     <button className="btn-secondary" onClick={() => setActiveTab("fees")} style={{ justifyContent: "flex-start", padding: "1rem" }}>
                       <DollarSign size={18} style={{ color: "var(--primary)" }} /> Pay Outstanding Fees
                     </button>
                     <button className="btn-secondary" onClick={() => setActiveTab("messages")} style={{ justifyContent: "flex-start", padding: "1rem" }}>
                       <MessageSquare size={18} style={{ color: "var(--primary)" }} /> Message Teachers
                     </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {["attendance", "fees"].includes(activeTab) && (
             <div className="table-container animate-fade-in">
               <div className="table-header">
                 <span>{menuItems.find(m => m.id === activeTab)?.label}</span>
               </div>
               <table>
                  {activeTab === "attendance" && (
                    <>
                      <thead><tr><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {data.attendances.length === 0 ? <tr><td colSpan={2} style={{ textAlign: "center", padding: "3rem" }}>No records.</td></tr> : 
                          data.attendances.map((a: any) => (
                            <tr key={a.id}>
                              <td style={{ color: "var(--text-muted)" }}>{a.date}</td>
                              <td>
                                <span className={`badge ${a.status === 'P' ? 'badge-success' : 'badge-danger'}`}>
                                  {a.status === 'P' ? 'Present' : 'Absent'}
                                </span>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </>
                  )}

                  {activeTab === "fees" && (
                    <>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Year</th>
                          <th>Total Fee</th>
                          <th>Paid</th>
                          <th>Remaining</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.fees.length === 0 ? (
                          <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}>No fee records found.</td></tr>
                        ) : (
                          data.fees.map((f: any) => (
                            <tr key={f.id}>
                              <td><span className="badge badge-purple">{f.month}</span></td>
                              <td><span className="badge badge-blue">{f.year}</span></td>
                              <td>Rs. {parseFloat(f.totalFee).toFixed(2)}</td>
                              <td style={{ color: "var(--success)" }}>Rs. {parseFloat(f.paidFee).toFixed(2)}</td>
                              <td style={{ color: f.remainingFee > 0 ? "var(--danger)" : "inherit" }}>
                                Rs. {parseFloat(f.remainingFee).toFixed(2)}
                              </td>
                              <td>
                                <span className={`badge ${
                                  f.status === 'Paid' ? 'badge-success' : 
                                  f.status === 'Partial' ? 'badge-warning' : 'badge-danger'
                                }`}>
                                  {f.status}
                                </span>
                              </td>
                              <td>
                                {f.status !== 'Paid' && (
                                  <button className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Pay Now</button>
                                )}
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", marginLeft: "0.5rem" }}
                                  onClick={() => { setSelectedVoucher(f); setShowVoucherModal(true); }}
                                >
                                  <Printer size={14} style={{ marginRight: "4px" }} /> Voucher
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </>
                  )}
               </table>
             </div>
          )}

          {activeTab === "assignments" && (
            <ParentAssignmentsView childId={user.childId} classId={data?.student?.classId} />
          )}

          {activeTab === "performance" && performanceData && (
            <PerformanceAnalytics 
              data={performanceData} 
              title="Academic Performance Analytics" 
              subtitle={`Detailed performance breakdown for ${data?.student?.name}`} 
            />
          )}

          {activeTab === "results" && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: "2.5rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Child's Academic Performance</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Detailed breakdown of assessments and subject-wise marks.</p>
              </div>

              <div style={{ marginBottom: "3rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", fontWeight: 600 }}>Class Ranking & Standings</h3>
                <MeritList 
                  initialClassId={data?.student?.classId?.toString()} 
                  classes={[{id: data?.student?.classId, name: data?.student?.class}]}
                  subjects={Array.from(new Set(data.marks?.map((m: any) => m.subject) || [])).map((s, idx) => ({id: idx, name: s}))}
                  hideFilters={false}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Subject-wise Breakdown</h3>
              </div>

              {(!data.marks || data.marks.length === 0) && (!data.results || data.results.length === 0) ? (
                <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <Award size={64} style={{ opacity: 0.1, margin: "0 auto 1.5rem auto" }} />
                  <p>No academic records found for this session yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  {/* Subject-wise Cards */}
                  {(Array.from(new Set(data.marks?.map((m: any) => m.subject) || [])) as string[]).map((subject: string) => {
                    const subjectMarks = (data.marks || []).filter((m: any) => m.subject === subject);
                    const avgPerc = subjectMarks.reduce((acc: number, m: any) => acc + m.percentage, 0) / (subjectMarks.length || 1);
                    
                    return (
                      <div key={subject} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ padding: "1.25rem 1.5rem", backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{subject}</h3>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{subjectMarks.length} Assessments recorded</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>{avgPerc.toFixed(1)}%</div>
                            <span className="badge badge-success">Average Grade: {avgPerc >= 90 ? 'A+' : avgPerc >= 80 ? 'A' : avgPerc >= 70 ? 'B' : 'C'}</span>
                          </div>
                        </div>
                        <div className="table-container" style={{ borderRadius: 0, border: "none" }}>
                          <table style={{ backgroundColor: "transparent" }}>
                            <thead>
                              <tr>
                                <th>Assessment Type</th>
                                <th>Date</th>
                                <th>Obtained</th>
                                <th>Total</th>
                                <th>Grade</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(subjectMarks as any[]).map((m: any) => (
                                <tr key={m.id || Math.random()}>
                                  <td><span className="badge badge-blue">{m.assessmentType}</span></td>
                                  <td style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{m.date}</td>
                                  <td style={{ fontWeight: 600 }}>{m.obtained}</td>
                                  <td style={{ color: "var(--text-muted)" }}>{m.total}</td>
                                  <td>
                                    <span className={`badge ${['A+','A'].includes(m.grade) ? 'badge-success' : ['B','C'].includes(m.grade) ? 'badge-warning' : 'badge-danger'}`}>
                                      {m.grade}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--text-muted)" }}>{m.remarks || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  {/* Legacy Results (if any) */}
                  {data.results && data.results.length > 0 && (
                    <div className="glass-card">
                      <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Previous Examinations</h3>
                      <div className="table-container" style={{ border: "none" }}>
                        <table style={{ backgroundColor: "transparent" }}>
                          <thead><tr><th>Obtained Marks</th><th>Total Marks</th><th>Percentage</th><th>Overall Grade</th></tr></thead>
                          <tbody>
                            {data.results.map((r: any) => (
                              <tr key={r.id}>
                                <td style={{ fontWeight: 600 }}>{r.obtained}</td>
                                <td style={{ color: "var(--text-muted)" }}>{r.total}</td>
                                <td style={{ fontWeight: 600 }}>{parseFloat(r.percentage).toFixed(2)}%</td>
                                <td><span className="badge badge-purple">{r.grade}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div style={{ display: "flex", gap: "1.5rem", height: "calc(100vh - 180px)", minHeight: "500px" }} className="animate-fade-in">
              <div className="glass-card" style={{ flex: "0 0 320px", display: "flex", flexDirection: "column", padding: "1rem" }}>
                <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Teachers</h3>
                {teachers.length === 0 ? <p style={{color: "var(--text-muted)", padding: "1rem", textAlign: "center"}}>No teachers assigned to child's class.</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
                    {teachers.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => setSelectedTeacherId(t.id.toString())}
                        style={{ 
                          padding: "1rem", 
                          textAlign: "left", 
                          borderRadius: "8px", 
                          border: "none", 
                          backgroundColor: selectedTeacherId === t.id.toString() ? "var(--primary)" : "transparent",
                          color: selectedTeacherId === t.id.toString() ? "#fff" : "var(--text-main)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <div className="avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>
                          <img src={`https://ui-avatars.com/api/?name=${t.name}&background=1e293b&color=fff`} alt="" style={{ width: "100%", height: "100%" }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{t.name}</div>
                          <div style={{ fontSize: "0.8rem", color: selectedTeacherId === t.id.toString() ? "rgba(255,255,255,0.8)" : "var(--text-muted)"}}>Teacher</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
                {selectedTeacherId ? (
                  <>
                    <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div className="avatar">
                        <img src={`https://ui-avatars.com/api/?name=${teachers.find(t=>t.id.toString()===selectedTeacherId)?.name}&background=1e293b&color=fff`} alt="" style={{ width: "100%", height: "100%" }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.1rem" }}>{teachers.find(t => t.id.toString() === selectedTeacherId)?.name}</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--success)" }}>Online</p>
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "var(--bg-dark)" }}>
                      {messages.length === 0 ? (
                        <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto" }}>No messages yet. Send a message to start the conversation.</p>
                      ) : (
                        messages.map(m => {
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
                    <form onSubmit={sendMessage} style={{ display: "flex", padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                      <input 
                        required
                        placeholder="Type your message here..." 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        style={{ flex: 1, marginRight: "1rem" }}
                      />
                      <button type="submit" className="btn-primary" style={{ padding: "0 1.5rem" }}>Send</button>
                    </form>
                  </>
                ) : (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: "1rem" }}>
                    <MessageSquare size={48} style={{ opacity: 0.2 }} />
                    <p>Select a teacher from the left panel to open chat.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "notices" && (
            <NoticesView role="PARENT" />
          )}

          {activeTab === "timetable" && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Child's Weekly Timetable</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Class schedule for {data?.student?.name}</p>
              </div>
              <div className="glass-card">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Subject</th>
                        <th>Time Slot</th>
                        <th>Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetable.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: "center", padding: "3rem" }}>No timetable available yet.</td></tr>
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
                              <td><span className="badge badge-blue">{t.subject}</span></td>
                              <td>{t.startTime} - {t.endTime}</td>
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
        </>
      )}
    </DashboardLayout>
  );
}
