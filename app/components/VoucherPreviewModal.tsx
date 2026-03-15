"use client";

import React from "react";
import { Printer, X } from "lucide-react";
import Modal from "./Modal";

interface VoucherPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: any;
}

export default function VoucherPreviewModal({ isOpen, onClose, voucher }: VoucherPreviewModalProps) {
  if (!isOpen || !voucher) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fee Voucher Preview" maxWidth="1000px">
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }} className="no-print">
        <button className="btn-primary" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Printer size={18} /> Print Now
        </button>
        <button className="btn-ghost" onClick={onClose}>Close</button>
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
                  <div><strong>EPS-{voucher.id}</strong></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#777" }}>Date:</span>
                  <div><strong>{new Date().toLocaleDateString()}</strong></div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #eee", paddingTop: "0.5rem", marginBottom: "1rem" }}>
                <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Student:</span> <strong>{voucher.studentName}</strong></div>
                <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Roll No:</span> <strong>{voucher.rollNumber}</strong></div>
                <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Father:</span> <strong>{voucher.fatherName}</strong></div>
                <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Class:</span> <strong>{voucher.className} ({voucher.sectionId})</strong></div>
                <div style={{ marginBottom: "0.4rem" }}><span style={{ color: "#777" }}>Category:</span> <strong>{voucher.category || 'Normal'}</strong></div>
              </div>

              <div style={{ borderTop: "2px solid #333", borderBottom: "2px solid #333", padding: "0.5rem 0", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span>Tuition Fee ({voucher.month})</span>
                  <span>Rs. {voucher.originalFee || voucher.totalFee || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", color: "#666" }}>
                  <span>Discount Applied</span>
                  <span>-Rs. {voucher.discount || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontWeight: "bold", borderTop: "1px solid #ccc", paddingTop: "0.5rem" }}>
                  <span>PAYABLE AMOUNT</span>
                  <span>Rs. {voucher.finalFee || voucher.totalFee || 0}</span>
                </div>
              </div>

              <p style={{ fontSize: "9px", color: "#888", marginBottom: "1.5rem" }}>
                * Please pay by 10th of {voucher.month}. 
                {voucher.remarks && <><br/>* Note: {voucher.remarks}</>}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
                <div style={{ borderTop: "1px solid #333", width: "80px", textAlign: "center", paddingTop: "4px" }}>Cashier</div>
                <div style={{ borderTop: "1px solid #333", width: "80px", textAlign: "center", paddingTop: "4px" }}>Officer</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print, .sidebar, .header, .metric-card, .data-table, .tabs, .dashboard-layout-nav, .dashboard-layout-header { 
            display: none !important; 
          }
          body { 
            background: white !important; 
            color: black !important; 
            padding: 0 !important; 
            margin: 0 !important; 
          }
          #printable-voucher { 
            display: block !important; 
            padding: 0 !important; 
            width: 100% !important; 
            border: none !important; 
            box-shadow: none !important;
          }
          .glass-card { 
            background: transparent !important; 
            border: none !important; 
            box-shadow: none !important; 
          }
        }
      `}</style>
    </Modal>
  );
}
