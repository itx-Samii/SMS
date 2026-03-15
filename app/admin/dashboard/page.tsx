"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout, { MenuItem } from "@/app/components/DashboardLayout";
import MetricCard from "@/app/components/MetricCard";
import NoticesView from "@/app/components/NoticesView";
import { Users, ClipboardList, DollarSign, LayoutDashboard, UserCheck, BookOpen, Clock, Activity, GraduationCap, Shield, Bell, Presentation, Award, ChevronRight, ChevronDown, Printer, MessageSquare, Calendar, Book, BarChart3, Trophy, Files } from "lucide-react";
import ComposeMessageModal from "@/app/components/ComposeMessageModal";
import PerformanceAnalytics from "@/app/components/PerformanceAnalytics";
import ClassPerformanceAnalytics from "@/app/components/ClassPerformanceAnalytics";
import SchoolPerformanceAnalytics from "@/app/components/SchoolPerformanceAnalytics";
import AdminUserModal from "@/app/components/AdminUserModal";
import StudentEnrollmentModal from "@/app/components/StudentEnrollmentModal";
import ClassModal from "@/app/components/ClassModal";
import { SingleFeeModal, BulkFeeModal } from "@/app/components/FeeManagementModals";
import VoucherPreviewModal from "@/app/components/VoucherPreviewModal";
import TimetableModal from "@/app/components/TimetableModal";
import MeritList from "@/app/components/MeritList";
import StudentDocuments from "@/app/components/StudentDocuments";

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
  scholarshipGrade?: string; // New field
  totalFee?: string; // New field
  paidFee?: string;  // New field
  remainingFee?: string; // New field
  subject?: string;
  child?: { name: string; rollNumber: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showComposeModal, setShowComposeModal] = useState(false);
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
  
  const [timetable, setTimetable] = useState<any[]>([]);
  const [timetableFilters, setTimetableFilters] = useState({ classId: "", sectionId: "" });
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [editingTimetableEntry, setEditingTimetableEntry] = useState<any | null>(null);
  
  const [schoolPerformance, setSchoolPerformance] = useState<any>(null);
  const [classPerformance, setClassPerformance] = useState<any>(null);
  const [selectedAnalyticsClassId, setSelectedAnalyticsClassId] = useState("");
  
  const [showModal, setShowModal] = useState(false); // For Teachers, Parents, Admins
  const [showStudentModal, setShowStudentModal] = useState(false); // Exclusively for Students
  const [showClassModal, setShowClassModal] = useState(false);
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  const [userForm, setUserForm] = useState({ name: "", password: "", role: "TEACHER", assignedClassId: "", childId: "" });
  const [studentForm, setStudentForm] = useState({ 
    name: "", password: "", classId: "", section: "Sec-A", rollNumber: "",
    fatherName: "", motherName: "", gender: "Male", dob: "", 
    contactNumber: "", parentContactNumber: "", address: "", 
    admissionDate: "", feeStatus: "Paid", category: "Normal", scholarshipGrade: "A",
    totalFee: "0", paidFee: "0", remainingFee: "0"
  });
  
  const [classForm, setClassForm] = useState({ name: "", teacherId: "" });
  const [teachers, setTeachers] = useState<any[]>([]);

  // Fee Management States
  const [feeFilters, setFeeFilters] = useState({ classId: "", sectionId: "", month: "", year: "2026", status: "", studentSearch: "" });
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showBulkFeeModal, setShowBulkFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ 
    studentId: "", classId: "", sectionId: "", month: "", year: "2026", 
    originalFee: "", discount: "0", finalFee: "", paidFee: "", status: "Pending", remarks: "" 
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
    { id: "merit", label: "Merit List", icon: Trophy },
    { id: "analytics", label: "School Analytics", icon: BarChart3 },
    { id: "timetable", label: "Timetable", icon: Clock },
    { id: "documents", label: "Documents", icon: Files },
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
      } else if (activeTab === "documents") {
        // Data handled within component
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
      } else if (activeTab === "timetable") {
        const { classId } = timetableFilters;
        const query = classId ? `?classId=${classId}` : "";
        const [ttRes, clsRes, tchRes] = await Promise.all([
          fetch(`/api/timetable${query}`),
          fetch("/api/admin/classes"),
          fetch("/api/admin/users?role=TEACHER")
        ]);
        if (ttRes.ok) setTimetable(await ttRes.json());
        if (clsRes.ok) setClassesData(await clsRes.json());
        if (tchRes.ok) setTeachers(await tchRes.json());
      } else if (activeTab === "analytics") {
        fetchSchoolPerformance();
        const clsRes = await fetch("/api/admin/classes");
        if (clsRes.ok) setClassesData(await clsRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolPerformance = async () => {
    try {
      const res = await fetch("/api/analytics/school");
      if (res.ok) setSchoolPerformance(await res.json());
    } catch { console.error("Failed to fetch school performance"); }
  };

  const fetchClassPerformance = async (classId: string) => {
    try {
      const res = await fetch(`/api/analytics/class?classId=${classId}`);
      if (res.ok) setClassPerformance(await res.json());
    } catch { console.error("Failed to fetch class performance"); }
  };

  useEffect(() => {
    if (selectedAnalyticsClassId) {
      fetchClassPerformance(selectedAnalyticsClassId);
    } else {
      setClassPerformance(null);
    }
  }, [selectedAnalyticsClassId]);


  const handleSendMessage = async (payload: any) => {
    try {
      const isMessage = payload.type === 'message';
      const endpoint = isMessage ? "/api/messages" : "/api/notifications";
      
      const body = { ...payload };
      delete body.type; // Remove local 'type' field before sending to API

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        // DashboardLayout will automatically fetch new items via its polling
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to send", payload.type);
      return false;
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
      router.push(`/${user.role.toLowerCase()}/dashboard`);
      return;
    }
    setCurrentUser(user);
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [activeTab, currentUser, feeFilters]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Role-specific validation
    if (userForm.role === "PARENT" && !userForm.childId) {
      alert("Please provide the Child's Student ID.");
      return;
    }
    if (userForm.role === "TEACHER" && !userForm.assignedClassId) {
      alert("Please provide the Assigned Class ID.");
      return;
    }

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
        const data = await res.json();
        alert(data.error || `Failed to ${isEdit ? "update" : "create"} user.`);
      }
    } catch (error) {
      console.error(error);
      alert("Error saving user.");
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timetable entry?")) return;
    try {
      const res = await fetch(`/api/timetable?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch { console.error("Failed to delete timetable entry"); }
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
          admissionDate: "", feeStatus: "Paid", category: "Normal", scholarshipGrade: "A",
          totalFee: "0", paidFee: "0", remainingFee: "0"
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
          originalFee: "", discount: "0", finalFee: "", paidFee: "", status: "Pending", remarks: "" 
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
      category: u.category || "Normal",
      scholarshipGrade: u.scholarshipGrade || "A",
      totalFee: u.totalFee?.toString() || "0",
      paidFee: u.paidFee?.toString() || "0",
      remainingFee: u.remainingFee?.toString() || "0"
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

  const handleDeleteClass = async (id: number) => {
    if (!confirm(`Permanently delete Class #${id}? This will NOT delete students, but they will be unassigned.`)) return;
    try {
      const res = await fetch(`/api/admin/classes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete class.");
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
      roleTitle="ADMIN PORTAL" 
      userName={currentUser?.name}
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      modals={
        <>
          <BulkFeeModal 
            isOpen={showBulkFeeModal} 
            onClose={() => setShowBulkFeeModal(false)} 
            onSuccess={fetchData} 
            classes={classesData} 
          />

          <AdminUserModal 
            isOpen={showModal} 
            onClose={() => { setShowModal(false); setEditingUserId(null); }} 
            onSuccess={fetchData} 
            editingUser={editingUserId ? users.find(u => u.id === editingUserId) : null} 
          />

          <StudentEnrollmentModal 
            isOpen={showStudentModal} 
            onClose={() => { setShowStudentModal(false); setEditingUserId(null); }} 
            onSuccess={fetchData} 
            editingStudent={editingUserId ? students.find(u => u.id === editingUserId) : null}
            classId={studentForm.classId}
          />

          <ClassModal 
            isOpen={showClassModal} 
            onClose={() => setShowClassModal(false)} 
            onSuccess={fetchData} 
            teachers={teachers} 
          />

          <SingleFeeModal 
            isOpen={showFeeModal} 
            onClose={() => { setShowFeeModal(false); setEditingFeeId(null); }} 
            onSuccess={fetchData} 
            editingFee={editingFeeId ? fees.find(f => f.id === editingFeeId) : null}
            students={students}
            classes={classesData}
          />

          <VoucherPreviewModal 
            isOpen={showVoucherPreview} 
            onClose={() => setShowVoucherPreview(false)} 
            voucher={selectedVoucher} 
          />

          <TimetableModal 
            isOpen={showTimetableModal}
            onClose={() => { setShowTimetableModal(false); setEditingTimetableEntry(null); }}
            onSuccess={fetchData}
            editingEntry={editingTimetableEntry}
            classes={classesData}
            teachers={teachers}
          />
        </>
      }
    >
      <>
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

      {activeTab === "timetable" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem" }}>
             <select 
               className="form-input" 
               style={{ width: "180px" }}
               value={timetableFilters.classId}
               onChange={e => setTimetableFilters({...timetableFilters, classId: e.target.value})}
             >
               <option value="">All Classes</option>
               {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             <select 
               className="form-input" 
               style={{ width: "180px" }}
               value={timetableFilters.sectionId}
               onChange={e => setTimetableFilters({...timetableFilters, sectionId: e.target.value})}
             >
               <option value="">All Sections</option>
               <option value="Sec-A">Sec-A</option>
               <option value="Sec-B">Sec-B</option>
               <option value="Sec-C">Sec-C</option>
               <option value="Sec-D">Sec-D</option>
             </select>
          </div>
          <button className="btn-primary" onClick={() => setShowTimetableModal(true)}>+ Add Timetable Entry</button>
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
                                        setFormErrors({});
                                        setIsCustomSection(false);
                                        setStudentForm({ 
                                          name: "", password: "", classId: c.id.toString(), section: "Sec-A", rollNumber: "",
                                          fatherName: "", motherName: "", gender: "Male", dob: "", 
                                          contactNumber: "", parentContactNumber: "", address: "", 
                                          admissionDate: "", feeStatus: "Paid", category: "Normal", scholarshipGrade: "A",
                                          totalFee: "0", paidFee: "0", remainingFee: "0"
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
            {activeTab === "merit" && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>School Merit List</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Generate competitive rankings across classes and terms</p>
              </div>
              <MeritList classes={classesData} subjects={marks.reduce((acc: any[], m: any) => {
                if (!acc.find(s => s.name === m.subject)) acc.push({ id: acc.length, name: m.subject });
                return acc;
              }, [])} />
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Performance Analytics</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <select 
                     className="form-input" 
                     style={{ width: '250px', margin: 0 }}
                     value={selectedAnalyticsClassId}
                     onChange={(e) => setSelectedAnalyticsClassId(e.target.value)}
                   >
                     <option value="">-- All Classes (School Overview) --</option>
                     {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
              </div>

              {selectedAnalyticsClassId ? (
                classPerformance && (
                  <ClassPerformanceAnalytics 
                    data={classPerformance} 
                    title={`Class Performance: ${classesData.find(c => c.id.toString() === selectedAnalyticsClassId)?.name}`}
                    subtitle="Detailed metrics for the selected class"
                  />
                )
              ) : (
                schoolPerformance && <SchoolPerformanceAnalytics data={schoolPerformance} />
              )}
            </div>
          )}

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
                      <option>Paid</option><option>Pending</option><option>Partial</option>
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
                    <button className="btn-primary" onClick={() => { setEditingFeeId(null); setFeeForm({ studentId: "", classId: "", sectionId: "", month: "", year: "2026", originalFee: "", discount: "0", finalFee: "", paidFee: "", status: "Pending", remarks: "" }); setShowFeeModal(true); }}>+ Add Fee</button>
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

          {activeTab === "documents" && (
            <StudentDocuments />
          )}

          {activeTab === "timetable" && (
            <div className="animate-fade-in">
              <div className="grid-metrics" style={{ marginBottom: "2rem" }}>
                <MetricCard title="Total Classes" value={classesData.length} icon={Users} colorClass="bg-blue" />
                <MetricCard title="Total Subjects" value={[...new Set(timetable.map(t => t.subject))].length} icon={Book} colorClass="bg-green" />
                <MetricCard title="Today's Periods" value={timetable.filter(t => t.day === new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())).length} icon={Clock} colorClass="bg-orange" />
                <MetricCard title="Active Teachers" value={teachers.length} icon={Shield} colorClass="bg-purple" />
              </div>

              <div className="glass-card">
                <div className="table-header">
                  <span>Weekly Schedule {timetableFilters.classId ? ` - Class ${timetableFilters.classId}` : ''}</span>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Time Slot</th>
                        <th>Room</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetable.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}>No schedule found. Add some entries.</td></tr>
                      ) : (
                        timetable
                          .filter(t => !timetableFilters.sectionId || t.sectionId === timetableFilters.sectionId)
                          .sort((a, b) => {
                            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                            if (a.day !== b.day) return days.indexOf(a.day) - days.indexOf(b.day);
                            return a.startTime.localeCompare(b.startTime);
                          })
                          .map(t => (
                            <tr key={t.id}>
                              <td style={{ fontWeight: 600 }}>{t.day}</td>
                              <td><span className="badge badge-blue">{t.subject}</span></td>
                              <td>{teachers.find(th => th.id === t.teacherId)?.name || `Teacher #${t.teacherId}`}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <Clock size={14} style={{ color: "var(--primary)" }} />
                                  {t.startTime} - {t.endTime}
                                </div>
                              </td>
                              <td><span style={{ color: "var(--text-muted)" }}>{t.room}</span></td>
                              <td><span className="badge badge-success">{t.status}</span></td>
                              <td>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button onClick={() => { setEditingTimetableEntry(t); setShowTimetableModal(true); }} className="btn-ghost" style={{ padding: "4px" }}>Edit</button>
                                  <button onClick={() => handleDeleteTimetable(t.id)} className="btn-ghost" style={{ padding: "4px", color: "var(--danger)" }}>Delete</button>
                                </div>
                              </td>
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
      <ComposeMessageModal 
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSend={handleSendMessage}
        sender={{ id: currentUser?.id, name: currentUser?.name, role: currentUser?.role }}
      />
      </>
    </DashboardLayout>
  );
}
