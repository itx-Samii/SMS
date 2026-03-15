"use client";

import React from 'react';
import { BarChart, TrendingUp, Award, AlertCircle, CheckCircle, BookOpen, Clock, Target } from "lucide-react";
import MetricCard from "./MetricCard";

interface PerformanceData {
  summary: {
    overallPercentage: number;
    totalObtained: number;
    totalPossible: number;
    bestSubject: string;
    worstSubject: string;
    totalSubjects: number;
  };
  subjectWise: {
    subject: string;
    quiz: number;
    assignment: number;
    exam: number;
    obtained: number;
    total: number;
    percentage: number;
    grade: string;
  }[];
  trends: { month: string; value: number }[];
}

interface PerformanceAnalyticsProps {
  data: PerformanceData;
  title: string;
  subtitle: string;
}

export default function PerformanceAnalytics({ data, title, subtitle }: PerformanceAnalyticsProps) {
  if (!data || !data.subjectWise.length) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No performance data available for analysis.</p>
      </div>
    );
  }

  const { summary, subjectWise, trends } = data;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{title}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{subtitle}</p>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <MetricCard 
          title="Overall Percentage" 
          value={`${summary.overallPercentage}%`} 
          icon={Award} 
          colorClass="bg-blue" 
        />
        <MetricCard 
          title="Best Performing" 
          value={summary.bestSubject || 'N/A'} 
          icon={CheckCircle} 
          colorClass="bg-green" 
        />
        <MetricCard 
          title="Weakest Subject" 
          value={summary.worstSubject || 'N/A'} 
          icon={AlertCircle} 
          colorClass="bg-orange" 
        />
        <MetricCard 
          title="Total Subjects" 
          value={summary.totalSubjects} 
          icon={BookOpen} 
          colorClass="bg-purple" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Subject Performance Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <BarChart size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Subject Performance (%)</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '2rem', padding: '0 1rem' }}>
            {subjectWise.map((s, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative', width: '100%', height: '240px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      width: '100%', 
                      height: `${s.percentage}%`, 
                      background: s.percentage < 50 ? 'var(--danger)' : s.percentage < 70 ? 'var(--warning)' : 'var(--primary)',
                      transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 0 15px rgba(255,255,255,0.1)'
                    }} 
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, fontSize: '0.8rem', opacity: 0.5 }}>
                    {s.percentage}%
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                  {s.subject}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Progress Trend */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Performance Trends</h3>
          </div>
          <div style={{ height: '300px', position: 'relative', padding: '1rem' }}>
            {trends.length > 1 ? (
              <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d={`M ${trends.map((t, i) => `${(i / (trends.length - 1)) * 400},${200 - (t.value / 100) * 200}`).join(' L ')}`} 
                  fill="none" 
                  stroke="var(--success)" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path 
                  d={`M ${trends.map((t, i) => `${(i / (trends.length - 1)) * 400},${200 - (t.value / 100) * 200}`).join(' L ')} L 400,200 L 0,200 Z`} 
                  fill="url(#trendGradient)" 
                />
                {trends.map((t, i) => (
                  <circle 
                    key={i} 
                    cx={(i / (trends.length - 1)) * 400} 
                    cy={200 - (t.value / 100) * 200} 
                    r="4" 
                    fill="var(--success)" 
                  />
                ))}
              </svg>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Insufficient trend data.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              {trends.map((t, i) => (
                <span key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.month}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weak Subject Box */}
      {subjectWise.filter(s => s.percentage < 50).length > 0 && (
        <div style={{ 
          background: 'rgba(var(--danger-rgb), 0.1)', 
          borderLeft: '4px solid var(--danger)', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <AlertCircle size={32} style={{ color: 'var(--danger)' }} />
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Critical Learning Gap Detected</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Improvement required in: <strong>{subjectWise.filter(s => s.percentage < 50).map(s => s.subject).join(', ')}</strong>. 
              We recommend scheduled remedial sessions and focused assignment reviews.
            </p>
          </div>
        </div>
      )}

      {/* Detailed Marks Table */}
      <div className="glass-card" style={{ padding: '0' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Subject-wise Breakdown</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scroll for full details</span>
         </div>
         <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th style={{ textAlign: 'center' }}>Quiz</th>
                  <th style={{ textAlign: 'center' }}>Assignments</th>
                  <th style={{ textAlign: 'center' }}>Exam</th>
                  <th style={{ textAlign: 'center' }}>Total Points</th>
                  <th style={{ textAlign: 'center' }}>Performance</th>
                  <th style={{ textAlign: 'center' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {subjectWise.map((s, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{s.subject}</td>
                    <td style={{ textAlign: 'center' }}>{s.quiz}</td>
                    <td style={{ textAlign: 'center' }}>{s.assignment}</td>
                    <td style={{ textAlign: 'center' }}>{s.exam}</td>
                    <td style={{ textAlign: 'center' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700 }}>{s.obtained} / {s.total}</span>
                       </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                       <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', margin: '0 auto 0.5rem', overflow: 'hidden' }}>
                          <div style={{ width: `${s.percentage}%`, height: '100%', background: s.percentage >= 70 ? 'var(--success)' : s.percentage >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                       </div>
                       <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.percentage >= 70 ? 'var(--success)' : s.percentage >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                          {s.percentage}%
                       </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                       <span className={`badge ${s.percentage >= 70 ? 'badge-blue' : s.percentage >= 50 ? 'badge-orange' : 'badge-red'}`} style={{ minWidth: '35px' }}>
                          {s.grade}
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
