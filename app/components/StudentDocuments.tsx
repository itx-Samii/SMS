"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Image as ImageIcon, 
  File as FileIcon, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Eye, 
  Grid, 
  List,
  ChevronRight,
  User,
  Calendar
} from "lucide-react";

interface Document {
  DocumentID: string;
  StudentID: string;
  DocumentType: string;
  Title: string;
  FileReference: string;
  UploadDate: string;
  Remarks: string;
  studentName?: string;
  rollNumber?: string;
  classId?: string;
  section?: string;
}

const DOCUMENT_TYPES = [
  "B-Form",
  "Birth Certificate",
  "Previous Result",
  "Student Photo",
  "Transfer Certificate",
  "Other"
];

export default function StudentDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    StudentID: "",
    DocumentType: "B-Form",
    Title: "",
    FileReference: "",
    Remarks: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [docsRes, classesRes, usersRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/admin/classes"),
        fetch("/api/admin/users") // Assuming this gets all users
      ]);

      if (docsRes.ok) setDocuments(await docsRes.json());
      if (classesRes.ok) setClasses(await classesRes.json());
      if (usersRes.ok) {
        const users = await usersRes.json();
        setStudents(users.filter((u: any) => u.role === "STUDENT"));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingDoc ? "PUT" : "POST";
    const body = editingDoc ? { ...formData, DocumentID: editingDoc.DocumentID } : formData;

    try {
      const res = await fetch("/api/documents", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingDoc(null);
        setFormData({ StudentID: "", DocumentType: "B-Form", Title: "", FileReference: "", Remarks: "" });
        fetchInitialData();
      }
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document reference?")) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchInitialData();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const openEdit = (doc: Document) => {
    setEditingDoc(doc);
    setFormData({
      StudentID: doc.StudentID,
      DocumentType: doc.DocumentType,
      Title: doc.Title,
      FileReference: doc.FileReference,
      Remarks: doc.Remarks
    });
    setIsModalOpen(true);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.Title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === "" || doc.classId?.toString() === selectedClass;
    const matchesType = selectedType === "" || doc.DocumentType === selectedType;
    return matchesSearch && matchesClass && matchesType;
  });

  const getFileIcon = (ref: string) => {
    const ext = ref.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <ImageIcon className="text-blue-400" />;
    if (ext === 'pdf') return <FileText className="text-red-400" />;
    return <FileIcon className="text-gray-400" />;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-sm text-gray-400">Manage student identity and academic document references</p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => { setEditingDoc(null); setFormData({ StudentID: "", DocumentType: "B-Form", Title: "", FileReference: "", Remarks: "" }); setIsModalOpen(true); }}
        >
          <Plus size={18} /> Add Document
        </button>
      </div>

      {/* Filters & Controls */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by student name, roll number, or title..." 
            className="w-full pl-10 h-10 bg-black/20 border-gray-700 rounded-lg focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            className="h-10 bg-black/20 border-gray-700 rounded-lg px-3"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name} - {c.section}</option>
            ))}
          </select>
          <select 
            className="h-10 bg-black/20 border-gray-700 rounded-lg px-3"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Types</option>
            {DOCUMENT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="flex bg-black/20 rounded-lg p-1 border border-gray-700">
            <button 
              className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-primary text-white' : 'text-gray-500'}`}
              onClick={() => setViewMode('card')}
            >
              <Grid size={18} />
            </button>
            <button 
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-primary text-white' : 'text-gray-500'}`}
              onClick={() => setViewMode('table')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-card py-20 text-center text-gray-500 flex flex-col items-center gap-4">
          <FileIcon size={64} className="opacity-10" />
          <p>No documents found matching your criteria</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div key={doc.DocumentID} className="glass-card group hover:border-primary/50 transition-all p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-black/30 rounded-xl group-hover:scale-110 transition-transform">
                    {getFileIcon(doc.FileReference)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{doc.Title}</h3>
                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">{doc.DocumentType}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(doc)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(doc.DocumentID)} className="p-2 hover:bg-white/10 rounded-lg text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User size={14} className="text-primary" />
                  <span className="font-medium text-gray-200">{doc.studentName}</span>
                  <span className="text-xs bg-white/5 px-2 py-0.5 rounded">Roll: {doc.rollNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Uploaded: {doc.UploadDate}</span>
                  </div>
                  <button className="text-primary hover:underline flex items-center gap-1 font-medium">
                    View File <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Document ID</th>
                <th>Student</th>
                <th>Roll No</th>
                <th>Document Type</th>
                <th>Title</th>
                <th>Reference</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.DocumentID}>
                  <td><span className="text-primary font-mono font-bold">#{doc.DocumentID}</span></td>
                  <td><div className="font-medium">{doc.studentName}</div></td>
                  <td><span className="badge badge-blue">{doc.rollNumber}</span></td>
                  <td><span className="badge badge-purple">{doc.DocumentType}</span></td>
                  <td>{doc.Title}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc.FileReference)}
                      <span className="text-xs text-gray-400 truncate max-w-[120px]">{doc.FileReference}</span>
                    </div>
                  </td>
                  <td>{doc.UploadDate}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(doc)} className="p-1.5 hover:bg-white/10 rounded-lg text-blue-400" title="Edit"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(doc.DocumentID)} className="p-1.5 hover:bg-white/10 rounded-lg text-red-400" title="Delete"><Trash2 size={16} /></button>
                      <button className="p-1.5 hover:bg-white/10 rounded-lg text-primary" title="View"><Eye size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg p-6 animate-scale-in border-primary/20 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              {editingDoc ? <Edit className="text-primary" /> : <Plus className="text-primary" />}
              {editingDoc ? "Edit Document Reference" : "Add Student Document"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Select Student</label>
                  <select 
                    required 
                    className="w-full bg-black/30 border-gray-700 rounded-lg h-11 px-3 focus:border-primary"
                    value={formData.StudentID}
                    onChange={(e) => setFormData({ ...formData, StudentID: e.target.value })}
                  >
                    <option value="">Select a student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id.toString()}>{s.name} ({s.rollNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Document Type</label>
                  <select 
                    required 
                    className="w-full bg-black/30 border-gray-700 rounded-lg h-11 px-3 focus:border-primary"
                    value={formData.DocumentType}
                    onChange={(e) => setFormData({ ...formData, DocumentType: e.target.value })}
                  >
                    {DOCUMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Document Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Matric Certificate" 
                    required 
                    className="w-full bg-black/30 border-gray-700 rounded-lg h-11 px-3 focus:border-primary"
                    value={formData.Title}
                    onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">File Name / Path / Reference</label>
                  <input 
                    type="text" 
                    placeholder="e.g. alex_photo.jpg or doc_123.pdf" 
                    required 
                    className="w-full bg-black/30 border-gray-700 rounded-lg h-11 px-3 focus:border-primary"
                    value={formData.FileReference}
                    onChange={(e) => setFormData({ ...formData, FileReference: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Remarks (Optional)</label>
                  <textarea 
                    rows={2}
                    className="w-full bg-black/30 border-gray-700 rounded-lg p-3 focus:border-primary"
                    value={formData.Remarks}
                    onChange={(e) => setFormData({ ...formData, Remarks: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Cancel</button>
                <button type="submit" className="btn-primary px-8">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
