"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import MetricCard from "@/app/components/MetricCard";
import NoticesView from "@/app/components/NoticesView";
import { Users, ClipboardList, DollarSign, LayoutDashboard, UserCheck, BookOpen, Clock, Activity, GraduationCap, Shield, Bell, Presentation, Award, ChevronRight, ChevronDown, Printer } from "lucide-react";

interface User {
  id: number;
  name: string;
  role: string;
  classId?: number;
  assignedClassId?: number;
  childId?: number;
  // Expanded Student Fields
  fatherName?: string;
  motherName?: string;
  gender?: string;
  dob?: string;
  section?: string;
  rollNumber?: string;
  contactNumber?: string;
  parentContactNumber?: string;
  address?: string;
  admissionDate?: string;
  feeStatus?: string;
  category?: string;
  subject?: string;
  child?: { name: string; rollNumber: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]); // For teachers, parents, admins
  const [students, setStudents] = useState<User[]>([]); // Specifically for students in a class
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("reports");
  
  const [showModal, setShowModal] = useState(false); // For Teachers, Parents, Admins
  const [showStudentModal, setShowStudentModal] = useState(false); // Exclusively for Students
  const [showClassModal, setShowClassModal] = useState(false);
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  const [userForm, setUserForm] = useState({ name: "", password: "", role: "TEACHER", assignedClassId: "", childId: "" });
  const [studentForm, setStudentForm] = useState({ 
    name: "", password: "", classId: "", section: "Sec-A", rollNumber: "",
    fatherName: "", motherName: "", gender: "Male", dob: "", 
    contactNumber: "", parentContactNumber: "", address: "", 
    admissionDate: "", feeStatus: "Paid", category: "Normal"
  });
  
  const [classForm, setClassForm] = useState({ name: "", teacherId: "" });
  const [teachers, setTeachers] = useState<any[]>([]);

  // Fee Management States
  const [feeFilters, setFeeFilters] = useState({ classId: "", sectionId: "", month: "", year: "2026", status: "", studentSearch: "" });
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showBulkFeeModal, setShowBulkFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ 
    studentId: "", classId: "", sectionId: "", month: "", year: "2026", 
    originalFee: "", discount: "0", finalFee: "", paidFee: "", status: "Unpaid", remarks: "" 
  });
  const [bulkFeeForm, setBulkFeeForm] = useState({ classId: "", sectionId: "", month: "", year: "2026", originalFee: "" });
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState(""); // For search in modal
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [showVoucherPreview, setShowVoucherPreview] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCustomSection, setIsCustomSection] = useState(false);

  const menuItems: MenuItem[] = [
    { id: "reports", label: "Dashboard", icon: LayoutDashboard },
    { id: "classes", label: "Classes & Students", icon: Presentation },
    { id: "teachers", label: "Teachers", icon: BookOpen },
    { id: "parents", label: "Parents", icon: Users },
    { id: "admins", label: "Admins", icon: Shield },
    { id: "attendance", label: "All Attendance", icon: ClipboardList },
    { id: "marks", label: "Marks Management", icon: Award },
    { id: "notices", label: "Announcements", icon: Bell },
    { id: "fees", label: "Fee Management", icon: DollarSign },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (["teachers", "parents", "admins"].includes(activeTab)) {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
           const allMap: Record<string, string> = { "teachers": "TEACHER", "parents": "PARENT", "admins": "ADMIN" };
           const data = await res.json();
           setUsers(data.filter((u: User) => u.role === allMap[activeTab]));
        }
      } else if (activeTab === "attendance") {
        const res = await fetch("/api/admin/attendance");
        if (res.ok) setAttendances(await res.json());
      } else if (activeTab === "classes") {
        const [clsRes, tchRes, stuRes] = await Promise.all([
          fetch("/api/admin/classes"),
          fetch("/api/admin/users?role=TEACHER"),
          fetch("/api/admin/users?role=STUDENT")
        ]);
        if (clsRes.ok) setClassesData(await clsRes.json());
        if (tchRes.ok) setTeachers(await tchRes.json());
        if (stuRes.ok) setStudents(await stuRes.json());
      } else if (activeTab === "fees") {
        const { classId, sectionId, month, year, status, studentSearch } = feeFilters;
        const query = new URLSearchParams({
          ...(classId && { classId }),
          ...(sectionId && { sectionId }),
          ...(month && { month }),
          ...(year && { year }),
          ...(status && { status }),
          ...(studentSearch && { studentSearch })
        }).toString();
        const [feeRes, stuRes, clsRes] = await Promise.all([
          fetch(`/api/admin/fees?${query}`),
          fetch("/api/admin/users?role=STUDENT"),
          fetch("/api/admin/classes")
        ]);
        if (feeRes.ok) setFees(await feeRes.json());
        if (stuRes.ok) setStudents(await stuRes.json());
        if (clsRes.ok) setClassesData(await clsRes.json());
      } else if (activeTab === "marks") {
        const res = await fetch("/api/teacher/marks");
        if (res.ok) setMarks(await res.json());
      } else if (activeTab === "reports") {
        const res = await fetch("/api/admin/reports");
        if (res.ok) setReportData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [activeTab, currentUser, feeFilters]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = editingUserId !== null;
      const bodyData = isEdit ? { ...userForm, id: editingUserId } : userForm;

      const res = await fetch("/api/admin/users", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingUserId(null);
        setUserForm({ name: "", password: "", role: "TEACHER", assignedClassId: "", childId: "" });
        fetchData();
      } else {
        alert(`Failed to ${isEdit ? "update" : "create"} user.`);
      }
    } catch (error) {
      console.error(error);
      alert("Error saving user.");
    }
  };

  const handleEditUser = (u: User) => {
    setEditingUserId(u.id);
    setUserForm({
      name: u.name,
      password: "",
      role: u.role,
      assignedClassId: u.assignedClassId?.toString() || "",
      childId: u.childId?.toString() || ""
    });
    setShowModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    const contactPattern = /^[0-9]{11}$/;
    if (!contactPattern.test(studentForm.contactNumber)) {
      errors.contactNumber = "Contact number must be exactly 11 digits (numeric only)";
    }
    if (!contactPattern.test(studentForm.parentContactNumber)) {
      errors.parentContactNumber = "Parent contact number must be exactly 11 digits (numeric only)";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const isEdit = editingUserId !== null;
      // Force role to STUDENT always
      const bodyData = { 
        ...studentForm, 
        role: "STUDENT",
        id: isEdit ? editingUserId : undefined 
      };

      const res = await fetch("/api/admin/users", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        setShowStudentModal(false);
        setEditingUserId(null);
        setFormErrors({});
        setIsCustomSection(false);
        setStudentForm({ 
          name: "", password: "", classId: "", section: "Sec-A", rollNumber: "",
          fatherName: "", motherName: "", gender: "Male", dob: "", 
          contactNumber: "", parentContactNumber: "", address: "", 
          admissionDate: "", feeStatus: "Paid", category: "Normal"
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${isEdit ? "update" : "create"} student.`);
      }
    } catch (error) {
      console.error(error);
      alert("Error saving student.");
    }
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = editingFeeId !== null;
      const res = await fetch("/api/admin/fees", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...feeForm, id: editingFeeId } : { ...feeForm, mode: 'single' })
      });
      if (res.ok) {
        setShowFeeModal(false);
        setEditingFeeId(null);
        setFeeForm({ 
          studentId: "", classId: "", sectionId: "", month: "", year: "2026", 
          originalFee: "", discount: "0", finalFee: "", paidFee: "", status: "Unpaid", remarks: "" 
        });
        setStudentSearchTerm("");
        fetchData();
      } else {
        alert("Failed to save fee record.");
      }
    } catch (err) { console.error(err); }
  };

  const handlePrintVoucher = (fee: any) => {
    setSelectedVoucher(fee);
    setShowVoucherPreview(true);
  };

  const handleGeneratePDF = () => {
    window.print();
  };

  const handleEditFee = (f: any) => {
    setEditingFeeId(f.id);
    setFeeForm({
      studentId: f.studentId.toString(),
      classId: f.classId.toString(),
      sectionId: f.sectionId,
      month: f.month,
      year: f.year || "2026",
      originalFee: f.originalFee?.toString() || f.totalFee?.toString() || "",
      discount: f.discount?.toString() || "0",
      finalFee: f.finalFee?.toString() || f.totalFee?.toString() || "",
      paidFee: f.paidFee.toString(),
      status: f.status,
      remarks: f.remarks || ""
    });
    setShowFeeModal(true);
  };

  const handleEditStudent = (u: User) => {
    setEditingUserId(u.id);
    const standardSections = ["Sec-A", "Sec-B", "Sec-C"];
    const isCustom = u.section && !standardSections.includes(u.section);
    setIsCustomSection(!!isCustom);
    setFormErrors({});
    setStudentForm({
      name: u.name || "",
      password: "",
      classId: u.classId?.toString() || "",
      section: u.section || "Sec-A",
      rollNumber: u.rollNumber || "",
      fatherName: u.fatherName || "",
      motherName: u.motherName || "",
      gender: u.gender || "Male",
      dob: u.dob || "",
      contactNumber: u.contactNumber || "",
      parentContactNumber: u.parentContactNumber || "",
      address: u.address || "",
      admissionDate: u.admissionDate || "",
      feeStatus: u.feeStatus || "Paid",
      category: u.category || "Normal"
    });
    setShowStudentModal(true);
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm(`Are you sure you want to delete user #${id}?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classForm)
      });
      if (res.ok) {
        setShowClassModal(false);
        setClassForm({ name: "", teacherId: "" });
        fetchData();
      } else {
        alert("Failed to create class.");
      }
    } catch (error) {
       console.error(error);
    }
  };

  const handleDeleteFee = async (id: number) => {
    if (!confirm('Delete this fee record?')) return;
    try {
      const res = await fetch(`/api/admin/fees?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete fee record.");
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveBulkFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bulkFeeForm, mode: 'bulk' })
      });
      if (res.ok) {
        setShowBulkFeeModal(false);
        setBulkFeeForm({ classId: "", sectionId: "", month: "", year: "2026", originalFee: "" });
        fetchData();
      } else {
        alert("Failed to generate bulk fees.");
      }
    } catch (err) { console.error(err); }
  };

  if (!currentUser) return null;

  return (
    <DashboardLayout 
      roleTitle="SMS Admin" 
      userName={currentUser.name} 
      menuItems={menuItems} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      modals={
        <>
          {/* Bulk Fee Modal */}
          {showBulkFeeModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110 }}>
              <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "450px", backgroundColor: "var(--bg-dark)" }}>
                <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Generate Monthly Fees</h2>
                <form onSubmit={handleSaveBulkFee} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Class</label>
                      <select required value={bulkFeeForm.classId} onChange={e => setBulkFeeForm({...bulkFeeForm, classId: e.target.value})}>
                        <option value="">-- Class --</option>
                        {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Section</label>
                      <select required value={bulkFeeForm.sectionId} onChange={e => setBulkFeeForm({...bulkFeeForm, sectionId: e.target.value})}>
                        <option value="">-- Section --</option>
                        <option>Sec-A</option><option>Sec-B</option><option>Sec-C</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Month</label>
                      <select required value={bulkFeeForm.month} onChange={e => setBulkFeeForm({...bulkFeeForm, month: e.target.value})}>
                        <option value="">-- Month --</option>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Year</label>
                      <input required type="number" value={bulkFeeForm.year} onChange={e => setBulkFeeForm({...bulkFeeForm, year: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Monthly Tuition Fee (Original Rs.)</label>
                    <input required type="number" placeholder="5000" value={bulkFeeForm.originalFee} onChange={e => setBulkFeeForm({...bulkFeeForm, originalFee: e.target.value})} />
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>* Army students will automatically get 50% discount.</p>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button type="button" className="btn-ghost" onClick={() => setShowBulkFeeModal(false)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)" }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Generate Records</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add/Edit User Modal */}
          {showModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
              <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "450px", backgroundColor: "var(--bg-dark)" }}>
                <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>{editingUserId ? "Edit User Record" : "Create New User"}</h2>
                <form onSubmit={handleSaveUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>User Role</label>
                    <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                      <option value="TEACHER">Teacher</option>
                      <option value="PARENT">Parent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Full Name</label>
                    <input required placeholder="Jane Doe" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{editingUserId ? "New Password (Optional)" : "Initial Password"}</label>
                    <input type="password" placeholder="Pass123!" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} {...(!editingUserId ? { required: true } : {})} />
                  </div>

                  {userForm.role === "TEACHER" && (
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Assigned Class ID</label>
                      <input type="number" placeholder="e.g. 1" value={userForm.assignedClassId} onChange={e => setUserForm({...userForm, assignedClassId: e.target.value})} />
                    </div>
                  )}

                  {userForm.role === "PARENT" && (
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Child's Student ID</label>
                      <input type="number" required placeholder="e.g. 101" value={userForm.childId} onChange={e => setUserForm({...userForm, childId: e.target.value})} />
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button type="button" className="btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)" }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingUserId ? "Save Changes" : "Create Account"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Exclusively Expanded Student Form Modal - No Role Definition */}
          {showStudentModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, overflowY: "auto", padding: "2rem 0" }}>
              <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "700px", backgroundColor: "var(--bg-dark)", margin: "auto" }}>
                <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)" }}>{editingUserId ? "Edit Student Record" : "Enroll New Student"}</h2>
                   <span className="badge badge-success">Role Locked: Student</span>
                </div>
                
                <form onSubmit={handleSaveStudent} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  
                  {/* Column 1: Core Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Roll Number / Reg #</label>
                      <input required placeholder="e.g. 1042" value={studentForm.rollNumber} onChange={e => setStudentForm({...studentForm, rollNumber: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Full Name</label>
                      <input required placeholder="Student Name" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Gender</label>
                        <select value={studentForm.gender} onChange={e => setStudentForm({...studentForm, gender: e.target.value})}>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>D.O.B</label>
                        <input type="date" value={studentForm.dob} onChange={e => setStudentForm({...studentForm, dob: e.target.value})} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Class ID</label>
                        <input disabled type="number" value={studentForm.classId} style={{ opacity: 0.5 }} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Section / Room</label>
                        <select 
                          value={isCustomSection ? "custom" : studentForm.section}
                          onChange={e => {
                            if (e.target.value === "custom") {
                              setIsCustomSection(true);
                              setStudentForm({...studentForm, section: ""});
                            } else {
                              setIsCustomSection(false);
                              setStudentForm({...studentForm, section: e.target.value});
                            }
                          }}
                        >
                          <option value="Sec-A">Sec-A</option>
                          <option value="Sec-B">Sec-B</option>
                          <option value="Sec-C">Sec-C</option>
                          <option value="custom">Add More Option...</option>
                        </select>
                        {isCustomSection && (
                          <input 
                            required
                            placeholder="Type custom section" 
                            value={studentForm.section} 
                            onChange={e => setStudentForm({...studentForm, section: e.target.value})} 
                            style={{ marginTop: "0.5rem" }}
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Admission Date</label>
                      <input type="date" value={studentForm.admissionDate} onChange={e => setStudentForm({...studentForm, admissionDate: e.target.value})} />
                    </div>
                  </div>

                  {/* Column 2: Family & Admin Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                     <div>
                      <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Father's Name</label>
                      <input placeholder="Father Name" value={studentForm.fatherName} onChange={e => setStudentForm({...studentForm, fatherName: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Mother's Name</label>
                      <input placeholder="Mother Name" value={studentForm.motherName} onChange={e => setStudentForm({...studentForm, motherName: e.target.value})} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Student Contact</label>
                        <input 
                          placeholder="03001234567" 
                          value={studentForm.contactNumber} 
                          onChange={e => setStudentForm({...studentForm, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 11)})} 
                          style={{ borderColor: formErrors.contactNumber ? "var(--danger)" : "" }}
                        />
                        {formErrors.contactNumber && <p style={{ color: "var(--danger)", fontSize: "0.7rem", marginTop: "0.2rem" }}>{formErrors.contactNumber}</p>}
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Parent Contact</label>
                        <input 
                          placeholder="03007654321" 
                          value={studentForm.parentContactNumber} 
                          onChange={e => setStudentForm({...studentForm, parentContactNumber: e.target.value.replace(/\D/g, '').slice(0, 11)})} 
                          style={{ borderColor: formErrors.parentContactNumber ? "var(--danger)" : "" }}
                        />
                        {formErrors.parentContactNumber && <p style={{ color: "var(--danger)", fontSize: "0.7rem", marginTop: "0.2rem" }}>{formErrors.parentContactNumber}</p>}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Residential Address</label>
                      <input placeholder="Full Address" value={studentForm.address} onChange={e => setStudentForm({...studentForm, address: e.target.value})} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Fee Status</label>
                        <select value={studentForm.feeStatus} onChange={e => setStudentForm({...studentForm, feeStatus: e.target.value})}>
                          <option>Paid</option>
                          <option>Pending</option>
                          <option>Overdue</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Student Category</label>
                        <select value={studentForm.category} onChange={e => setStudentForm({...studentForm, category: e.target.value})}>
                          <option>Normal</option>
                          <option>Army</option>
                          <option>Scholarship</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>{editingUserId ? "Reset Password" : "Login Password"}</label>
                        <input type="password" placeholder="Pass123!" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} {...(!editingUserId ? { required: true } : {})} />
                      </div>
                    </div>
                  </div>

                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: "1rem", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                    <button type="button" className="btn-ghost" onClick={() => setShowStudentModal(false)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)" }}>Cancel Enrollment</button>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingUserId ? "Update Student File" : "Enroll & Save"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Create Class Modal */}
          {showClassModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
              <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "450px", backgroundColor: "var(--bg-dark)" }}>
                <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Create New Class</h2>
                <form onSubmit={handleSaveClass} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Class & Section Name</label>
                    <input required placeholder="e.g. Class 10 - Section A" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Assign a Teacher (Optional)</label>
                    <select value={classForm.teacherId} onChange={e => setClassForm({...classForm, teacherId: e.target.value})}>
                      <option value="">-- No Primary Teacher --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>#{t.id} - {t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button type="button" className="btn-ghost" onClick={() => setShowClassModal(false)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)" }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Class</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Fee Modal */}
          {showFeeModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110 }}>
              <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "500px", backgroundColor: "var(--bg-dark)" }}>
                <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>{editingFeeId ? "Update Fee Record" : "Add Individual Fee"}</h2>
                <form onSubmit={handleSaveFee} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {!editingFeeId && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Class</label>
                          <select required value={feeForm.classId} onChange={e => setFeeForm({...feeForm, classId: e.target.value, studentId: ""})}>
                            <option value="">-- Class --</option>
                            {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Section</label>
                          <select required value={feeForm.sectionId} onChange={e => setFeeForm({...feeForm, sectionId: e.target.value, studentId: ""})}>
                            <option value="">-- Section --</option>
                            <option>Sec-A</option><option>Sec-B</option><option>Sec-C</option>
                          </select>
                        </div>
                      </div>

                      {feeForm.classId && feeForm.sectionId && (
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Search & Select Student</label>
                          <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                            <input 
                              type="text" 
                              placeholder="Search by name, roll, father..." 
                              value={studentSearchTerm}
                              onChange={e => setStudentSearchTerm(e.target.value)}
                              style={{ fontSize: "0.9rem", padding: "0.6rem" }}
                            />
                          </div>
                          <select 
                            required 
                            value={feeForm.studentId} 
                            onChange={e => setFeeForm({...feeForm, studentId: e.target.value})}
                            style={{ height: "150px" }}
                            multiple={false}
                            size={5}
                          >
                            <option value="" disabled>-- Choose Student --</option>
                            {students
                              .filter(s => 
                                s.classId?.toString() === feeForm.classId && 
                                s.section === feeForm.sectionId &&
                                (studentSearchTerm === "" || 
                                 s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
                                 s.rollNumber?.toString().includes(studentSearchTerm) ||
                                 s.fatherName?.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                              )
                              .map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.rollNumber} | {s.name} | Father: {s.fatherName}
                                </option>
                              ))
                            }
                          </select>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                            {students.filter(s => s.classId?.toString() === feeForm.classId && s.section === feeForm.sectionId).length} students found in this section.
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Month</label>
                      <select required value={feeForm.month} onChange={e => setFeeForm({...feeForm, month: e.target.value})}>
                        <option value="">Select Month</option>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Year</label>
                      <input required type="number" value={feeForm.year} onChange={e => setFeeForm({...feeForm, year: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Original Fee (Rs.)</label>
                      <input 
                        required 
                        type="number" 
                        placeholder="5000" 
                        value={feeForm.originalFee} 
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const student = students.find(s => s.id.toString() === feeForm.studentId);
                          const disc = student?.category === 'Army' ? val * 0.5 : parseFloat(feeForm.discount) || 0;
                          setFeeForm({...feeForm, originalFee: e.target.value, discount: disc.toString(), finalFee: (val - disc).toString()});
                        }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Discount (Rs.)</label>
                      <input 
                        required 
                        type="number" 
                        value={feeForm.discount} 
                        onChange={e => {
                          const disc = parseFloat(e.target.value) || 0;
                          const original = parseFloat(feeForm.originalFee) || 0;
                          setFeeForm({...feeForm, discount: e.target.value, finalFee: (original - disc).toString()});
                        }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Final Fee (Rs.)</label>
                      <input readOnly type="number" value={feeForm.finalFee} style={{ opacity: 0.7, backgroundColor: "var(--surface)" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Paid Amount (Rs.)</label>
                      <input 
                        required 
                        type="number" 
                        value={feeForm.paidFee} 
                        onChange={e => {
                          const paid = parseFloat(e.target.value) || 0;
                          const final = parseFloat(feeForm.finalFee) || 0;
                          let status = "Unpaid";
                          if (paid >= final && final > 0) status = "Paid";
                          else if (paid > 0) status = "Partial";
                          setFeeForm({...feeForm, paidFee: e.target.value, status});
                        }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Status</label>
                      <select value={feeForm.status} onChange={e => setFeeForm({...feeForm, status: e.target.value})}>
                        <option>Unpaid</option>
                        <option>Partial</option>
                        <option>Paid</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Remarks</label>
                      <input placeholder="Optional note" value={feeForm.remarks} onChange={e => setFeeForm({...feeForm, remarks: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button type="button" className="btn-ghost" onClick={() => setShowFeeModal(false)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)" }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingFeeId ? "Update Record" : "Save Fee Record"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Voucher Preview Modal */}
          {showVoucherPreview && selectedVoucher && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, overflowY: "auto", padding: "2rem" }}>
              <div style={{ width: "100%", maxWidth: "1000px" }}>
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between" }} className="no-print">
                  <h2 style={{ color: "white" }}>Fee Voucher Preview</h2>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button className="btn-primary" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Printer size={18} /> Print Now
                    </button>
                    <button className="btn-ghost" onClick={() => setShowVoucherPreview(false)} style={{ color: "white" }}>Close Preview</button>
                  </div>
                </div>

                <div id="printable-voucher" style={{ backgroundColor: "white", padding: "0.5in", borderRadius: "4px", color: "black", minHeight: "80vh" }}>
                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                      {["School Copy", "Student Copy", "Bank Copy"].map((copyType, idx) => (
                        <div key={idx} style={{ border: "1px dashed #ccc", padding: "1rem", fontSize: "11px", position: "relative" }}>
                          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>ELITE PUBLIC SCHOOL</h3>
                            <p style={{ margin: 0, color: "#666" }}>Excellence in Education</p>
                            <div style={{ marginTop: "0.5rem", border: "1px solid black", display: "inline-block", padding: "2px 8px", fontWeight: "bold" }}>
                              {copyType}
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                            <div>
                              <span style={{ color: "#777" }}>Voucher #:</span> 
                              <div><strong>EPS-{selectedVoucher.id}</strong></div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ color: "#777" }}>Date:</span>
                              <div><strong>{new Date().toLocaleDateString()}</strong></div>
                            </div>
                          </div>

                          <div style={{ borderTop: "1px solid #eee", paddingTop: "0.5rem", marginBottom: "1rem" }}>
                            <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Student:</span> <strong>{selectedVoucher.studentName}</strong></div>
                            <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Roll No:</span> <strong>{selectedVoucher.rollNumber}</strong></div>
                            <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Father:</span> <strong>{selectedVoucher.fatherName}</strong></div>
                            <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Class:</span> <strong>{selectedVoucher.className} ({selectedVoucher.sectionId})</strong></div>
                            <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Category:</span> <strong>{selectedVoucher.category || 'Normal'}</strong></div>
                          </div>

                          <div style={{ borderTop: "2px solid #333", borderBottom: "2px solid #333", padding: "0.5rem 0", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                               <span>Tuition Fee ({selectedVoucher.month})</span>
                               <span>Rs. {selectedVoucher.originalFee}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", color: "#666" }}>
                               <span>Discount Applied</span>
                               <span>-Rs. {selectedVoucher.discount || 0}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontWeight: "bold", borderTop: "1px solid #ccc", paddingTop: "0.5rem" }}>
                               <span>PAYABLE AMOUNT</span>
                               <span>Rs. {selectedVoucher.finalFee}</span>
                            </div>
                          </div>

                          <p style={{ fontSize: "9px", color: "#888", marginBottom: "1.5rem" }}>
                            * Please pay by 10th of {selectedVoucher.month}. 
                            {selectedVoucher.remarks && <><br/>* Note: {selectedVoucher.remarks}</>}
                          </p>

                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
                             <div style={{ borderTop: "1px solid #333", width: "80px", textAlign: "center", paddingTop: "4px" }}>Cashier</div>
                             <div style={{ borderTop: "1px solid #333", width: "80px", textAlign: "center", paddingTop: "4px" }}>Officer</div>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <style>{`
                @media print {
                  .no-print, .sidebar, .header, .metric-card, .data-table, .tabs { display: none !important; }
                  body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
                  #printable-voucher { display: block !important; padding: 0 !important; width: 100% !important; border: none !important; }
                  .glass-card { background: transparent !important; border: none !important; box-shadow: none !important; }
                }
              `}</style>
            </div>
          )}

        </>
      }
    >
      
      {["teachers", "parents", "admins"].includes(activeTab) && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
          <button className="btn-primary" onClick={() => {
            setEditingUserId(null);
            const allMap: Record<string, string> = { "teachers": "TEACHER", "parents": "PARENT", "admins": "ADMIN" };
            setUserForm({ name: "", password: "", role: allMap[activeTab] || "TEACHER", assignedClassId: "", childId: "" });
            setShowModal(true);
          }}>+ Add {menuItems.find(m => m.id === activeTab)?.label?.slice(0, -1)}</button>
        </div>
      )}

      {activeTab === "classes" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
          <button className="btn-primary" onClick={() => setShowClassModal(true)}>+ Create Class</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "2rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Activity size={18} className="animate-pulse" /> Loading records...
        </div>
      ) : (
        <>
          {/* REPORTS DASHBOARD */}
          {activeTab === "reports" && reportData && (
            <div className="animate-fade-in">
              <div className="grid-metrics">
                <MetricCard title="Total Students" value={reportData.users.students} icon={Users} colorClass="bg-blue" />
                <MetricCard title="Total Teachers" value={reportData.users.teachers} icon={UserCheck} colorClass="bg-green" />
                <MetricCard title="Paid Fees" value={`Rs. ${reportData.fees.paid.toFixed(0)}`} subtitle={`Rs. ${reportData.fees.unpaid.toFixed(0)} unpaid pending`} icon={DollarSign} colorClass="bg-orange" />
                <MetricCard title="Attendance Today" value={`${reportData.attendance.present} Present`} subtitle={`out of ${reportData.attendance.total} total records`} icon={Clock} colorClass="bg-purple" />
              </div>
              
              <div className="grid-bento">
                <div className="glass-card">
                  <div className="table-header" style={{ padding: "0 0 1rem 0", marginBottom: "1rem" }}>
                    <span>System Overview</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Total Parent Accounts</span>
                      <span style={{ fontWeight: 600 }}>{reportData.users.parents}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Active Classes</span>
                      <span style={{ fontWeight: 600 }}>{reportData.academics.classes}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Results Published</span>
                      <span style={{ fontWeight: 600 }}>{reportData.academics.results}</span>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
                   <BookOpen size={48} color="var(--primary)" style={{ opacity: 0.5 }} />
                   <h3 style={{ fontSize: "1.25rem", color: "var(--text-main)" }}>School System Health</h3>
                   <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>All core modules are fully operational. Database connections are stable.</p>
                   <span className="badge badge-success mt-2">All Systems Operational</span>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "reports" && !["marks", "fees", "notices"].includes(activeTab) && (
            <div className="table-container animate-fade-in">
              <div className="table-header">
                <span>{menuItems.find(m => m.id === activeTab)?.label} List</span>
              </div>
              <table>
                {/* USERS TABLE */}
                {["teachers", "parents", "admins"].includes(activeTab) && (
                  <>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Tags</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>No records found.</td></tr>
                      ) : (
                        users.map((u, index) => (
                          <tr key={u.id}>
                            <td style={{ color: "var(--text-muted)" }}>#{index + 1}</td>
                            <td style={{ fontWeight: 500 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div className="avatar" style={{ width: 32, height: 32 }}>
                                  <img src={`https://ui-avatars.com/api/?name=${u.name}&background=1e293b&color=fff`} alt={u.name} style={{ width: "100%", height: "100%" }} />
                                </div>
                                {u.name}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${u.role === 'ADMIN' ? 'badge-blue' : u.role === 'TEACHER' ? 'badge-purple' : u.role === 'STUDENT' ? 'badge-success' : 'badge-warning'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                              {u.role === 'TEACHER' && u.assignedClassId ? `Class ${u.assignedClassId}` : ""}
                              {u.role === 'ADMIN' ? "System Wide" : ""}
                              {u.role === 'PARENT' ? `Child: ${u.child?.name || 'N/A'} (${u.child?.rollNumber || 'N/A'})` : ""}
                            </td>
                            <td>
                               {u.id !== 1 && (
                                  <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button onClick={() => handleEditUser(u)} className="btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "var(--primary)" }}>Edit</button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "var(--danger)" }}>Delete</button>
                                  </div>
                               )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </>
                )}

                {/* ATTENDANCE TABLE */}
                {activeTab === "attendance" && (
                  <>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Student (Roll #)</th>
                        <th>Class</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendances.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: "center", padding: "3rem" }}>No attendance records found.</td></tr>
                      ) : (
                        attendances.map(a => (
                          <tr key={a.id}>
                            <td style={{ color: "var(--text-muted)" }}>{a.date}</td>
                            <td style={{ fontWeight: 500 }}>{a.studentName} <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>#{a.rollNumber}</span></td>
                            <td><span className="badge badge-blue">{a.student?.class?.name || "N/A"}</span></td>
                            <td>
                              <span className={`badge ${a.status === 'P' ? 'badge-success' : 'badge-danger'}`}>
                                {a.status === 'P' ? 'Present' : 'Absent'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </>
                )}

                {/* CLASSES TABLE */}
                {activeTab === "classes" && (
                  <>
                    <thead>
                      <tr>
                        <th>Class ID</th>
                        <th>Class & Section</th>
                        <th>Assigned Teacher</th>
                        <th>Total Enrolled</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classesData.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>No classes found.</td></tr>
                      ) : (
                        classesData.map(c => (
                          <React.Fragment key={c.id}>
                            <tr style={{ cursor: "pointer", backgroundColor: expandedClassId === c.id ? "rgba(255,255,255,0.02)" : "transparent" }} onClick={() => setExpandedClassId(expandedClassId === c.id ? null : c.id)}>
                              <td style={{ color: "var(--text-muted)", width: "80px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <span style={{ color: "var(--primary)" }}>
                                    {expandedClassId === c.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                  </span>
                                  #{c.id}
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{c.name}</td>
                              <td>
                                <span className={`badge ${c.teacherId ? 'badge-purple' : 'badge-warning'}`}>
                                  {c.teacherName}
                                </span>
                              </td>
                              <td>{c.studentCount} Students</td>
                              <td>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }} className="btn-ghost" style={{ color: "var(--danger)", padding: "0.4rem" }}>Delete</button>
                              </td>
                            </tr>
                            {/* NESTED STUDENT TABLE */}
                            {expandedClassId === c.id && (
                              <tr style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                                <td colSpan={5} style={{ padding: "1.5rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                     <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)" }}>Detailed Student Roster ({c.name})</h3>
                                     <button className="btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }} onClick={() => {
                                        setEditingUserId(null);
                                        setStudentForm({ 
                                          name: "", password: "", classId: c.id.toString(), section: "", rollNumber: "",
                                          fatherName: "", motherName: "", gender: "Male", dob: "", 
                                          contactNumber: "", parentContactNumber: "", address: "", 
                                          admissionDate: "", feeStatus: "Paid"
                                        });
                                        setShowStudentModal(true);
                                     }}>+ Enroll Student Here</button>
                                  </div>
                                  <table style={{ backgroundColor: "var(--bg-dark)", borderRadius: "8px", overflow: "hidden" }}>
                                    <thead>
                                      <tr>
                                        <th>Roll #</th>
                                        <th>Student Name</th>
                                        <th>Father's Name</th>
                                        <th>Contact</th>
                                        <th>Fee Status</th>
                                        <th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {students.filter(s => s.classId === c.id).length === 0 ? (
                                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No students enrolled in this class yet.</td></tr>
                                      ) : (
                                        students.filter(s => s.classId === c.id).map((s, idx) => (
                                          <tr key={s.id}>
                                            <td style={{ color: "var(--text-muted)" }}>{s.rollNumber || "N/A"}</td>
                                            <td style={{ fontWeight: 500 }}>{s.name}</td>
                                            <td>{s.fatherName || "-"}</td>
                                            <td>{s.contactNumber || s.parentContactNumber || "-"}</td>
                                            <td>
                                              <span className={`badge ${s.feeStatus === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                                                {s.feeStatus || 'Pending'}
                                              </span>
                                            </td>
                                            <td>
                                               <div style={{ display: "flex", gap: "0.5rem" }}>
                                                 <button onClick={() => handleEditStudent(s)} className="btn-secondary" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", color: "var(--primary)" }}>Edit</button>
                                                 <button onClick={() => handleDeleteUser(s.id)} className="btn-secondary" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", color: "var(--danger)" }}>Drop</button>
                                               </div>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </>
                 )}
               </table>
             </div>
           )}

           {/* MARKS TABLE */}
           {activeTab === "marks" && (
             <div className="table-container animate-fade-in">
               <div className="table-header"><span>Marks Management List</span></div>
               <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Type</th>
                        <th>Score</th>
                        <th>Grade</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem" }}>No marks records found.</td></tr>
                      ) : (
                        marks.map(m => (
                          <tr key={m.id}>
                            <td style={{ color: "var(--text-muted)" }}>#{m.id}</td>
                            <td style={{ fontWeight: 500 }}>{m.studentName} <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>#{m.rollNumber}</span></td>
                            <td>{m.className}</td>
                            <td><span className="badge badge-purple">{m.subject}</span></td>
                            <td><span className="badge badge-blue">{m.assessmentType}</span></td>
                            <td><strong>{m.obtained} / {m.total}</strong> ({m.percentage.toFixed(1)}%)</td>
                            <td>
                              <span className={`badge ${['A+','A'].includes(m.grade) ? 'badge-success' : ['B','C'].includes(m.grade) ? 'badge-warning' : 'badge-danger'}`}>
                                {m.grade}
                              </span>
                            </td>
                            <td>
                               <button onClick={async () => {
                                  if (confirm('Delete this marks record?')) {
                                    await fetch(`/api/teacher/marks?id=${m.id}`, { method: 'DELETE' });
                                    fetchData();
                                  }
                               }} className="btn-ghost" style={{ color: "var(--danger)", padding: "0.2rem" }}>Delete</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
              </table>
             </div>
            )}

            {/* FEES MANAGEMENT - Separated from main table for hydration safety */}
            {activeTab === "fees" && (
              <div style={{ padding: "0.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                  {[
                    { label: "Total Students", value: students.length, color: "var(--primary)" },
                    { label: "Paid Records", value: fees.filter(f => f.status === 'Paid').length, color: "var(--success)" },
                    { label: "Partial", value: fees.filter(f => f.status === 'Partial').length, color: "var(--warning)" },
                    { label: "Unpaid", value: fees.filter(f => f.status === 'Unpaid').length, color: "var(--danger)" },
                     { label: "Collected", value: `Rs. ${fees.reduce((sum, f) => sum + (Number(f.paidFee) || 0), 0).toLocaleString()}`, color: "var(--accent-purple)" },
                     { label: "Remaining", value: `Rs. ${fees.reduce((sum, f) => sum + (Number(f.remainingFee) || 0), 0).toLocaleString()}`, color: "var(--accent-pink)" }
                  ].map((card, i) => (
                    <div key={i} className="metric-card" style={{ padding: "1.25rem", borderLeft: `4px solid ${card.color}` }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{card.label}</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{card.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: "1rem", flex: 1, flexWrap: "wrap" }}>
                    <select 
                      style={{ width: "150px" }} 
                      value={feeFilters.classId} 
                      onChange={e => setFeeFilters({...feeFilters, classId: e.target.value})}
                    >
                      <option value="">All Classes</option>
                      {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select 
                      style={{ width: "130px" }} 
                      value={feeFilters.sectionId} 
                      onChange={e => setFeeFilters({...feeFilters, sectionId: e.target.value})}
                    >
                      <option value="">All Sections</option>
                      <option>Sec-A</option><option>Sec-B</option><option>Sec-C</option>
                    </select>
                    <select 
                      style={{ width: "130px" }} 
                      value={feeFilters.month} 
                      onChange={e => setFeeFilters({...feeFilters, month: e.target.value})}
                    >
                      <option value="">All Months</option>
                      {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select 
                      style={{ width: "110px" }} 
                      value={feeFilters.year || ''} 
                      onChange={e => setFeeFilters({...feeFilters, year: e.target.value})}
                    >
                      <option value="">All Years</option>
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select 
                      style={{ width: "120px" }} 
                      value={feeFilters.status} 
                      onChange={e => setFeeFilters({...feeFilters, status: e.target.value})}
                    >
                      <option value="">All Status</option>
                      <option>Paid</option><option>Unpaid</option><option>Partial</option>
                    </select>
                    <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                      <input 
                        type="text" 
                        placeholder="Search student by name, roll #..." 
                        style={{ width: "100%", paddingRight: "2.5rem" }}
                        value={feeFilters.studentSearch || ''}
                        onChange={e => setFeeFilters({...feeFilters, studentSearch: e.target.value})}
                      />
                      <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>🔍</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn-ghost" onClick={() => setShowBulkFeeModal(true)} style={{ border: "1px solid var(--primary-light)" }}>Bulk Generate</button>
                    <button className="btn-ghost" onClick={handleGeneratePDF} style={{ border: "1px solid var(--primary-light)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Printer size={16} /> Print Report
                    </button>
                    <button className="btn-primary" onClick={() => { setEditingFeeId(null); setFeeForm({ studentId: "", classId: "", sectionId: "", month: "", year: "2026", originalFee: "", discount: "0", finalFee: "", paidFee: "", status: "Unpaid", remarks: "" }); setShowFeeModal(true); }}>+ Add Fee</button>
                  </div>
                </div>

                <div className="print-header">
                  <h1 style={{ color: "black", marginBottom: "0.5rem" }}>School Fee Records Report</h1>
                  <p style={{ color: "black", fontSize: "1.1rem" }}>
                    {feeFilters.classId ? `Class: ${classesData.find(c => c.id.toString() === feeFilters.classId)?.name}` : "All Classes"} | 
                    {feeFilters.sectionId ? `Section: ${feeFilters.sectionId}` : "All Sections"} | 
                    Period: {feeFilters.month || "Any Month"} {feeFilters.year || "Any Year"}
                  </p>
                  <hr style={{ margin: "1rem 0", borderColor: "#eee" }} />
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Details</th>
                        <th>Category</th>
                        <th>Period</th>
                        <th>Original</th>
                        <th>Discount</th>
                        <th>Final</th>
                        <th>Paid</th>
                        <th>Dues</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.length === 0 ? (
                        <tr><td colSpan={13} style={{ textAlign: "center", padding: "3rem" }}>No fee records matching filters.</td></tr>
                      ) : (
                        fees.map(f => (
                          <tr key={f.id}>
                            <td>#{f.id}</td>
                            <td>
                              <div>{f.studentName || 'Unknown'}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Roll: {f.rollNumber}</div>
                            </td>
                            <td>
                               <span className={`badge ${f.category === 'Army' ? 'badge-primary' : 'badge-ghost'}`}>
                                 {f.category || 'Normal'}
                               </span>
                            </td>
                            <td>{f.month} {f.year}</td>
                            <td>Rs. {f.originalFee || f.totalFee || 0}</td>
                            <td style={{ color: "var(--danger)" }}>-Rs. {f.discount || 0}</td>
                            <td><strong>Rs. {f.finalFee || f.totalFee || 0}</strong></td>
                            <td>Rs. {f.paidFee || 0}</td>
                            <td style={{ color: (f.finalFee || f.totalFee || 0) - (f.paidFee || 0) > 0 ? "var(--danger)" : "var(--success)" }}>
                              Rs. {(f.finalFee || f.totalFee || 0) - (f.paidFee || 0)}
                            </td>
                            <td>
                              <span className={`badge ${f.status === 'Paid' ? 'badge-success' : f.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                                {f.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button onClick={() => handleEditFee(f)} className="btn-ghost" style={{ padding: "4px" }} title="Edit"><Activity size={16} /></button>
                                <button onClick={() => handlePrintVoucher(f)} className="btn-ghost" style={{ padding: "4px" }} title="Print Voucher"><Printer size={16} /></button>
                                <button onClick={async () => {
                                  if (confirm('Delete this fee record?')) {
                                    await fetch(`/api/admin/fees?id=${f.id}`, { method: 'DELETE' });
                                    fetchData();
                                  }
                                }} className="btn-ghost" style={{ padding: "4px", color: "var(--danger)" }} title="Delete"><Shield size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {activeTab === "notices" && (
            <NoticesView role="ADMIN" />
          )}
        </>
      )}
      <style jsx global>{`
        @media print {
          nav, aside, header, .sidebar, .topbar, .btn-primary, .btn-ghost, .btn-secondary, select, input, .metric-card, .table-header button, .actions-column, th:last-child, td:last-child {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .glass-card {
            background: white !important;
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .table-responsive {
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            color: black !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            text-align: left !important;
            color: black !important;
          }
          .badge {
            background: #eee !important;
            color: black !important;
            border: 1px solid #ccc !important;
          }
          h2 {
            margin-top: 0 !important;
            color: black !important;
          }
          /* Show a report title only during print */
          .print-header {
            display: block !important;
            margin-bottom: 2rem;
            text-align: center;
          }
        }
        .print-header { display: none; }
      `}</style>
    </DashboardLayout>
  );
}

