"use client";

import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, Search, Filter, User, Users, BookOpen, GraduationCap } from "lucide-react";

interface RankedStudent {
  position: number;
  studentId: number;
  name: string;
  fatherName: string;
  rollNumber: string;
  obtained: number;
  total: number;
  percentage: number;
  grade: string;
}

interface MeritListProps {
  initialClassId?: string;
  classes?: any[];
  subjects?: any[];
  hideFilters?: boolean;
}

export default function MeritList({ initialClassId = "", classes = [], subjects = [], hideFilters = false }: MeritListProps) {
  const [ranking, setRanking] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [classId, setClassId] = useState(initialClassId);
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [examType, setExamType] = useState("");

  const fetchRanking = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(classId && { classId }),
        ...(section && { section }),
        ...(subject && { subject }),
        ...(examType && { examType })
      });
      const res = await fetch(`/api/analytics/ranking?${params.toString()}`);
      if (res.ok) {
        setRanking(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch ranking", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [classId, section, subject, examType]);

  const topThree = ranking.slice(0, 3);
  const restOfList = ranking.slice(3);

  const getCardStyle = (pos: number) => {
    if (pos === 1) return { background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)', border: '2px solid rgba(255, 215, 0, 0.6)', glow: '0 0 30px rgba(255, 215, 0, 0.5)' };
    if (pos === 2) return { background: 'linear-gradient(135deg, #C0C0C0 0%, #708090 100%)', border: '1px solid rgba(192, 192, 192, 0.4)', glow: 'none' };
    if (pos === 3) return { background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', border: '1px solid rgba(205, 127, 50, 0.4)', glow: 'none' };
    return { background: 'var(--glass)', border: 'none', glow: 'none' };
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      
      {!hideFilters && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginRight: '0.5rem' }}>
            <Filter size={20} />
            <span style={{ fontWeight: 600 }}>Ranking Filters:</span>
          </div>
          
          {classes.length > 1 && (
            <div style={{ flex: 1, minWidth: '150px' }}>
              <select className="form-input" style={{ margin: 0 }} value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div style={{ flex: 1, minWidth: '150px' }}>
            <select className="form-input" style={{ margin: 0 }} value={section} onChange={e => setSection(e.target.value)}>
              <option value="">All Sections</option>
              <option value="Sec-A">Sec-A</option>
              <option value="Sec-B">Sec-B</option>
              <option value="Sec-C">Sec-C</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <select className="form-input" style={{ margin: 0 }} value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">Overall Ranking</option>
              {subjects.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <select className="form-input" style={{ margin: 0 }} value={examType} onChange={e => setExamType(e.target.value)}>
              <option value="">All Assessments</option>
              <option value="Final Exam">Final Exam</option>
              <option value="Mid Term">Mid Term</option>
              <option value="Quiz">Quiz</option>
              <option value="Assignment">Assignment</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Calculating standings...</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <GraduationCap size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No academic records found for the selected criteria.</p>
        </div>
      ) : (
        <>
          {/* Top 3 row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {topThree.map((s, idx) => {
              const style = getCardStyle(idx + 1);
              return (
                <div key={s.studentId} className="animate-slide-up" style={{ 
                  height: '160px', 
                  borderRadius: '16px', 
                  padding: '1.5rem', 
                  background: style.background, 
                  border: style.border, 
                  boxShadow: style.glow,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  animationDelay: `${idx * 150}ms`
                }}>
                  <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.15 }}>
                    {idx === 0 ? <Trophy size={100} /> : <Medal size={100} />}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '1.25rem',
                      color: '#fff'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>{s.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>Roll #{s.rollNumber}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                     <div>
                       <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Percentage</div>
                       <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{s.percentage}%</div>
                     </div>
                     <div style={{ 
                       background: 'rgba(255,255,255,0.25)', 
                       padding: '0.25rem 0.75rem', 
                       borderRadius: '20px', 
                       color: '#fff', 
                       fontWeight: 700 
                     }}>
                       Grade {s.grade}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full list table */}
          <div className="glass-card" style={{ padding: 0 }}>
             <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Full Merit Standings</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Students Ranked: {ranking.length}</div>
             </div>
             <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Position</th>
                      <th>Roll #</th>
                      <th>Student Name</th>
                      <th>Father Name</th>
                      <th style={{ textAlign: 'center' }}>Obtained</th>
                      <th style={{ textAlign: 'center' }}>Percentage</th>
                      <th style={{ textAlign: 'center' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((s) => (
                      <tr key={s.studentId} style={{ 
                        background: s.position === 1 ? 'rgba(255, 215, 0, 0.03)' : 'transparent' 
                      }}>
                        <td style={{ textAlign: 'center' }}>
                           <div style={{ 
                             width: '30px', 
                             height: '30px', 
                             borderRadius: '50%', 
                             background: s.position <= 3 ? (s.position === 1 ? '#FFD700' : s.position === 2 ? '#C0C0C0' : '#CD7F32') : 'rgba(255,255,255,0.05)',
                             color: s.position <= 3 ? '#000' : 'inherit',
                             margin: '0 auto',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             fontWeight: 700,
                             fontSize: '0.85rem'
                           }}>
                             {s.position}
                           </div>
                        </td>
                        <td>{s.rollNumber}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.fatherName}</td>
                        <td style={{ textAlign: 'center' }}>{s.obtained} / {s.total}</td>
                        <td style={{ textAlign: 'center' }}>
                           <div style={{ color: s.percentage >= 70 ? 'var(--success)' : s.percentage >= 50 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700 }}>
                              {s.percentage}%
                           </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                           <span className={`badge ${['A+','A'].includes(s.grade) ? 'badge-blue' : ['B','C'].includes(s.grade) ? 'badge-orange' : 'badge-red'}`} style={{ minWidth: '35px' }}>
                             {s.grade}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
