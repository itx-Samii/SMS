"use client";

import React from 'react';
import { BarChart, TrendingUp, Users, Award, Landmark, BookOpen } from "lucide-react";
import MetricCard from "./MetricCard";

interface SchoolPerformanceData {
  summary: {
    totalStudents: number;
    overallPassRate: number;
    schoolAveragePercentage: number;
  };
  subjectAverages: { subject: string; average: number }[];
  classPerformance: { name: string; average: number }[];
}

interface SchoolPerformanceAnalyticsProps {
  data: SchoolPerformanceData;
}

export default function SchoolPerformanceAnalytics({ data }: SchoolPerformanceAnalyticsProps) {
  if (!data || !data.classPerformance.length) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No school-wide performance data available for analysis.</p>
      </div>
    );
  }

  const { summary, subjectAverages, classPerformance } = data;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>School Performance Overview</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Global academic metrics and class-wise comparisons</p>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <MetricCard 
          title="School Average" 
          value={`${summary.schoolAveragePercentage}%`} 
          icon={Landmark} 
          colorClass="bg-blue" 
        />
        <MetricCard 
          title="Overall Pass Rate" 
          value={`${summary.overallPassRate}%`} 
          icon={Award} 
          colorClass="bg-green" 
        />
        <MetricCard 
          title="Total Students" 
          value={summary.totalStudents} 
          icon={Users} 
          colorClass="bg-purple" 
        />
        <MetricCard 
          title="Active Subjects" 
          value={subjectAverages.length} 
          icon={BookOpen} 
          colorClass="bg-orange" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Class Performance Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Class-wise Comparison (%)</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '2rem', padding: '0 1rem' }}>
            {classPerformance.map((c, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative', width: '100%', height: '240px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      width: '100%', 
                      height: `${c.average}%`, 
                      background: 'var(--primary)',
                      opacity: 0.8
                    }} 
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, fontSize: '0.8rem', opacity: 0.5 }}>
                    {c.average}%
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Averages across School */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <BarChart size={20} style={{ color: 'var(--success)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Subject Averages (All Classes)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {subjectAverages.map((s, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 500 }}>{s.subject}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.average}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.average}%`, background: 'var(--primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Rankings Table */}
      <div className="glass-card">
         <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Institutional Ranking by Class</h3>
         </div>
         <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Class Name</th>
                  <th>Avg. Performance</th>
                  <th>Success Index</th>
                </tr>
              </thead>
              <tbody>
                {classPerformance.sort((a,b) => b.average - a.average).map((c, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ fontWeight: 700 }}>{c.average}%</td>
                    <td>
                       <span className={`badge ${c.average >= 70 ? 'badge-success' : c.average >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {c.average >= 70 ? 'High' : c.average >= 50 ? 'Moderate' : 'Low'}
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
