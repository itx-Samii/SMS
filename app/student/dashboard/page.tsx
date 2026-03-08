"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import MetricCard from "@/app/components/MetricCard";
import NoticesView from "@/app/components/NoticesView";
import { LayoutDashboard, CalendarCheck, BookOpen, Award, DollarSign, Settings, Bell, CalendarDays } from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "timetable", label: "My Timetable", icon: CalendarDays },
    { id: "attendance", label: "My Attendance", icon: CalendarCheck },
    { id: "assignments", label: "My Assignments", icon: BookOpen, badge: data?.assignments?.length || 0 },
    { id: "results", label: "Exam Results", icon: Award },
    { id: "fees", label: "Fee Vouchers", icon: DollarSign },
    { id: "notices", label: "Announcements", icon: Bell },
    { id: "profile", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/");
      return;
    }
    const u = JSON.parse(userStr);
    if (u.role !== "STUDENT") {
      router.push("/");
      return;
    }
    setUser(u);
    setEditName(u.name);

    const fetchRecords = async () => {
      try {
        const res = await fetch(`/api/student/records?studentId=${u.id}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch records");
      } finally {
        setLoading(false);
      }
    };

    const fetchTimetable = async () => {
      try {
         if (u.classId) {
           const res = await fetch(`/api/student/timetable?classId=${u.classId}`);
           if (res.ok) setTimetable(await res.json());
         }
      } catch (err) {
         console.error("Failed to fetch timetable");
      }
    };

    fetchRecords();
    fetchTimetable();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, name: editName, password: editPassword })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setProfileMsg("Profile updated successfully!");
        setEditPassword("");
      } else {
        setProfileMsg("Failed to update profile.");
      }
    } catch {
      setProfileMsg("Error updating profile.");
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
      roleTitle="Student Portal" 
      userName={user.name} 
      menuItems={menuItems} 
      activeTab={activeTab} 
      setActiveTab={(tab) => { setActiveTab(tab); setProfileMsg(""); }}
    >

      {loading ? (
         <div style={{ padding: "2rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
           Loading your records...
         </div>
      ) : !data ? (
         <div style={{ padding: "2rem", color: "var(--danger)" }}>Failed to load records.</div>
      ) : (
        <>
          {activeTab === "dashboard" && (
            <div className="animate-fade-in">
              <div className="grid-metrics">
                <MetricCard title="Attendance" value={`${attendancePercentage}%`} icon={CalendarCheck} colorClass="bg-blue" />
                <MetricCard title="Pay Now" value={`Rs. ${pendingFees.toFixed(2)}`} subtitle="Pending Due" icon={DollarSign} colorClass="bg-green" />
                <MetricCard title="Assignments" value={data.assignments.length} subtitle="Pending Tasks" icon={BookOpen} colorClass="bg-orange" />
                <MetricCard title="Latest Result" value={latestResult} subtitle={data.results?.[0] ? `Grade ${data.results[0].grade}` : 'No exams yet'} icon={Award} colorClass="bg-purple" />
              </div>

              <div className="grid-bento">
                <div className="glass-card">
                  <div className="table-header" style={{ padding: "0 0 1rem 0", marginBottom: "1rem" }}>
                    <span>Pending Assignments</span>
                    <button className="btn-ghost" onClick={() => setActiveTab("assignments")} style={{ fontSize: "0.85rem", padding: "0" }}>View All ›</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {data.assignments.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", padding: "1rem", textAlign: "center" }}>No pending assignments. Great job!</p>
                    ) : (
                      data.assignments.slice(0, 3).map((a: any) => (
                        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                          <div>
                             <h4 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{a.title}</h4>
                             <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Due: {a.dueDate}</p>
                          </div>
                          <button className="btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>Submit</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="glass-card">
                  <div className="table-header" style={{ padding: "0 0 1rem 0", marginBottom: "1rem" }}>
                    <span>Fee Overview</span>
                    <button className="btn-ghost" onClick={() => setActiveTab("fees")} style={{ fontSize: "0.85rem", padding: "0" }}>View Detail ›</button>
                  </div>
                  <div style={{ padding: "1.5rem", borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                     <div>
                       <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Pending Fees</p>
                       <h3 style={{ fontSize: "1.8rem", color: "var(--success)" }}>Rs. {pendingFees.toFixed(2)}</h3>
                     </div>
                     <button className="btn-primary" style={{ width: "100%", backgroundColor: "var(--success)" }}>Pay Now</button>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", marginTop: "1rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Paid Fees</span>
                    <span style={{ fontWeight: 600 }}>
                      Rs. {data.fees.reduce((acc: number, f: any) => acc + parseFloat(f.paidFee), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {["assignments", "attendance", "fees"].includes(activeTab) && (
             <div className="table-container animate-fade-in">
               <div className="table-header">
                 <span>{menuItems.find(m => m.id === activeTab)?.label}</span>
               </div>
               <table>
                  {activeTab === "assignments" && (
                    <>
                      <thead><tr><th>Title & Description</th><th>Due Date</th></tr></thead>
                      <tbody>
                        {data.assignments.length === 0 ? <tr><td colSpan={2} style={{ textAlign: "center", padding: "3rem" }}>No assignments posted.</td></tr> : 
                          data.assignments.map((a: any) => (
                            <tr key={a.id}>
                              <td>
                                <strong style={{ fontWeight: 600 }}>{a.title}</strong>
                                <p style={{fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem"}}>{a.description}</p>
                              </td>
                              <td><span className="badge badge-warning">{a.dueDate}</span></td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </>
                  )}

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

          {activeTab === "results" && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: "2.5rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Academic Performance</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Detailed breakdown of your assessments and subject-wise marks.</p>
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

          {activeTab === "profile" && (
            <div className="glass-card animate-fade-in" style={{ maxWidth: "500px", margin: "2rem auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                 <div className="avatar" style={{ width: 64, height: 64 }}>
                   <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff&size=64`} alt="user" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                 </div>
                 <div>
                   <h3 style={{ fontSize: "1.25rem" }}>Update Login Credentials</h3>
                   <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Update your password or visual name</p>
                 </div>
              </div>
              
              <div style={{ padding: "1.5rem", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)", marginBottom: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "0.5rem", color: "var(--primary)", fontWeight: 600 }}>Official School Record</div>
                <div><span style={{color: "var(--text-muted)", fontSize: "0.8rem", display: "block"}}>Roll Number</span><span style={{fontWeight: 500}}>{user.rollNumber || "N/A"}</span></div>
                <div><span style={{color: "var(--text-muted)", fontSize: "0.8rem", display: "block"}}>Class & Section</span><span style={{fontWeight: 500}}>{data?.student?.class || "N/A"} - {user.section || "N/A"}</span></div>
                <div><span style={{color: "var(--text-muted)", fontSize: "0.8rem", display: "block"}}>Father's Name</span><span style={{fontWeight: 500}}>{user.fatherName || "N/A"}</span></div>
                <div><span style={{color: "var(--text-muted)", fontSize: "0.8rem", display: "block"}}>Mother's Name</span><span style={{fontWeight: 500}}>{user.motherName || "N/A"}</span></div>
                <div><span style={{color: "var(--text-muted)", fontSize: "0.8rem", display: "block"}}>Date of Birth</span><span style={{fontWeight: 500}}>{user.dob || "N/A"} ({user.gender || "N/A"})</span></div>
                <div><span style={{color: "var(--text-muted)", fontSize: "0.8rem", display: "block"}}>Admission Date</span><span style={{fontWeight: 500}}>{user.admissionDate || "N/A"}</span></div>
                <div><span style={{color: "var(--text-muted)", fontSize: "0.8rem", display: "block"}}>Student Contact</span><span style={{fontWeight: 500}}>{user.contactNumber || "N/A"}</span></div>
                <div><span style={{color: "var(--text-muted)", fontSize: "0.8rem", display: "block"}}>Parent Contact</span><span style={{fontWeight: 500}}>{user.parentContactNumber || "N/A"}</span></div>
                <div style={{ gridColumn: "1 / -1" }}><span style={{color: "var(--text-muted)", fontSize: "0.8rem", display: "block"}}>Residential Address</span><span style={{fontWeight: 500}}>{user.address || "N/A"}</span></div>
              </div>
              
              {profileMsg && (
                <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--success)", borderRadius: "8px", color: "var(--success)" }}>
                  {profileMsg}
                </div>
              )}
              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Full Name</label>
                  <input required value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>New Password (leave blank to keep current)</label>
                  <input type="password" placeholder="New Password" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }}>Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === "timetable" && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Weekly Timetable</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Class schedule for {data?.student?.class}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {timetable.length === 0 ? (
                  <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <CalendarDays size={48} style={{ opacity: 0.2, margin: "0 auto 1rem auto" }} />
                    <p>No timetable available for your class yet.</p>
                  </div>
                ) : (
                  timetable.map((dayData, idx) => (
                     <div key={idx} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                       <div style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border)", fontWeight: 600, color: "var(--primary)" }}>
                         {dayData.day}
                       </div>
                       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", backgroundColor: "var(--border)" }}>
                         {dayData.schedule.map((session: any, i: number) => (
                            <div key={i} style={{ backgroundColor: "var(--bg-dark)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                               <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{session.time}</span>
                               <strong style={{ fontSize: "1.1rem" }}>{session.subject}</strong>
                               <span style={{ fontSize: "0.9rem", color: "var(--primary)" }}>{session.teacher}</span>
                            </div>
                         ))}
                       </div>
                     </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "notices" && (
            <NoticesView role="STUDENT" />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
