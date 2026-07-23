import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Building2, Users, Download, Mail, Phone, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = import.meta.env.VITE_API_BASE_URL;

const CompanyDriveView = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchView = async () => {
      try {
        const res = await axios.get(`${API}/college/public/company-drive/${token}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.msg || 'Invalid or expired link');
      } finally {
        setLoading(false);
      }
    };
    fetchView();
  }, [token]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/college/public/company-drive/${token}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.drive?.driveCode || 'drive'}_candidates.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // download failure is non-critical here — the page itself already shows the data
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-4 border border-red-100">
          <Building2 size={32} />
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">Link Unavailable</h1>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
      </div>
    );
  }

  const { drive, college, company, students } = data;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {college?.logo ? (
              <img src={college.logo.startsWith('http') ? college.logo : `${import.meta.env.VITE_API_DOMAIN}${college.logo}`} alt="" className="w-14 h-14 rounded-2xl object-cover bg-white p-1 border border-slate-100" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <GraduationCap size={24} />
              </div>
            )}
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 mb-1">
                Candidate List
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{drive.title}</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {college?.name} · For {company.name}{company.packageLPA > 0 ? ` · ${company.packageLPA} LPA` : ''} · Batch {drive.batchYear}
              </p>
            </div>
          </div>
          <Button onClick={exportCsv} disabled={exporting || students.length === 0} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 px-5 h-10 shrink-0">
            <Download size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-emerald-600" />
          <p className="text-sm font-bold text-slate-900">{students.length} registered candidate{students.length === 1 ? '' : 's'}</p>
        </div>

        {students.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[32px] bg-white text-slate-300">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">No candidates registered yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Candidate', 'Department', 'Batch', 'Roll No.', 'CGPA', 'Skills', 'Status'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Resume</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><Mail size={10} /> {s.email}</span>
                          {s.phone !== '—' && <span className="flex items-center gap-1"><Phone size={10} /> {s.phone}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">{s.department}</td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">{s.batchYear}</td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">{s.rollNumber}</td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">{s.cgpa || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(s.skills || []).slice(0, 3).map((sk, si) => (
                            <span key={si} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{sk}</span>
                          ))}
                          {s.skills?.length > 3 && <span className="text-[9px] text-slate-400">+{s.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.resumeUrl ? (
                          <a
                            href={s.resumeUrl.startsWith('http') ? s.resumeUrl : `${import.meta.env.VITE_API_DOMAIN}${s.resumeUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-emerald-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDriveView;
