import { NextRequest, NextResponse } from "next/server";
import { readPipeData, writePipeData, generateId, readData } from "@/lib/fileHandler";
import path from "path";

const DOCUMENTS_FILE = path.join(process.cwd(), "data", "documents.txt");
const USERS_FILE = path.join(process.cwd(), "data", "users.txt");

const DOCUMENTS_HEADERS = ["DocumentID", "StudentID", "DocumentType", "Title", "FileReference", "UploadDate", "Remarks"];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");

    let documents = await readPipeData<any>(DOCUMENTS_FILE, DOCUMENTS_HEADERS);
    const users = await readData<any>(USERS_FILE);
    const students = users.filter((u: any) => u.role === "STUDENT");

    // Join with student data
    documents = documents.map(doc => {
      const student = students.find(s => s.id.toString() === doc.StudentID.toString());
      return {
        ...doc,
        studentName: student?.name || "Unknown",
        rollNumber: student?.rollNumber || "N/A",
        classId: student?.classId,
        section: student?.section
      };
    });

    if (studentId) {
      documents = documents.filter(doc => doc.StudentID.toString() === studentId);
    }

    if (classId) {
      documents = documents.filter(doc => doc.classId?.toString() === classId);
    }

    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { StudentID, DocumentType, Title, FileReference, Remarks } = body;

    if (!StudentID || !DocumentType || !Title || !FileReference) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const documents = await readPipeData<any>(DOCUMENTS_FILE, DOCUMENTS_HEADERS);
    const newId = await generateId(DOCUMENTS_FILE, DOCUMENTS_HEADERS);

    const newDocument = {
      DocumentID: newId,
      StudentID,
      DocumentType,
      Title,
      FileReference,
      UploadDate: new Date().toISOString().split('T')[0],
      Remarks: Remarks || ""
    };

    await writePipeData(DOCUMENTS_FILE, [...documents, newDocument], DOCUMENTS_HEADERS);
    return NextResponse.json(newDocument);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { DocumentID, DocumentType, Title, FileReference, Remarks } = body;

    if (!DocumentID) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    let documents = await readPipeData<any>(DOCUMENTS_FILE, DOCUMENTS_HEADERS);
    const index = documents.findIndex(doc => doc.DocumentID.toString() === DocumentID.toString());

    if (index === -1) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    documents[index] = {
      ...documents[index],
      DocumentType: DocumentType || documents[index].DocumentType,
      Title: Title || documents[index].Title,
      FileReference: FileReference || documents[index].FileReference,
      Remarks: Remarks !== undefined ? Remarks : documents[index].Remarks
    };

    await writePipeData(DOCUMENTS_FILE, documents, DOCUMENTS_HEADERS);
    return NextResponse.json(documents[index]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    let documents = await readPipeData<any>(DOCUMENTS_FILE, DOCUMENTS_HEADERS);
    const initialLength = documents.length;
    documents = documents.filter(doc => doc.DocumentID.toString() !== id.toString());

    if (documents.length === initialLength) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await writePipeData(DOCUMENTS_FILE, documents, DOCUMENTS_HEADERS);
    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
