"use client";

import React from 'react';
import { BarChart, Users, Award, TrendingDown, Target, CheckCircle } from "lucide-react";
import MetricCard from "./MetricCard";

interface ClassPerformanceData {
  summary: {
    classAverage: number;
    passRate: number;
    topStudents: { id: number; name: string; percentage: number }[];
    strugglingStudents: { id: number; name: string; percentage: number }[];
  };
  subjectAverages: { subject: string; average: number }[];
  studentsPerformance: { id: number; name: string; percentage: number }[];
}

interface ClassPerformanceAnalyticsProps {
  data: ClassPerformanceData;
  title: string;
  subtitle: string;
}

export default function ClassPerformanceAnalytics({ data, title, subtitle }: ClassPerformanceAnalyticsProps) {
  if (!data || !data.studentsPerformance.length) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No class performance data available for analysis.</p>
      </div>
    );
  }

  const { summary, subjectAverages, studentsPerformance } = data;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{title}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{subtitle}</p>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <MetricCard 
          title="Class Average" 
          value={`${summary.classAverage}%`} 
          icon={Target} 
          colorClass="bg-blue" 
        />
        <MetricCard 
          title="Pass Rate" 
          value={`${summary.passRate}%`} 
          icon={CheckCircle} 
          colorClass="bg-green" 
        />
        <MetricCard 
          title="Top Performer" 
          value={summary.topStudents[0]?.name || 'N/A'} 
          subtitle={`${summary.topStudents[0]?.percentage || 0}%`}
          icon={Award} 
          colorClass="bg-purple" 
        />
        <MetricCard 
          title="Total Students" 
          value={studentsPerformance.length} 
          icon={Users} 
          colorClass="bg-orange" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Subject Averages Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <BarChart size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Subject-wise Averages (%)</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '2rem', padding: '0 1rem' }}>
            {subjectAverages.map((s, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative', width: '100%', height: '240px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      width: '100%', 
                      height: `${s.average}%`, 
                      background: 'var(--primary)',
                      opacity: 0.8
                    }} 
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, fontSize: '0.8rem', opacity: 0.5 }}>
                    {s.average}%
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                  {s.subject}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Student Ranking */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <TrendingDown size={20} style={{ color: 'var(--danger)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Attention Required</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {summary.strugglingStudents.length > 0 ? (
               summary.strugglingStudents.map((s, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--danger-rgb), 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(var(--danger-rgb), 0.1)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <div style={{ width: '40px', height: '40px', background: 'var(--danger)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {s.name.charAt(0)}
                     </div>
                     <div>
                       <div style={{ fontWeight: 600 }}>{s.name}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll #{s.id}</div>
                     </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{s.percentage}%</div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Failing</div>
                   </div>
                 </div>
               ))
             ) : (
               <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--success)' }}>
                 <CheckCircle size={32} style={{ marginBottom: '1rem' }} />
                 <p>All students are performing above the failure threshold.</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass-card">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Class Performance Leaderboard</h3>
        </div>
        <div className="table-container">
           <table>
             <thead>
               <tr>
                 <th>Rank</th>
                 <th>Student Name</th>
                 <th>Roll ID</th>
                 <th>Average (%)</th>
                 <th>Status</th>
               </tr>
             </thead>
             <tbody>
               {studentsPerformance.map((s, idx) => (
                 <tr key={idx}>
                   <td>{idx + 1}</td>
                   <td style={{ fontWeight: 600 }}>{s.name}</td>
                   <td>{s.id}</td>
                   <td style={{ fontWeight: 700 }}>{s.percentage}%</td>
                   <td>
                      <span className={`badge ${s.percentage >= 80 ? 'badge-blue' : s.percentage >= 50 ? 'badge-green' : 'badge-red'}`}>
                        {s.percentage >= 80 ? 'Distinction' : s.percentage >= 50 ? 'Passed' : 'At Risk'}
                      </span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
