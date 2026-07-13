import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ClipboardList, RefreshCw, Loader2, X,
  CheckCircle2, ChevronLeft, ChevronRight,
  Search, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 5;

const token = () => localStorage.getItem('token');
const authHeader = () => ({ Authorization: `Bearer ${token()}` });

/* ─── Join Requests Module ────────────────────────────────────────────────────── */
const JoinRequestsModule = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [myCompanies, setMyCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [empPage, setEmpPage] = useState(1);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingReqs(true);
    try {
      if (user.role === 'company') {
        const [reqs, emps] = await Promise.all([
          axios.get(`${API}/company/join-requests`, { headers: authHeader() }),
          axios.get(`${API}/company/team`, { headers: authHeader() })
        ]);
        setJoinRequests(reqs.data);
        setEmployees(emps.data);
      } else if (user.role === 'recruiter') {
        const res = await axios.get(`${API}/recruiter/profile`, { headers: authHeader() });
        if (res.data?.companyHistory && res.data.companyHistory.length > 0) {
          setMyCompanies(res.data.companyHistory.map(h => ({
            ...h.company,
            status: h.status
          })));
        } else if (res.data?.company && typeof res.data.company === 'object') {
          // Fallback if no history but has company
          setMyCompanies([{ ...res.data.company, status: 'Current' }]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReqs(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setSearching(true);
    try {
      const res = await axios.get(`${API}/recruiter/search-companies?query=${searchQuery}`, { headers: authHeader() });
      setSearchResults(res.data);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleRequestJoin = async (companyId, statusType = 'Current') => {
    try {
      await axios.post(`${API}/recruiter/request-join/${companyId}`, { statusType }, { headers: authHeader() });
      toast.success('Join request sent!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send join request');
    }
  };

  const handleInviteAction = async (action) => {
    try {
      await axios.post(`${API}/user/${action}-company-invite`, {}, { headers: authHeader() });
      window.location.reload();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleJoinReqAction = async (userId, action) => {
    try {
      await axios.post(`${API}/company/join-requests/${userId}/${action}`, {}, { headers: authHeader() });
      toast.success(`Request ${action}ed`);
      fetchData();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  if (user?.role === 'recruiter') {
    return (
      <div className="space-y-6">
        {user.pendingCompanyInvite && (
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                {user.pendingCompanyInvite.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Organization Invitation</h3>
                <p className="text-sm text-slate-500">You have been invited to join <strong>{user.pendingCompanyInvite.name}</strong>'s team.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button onClick={() => handleInviteAction('decline')} variant="outline" className="flex-1 md:flex-none border-rose-200 text-rose-600 hover:bg-rose-50">Decline</Button>
              <Button onClick={() => handleInviteAction('accept')} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20">Accept Invite</Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Join an Organization</h3>
          <p className="text-xs text-slate-500 mb-4">Search for an organization to request to join their team.</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search companies by name or email..."
                className="w-full pl-10 pr-4 h-10 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={searching} className="h-10 bg-slate-900 text-white hover:bg-emerald-600 rounded-xl px-6 font-bold">
              {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-6 space-y-3">
              {searchResults.map(company => (
                <div key={company._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50 gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 rounded-lg shadow-sm border border-slate-200">
                      <AvatarImage src={company.logo} />
                      <AvatarFallback className="rounded-lg bg-emerald-50 text-emerald-700 font-bold">{company.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{company.name}</h4>
                      <p className="text-[10px] text-slate-500">{company.admin_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      id={`status-${company._id}`}
                      className="h-8 text-xs rounded-lg border border-slate-200 bg-white px-2 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Current">Current</option>
                      <option value="Previous">Previous</option>
                    </select>
                    <Button onClick={() => {
                      const status = document.getElementById(`status-${company._id}`).value;
                      handleRequestJoin(company._id, status);
                    }} size="sm" variant="outline" className="h-8 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      Request to Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {myCompanies.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Organizations you worked at</h3>
              <div className="space-y-3">
                {myCompanies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((c, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${c.status === 'Current' ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                     <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 rounded-lg shadow-sm border border-slate-200">
                          <AvatarImage src={c.logo} />
                          <AvatarFallback className={`rounded-lg font-bold ${c.status === 'Current' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {c.name?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{c.name || 'Company'}</h4>
                          <Badge className={`${c.status === 'Current' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'} border-none text-[10px] uppercase mt-1`}>
                            {c.status}
                          </Badge>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {myCompanies.length > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-[11px] text-slate-400 font-medium">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, myCompanies.length)} of {myCompanies.length}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14}/></Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= myCompanies.length}><ChevronRight size={14}/></Button>
                  </div>
                </div>
              )}
            </div>
        )}
      </div>
    );
  }

  if (user?.role === 'company') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Incoming Join Requests</h3>
          <p className="text-xs text-slate-500 mb-4">Recruiters who have requested to join your organization.</p>
          
          {loadingReqs ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : joinRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-slate-200 border-dashed rounded-2xl bg-slate-50/50">
                <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Building2 size={18} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-semibold text-xs">No pending join requests.</p>
              </div>
          ) : (
              <>
                  <div className="grid md:grid-cols-2 gap-4">
                  {joinRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(req => (
                      <div key={req._id} className="flex items-start justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors hover:shadow-sm">
                      <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 rounded-full border border-slate-200 shadow-sm">
                          <AvatarImage src={req.avatar} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{req.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                          <h4 className="text-sm font-bold text-slate-900">{req.name}</h4>
                          <p className="text-xs text-slate-500">{req.email}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] hidden sm:inline-flex">{req.statusType} Employee</Badge>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleJoinReqAction(req._id, 'reject')} className="w-8 h-8 flex items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors">
                            <X size={16} />
                            </button>
                            <button onClick={() => handleJoinReqAction(req._id, 'accept')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">
                            <CheckCircle2 size={16} />
                            </button>
                          </div>
                      </div>
                      </div>
                  ))}
                  </div>
                  
                  {joinRequests.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                      <p className="text-[11px] text-slate-400 font-medium">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, joinRequests.length)} of {joinRequests.length}
                      </p>
                      <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14}/></Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= joinRequests.length}><ChevronRight size={14}/></Button>
                      </div>
                  </div>
                  )}
              </>
          )}
        </div>

        {employees.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Accepted Requests / Employees</h3>
            <p className="text-xs text-slate-500 mb-4">Recruiters who have successfully joined your organization.</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {employees.slice((empPage - 1) * PAGE_SIZE, empPage * PAGE_SIZE).map(emp => (
                <div key={emp._id} className="flex items-center justify-between p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
                  <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 rounded-full border border-slate-200 shadow-sm bg-white">
                      <AvatarImage src={emp.avatar} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{emp.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                      <h4 className="text-sm font-bold text-slate-900">{emp.name}</h4>
                      <p className="text-[10px] text-slate-500">{emp.email}</p>
                      </div>
                  </div>
                  <Badge className={`${emp.statusType === 'Current' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'} border-none text-[10px]`}>
                    {emp.statusType}
                  </Badge>
                </div>
              ))}
            </div>

            {employees.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 font-medium">
                  {(empPage - 1) * PAGE_SIZE + 1}–{Math.min(empPage * PAGE_SIZE, employees.length)} of {employees.length}
                  </p>
                  <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEmpPage(p => Math.max(1, p - 1))} disabled={empPage === 1}><ChevronLeft size={14}/></Button>
                  <Button variant="outline" size="sm" onClick={() => setEmpPage(p => p + 1)} disabled={empPage * PAGE_SIZE >= employees.length}><ChevronRight size={14}/></Button>
                  </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const AssignedRequests = () => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <ClipboardList size={16} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Requests</h1>
          </div>
          <p className="text-sm text-slate-500">Manage join requests and organization invites.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="self-start sm:self-auto text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <JoinRequestsModule />
    </div>
  );
};

export default AssignedRequests;
