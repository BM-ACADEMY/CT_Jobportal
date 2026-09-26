import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ClipboardList, RefreshCw, Loader2, X,
  CheckCircle2, ChevronLeft, ChevronRight,
  Search, Building2, Inbox
} from 'lucide-react';
import { Card, Tag } from 'antd';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TeamTypePermissionPicker from '@/components/company/TeamTypePermissionPicker';
import PageSOPBanner from '@/components/common/PageSOPBanner';

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
  const [acceptedMembers, setAcceptedMembers] = useState([]);
  const [acceptedSearchQuery, setAcceptedSearchQuery] = useState('');
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [myCompanies, setMyCompanies] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [quota, setQuota] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingReqs(true);
    try {
      if (user.role === 'company') {
        const [reqsRes, teamRes, employeesRes] = await Promise.all([
          axios.get(`${API}/company/join-requests`, { headers: authHeader() }),
          axios.get(`${API}/company/team`, { headers: authHeader() }),
          axios.get(`${API}/company/employees`, { headers: authHeader() })
        ]);
        setJoinRequests(reqsRes.data);
        const recruiters = teamRes.data.map(m => ({ ...m, kind: 'recruiter' }));
        const recruiterIds = new Set(recruiters.map(r => r._id));
        const employees = employeesRes.data
          .filter(m => !recruiterIds.has(m._id))
          .map(m => ({ ...m, kind: 'employee' }));
        setAcceptedMembers([...recruiters, ...employees]);
      } else if (user.role === 'recruiter') {
        const res = await axios.get(`${API}/recruiter/profile`, { headers: authHeader() });
        
        // Extract Requests Quota
        const plan = res.data.subscription;
        const requestsFeature = plan?.features?.find(f => f.name === 'Requests');
        const limit = requestsFeature?.isActive ? Number(requestsFeature.value) : 0;
        setQuota({ limit, used: res.data.joinRequestsUsed || 0 });

        if (res.data?.companyHistory && res.data.companyHistory.length > 0) {
          setMyCompanies(res.data.companyHistory.map(h => ({
            ...h.company,
            status: h.status
          })));
        } else if (res.data?.company && typeof res.data.company === 'object') {
          // Fallback if no history but has company
          setMyCompanies([{ ...res.data.company, status: 'Current' }]);
        }

        const reqs = await axios.get(`${API}/recruiter/my-requests`, { headers: authHeader() });
        setMyRequests(reqs.data);
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
      fetchData();
    } catch (err) {
      if (err.response?.data?.requiresUpgrade) {
        toast.error(err.response.data.msg, {
          action: {
            label: 'Upgrade Plan',
            onClick: () => window.location.href = '/company/subscription'
          },
          duration: 10000
        });
      } else {
        toast.error(err.response?.data?.msg || 'Failed to send join request');
      }
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

  const handleRevokeRequest = async (companyId) => {
    try {
      await axios.delete(`${API}/recruiter/request-join/${companyId}`, { headers: authHeader() });
      toast.success('Join request revoked');
      fetchData();
    } catch (err) {
      toast.error('Failed to revoke request');
    }
  };

  // Accepting a join request requires the same Employee/Recruiter (+ permissions) choice
  // as a fresh invite — opens the shared picker instead of accepting immediately.
  const [acceptTarget, setAcceptTarget] = useState(null); // the join request being accepted
  const [acceptType, setAcceptType] = useState('employee');
  const [acceptPermissions, setAcceptPermissions] = useState([]);
  const [accepting, setAccepting] = useState(false);

  const confirmAccept = async () => {
    setAccepting(true);
    try {
      await axios.post(`${API}/company/join-requests/${acceptTarget._id}/accept`, {
        type: acceptType,
        permissions: acceptType === 'recruiter' ? acceptPermissions : []
      }, { headers: authHeader() });
      toast.success('Request accepted');
      setAcceptTarget(null);
      setAcceptType('employee');
      setAcceptPermissions([]);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Action failed');
    } finally {
      setAccepting(false);
    }
  };

  if (user?.role === 'recruiter') {
    return (
      <div className="space-y-6">
        {user.pendingCompanyInvite && (
          <div className="bg-white border-2 border-[#1b496d] rounded-none p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center font-black border border-emerald-100">
                {user.pendingCompanyInvite.company?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1b496d]">Organization Invitation</h3>
                <p className="text-xs font-medium text-slate-500">
                  You have been invited to join <strong>{user.pendingCompanyInvite.company?.name}</strong>'s team as
                  a <strong className="text-emerald-600 uppercase tracking-wider text-[10px] ml-1">{user.pendingCompanyInvite.type === 'recruiter' ? 'Recruiter' : 'Employee'}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              <Button onClick={() => handleInviteAction('decline')} variant="outline" className="flex-1 md:flex-none rounded-none border-rose-200 text-rose-600 hover:bg-rose-50 font-bold uppercase text-[10px] tracking-widest h-10 px-6">Decline</Button>
              <Button onClick={() => handleInviteAction('accept')} className="flex-1 md:flex-none rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest h-10 px-6 shadow-md">Accept Invite</Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-none p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1 tracking-tight">Join an Organization</h3>
              <p className="text-xs font-medium text-slate-500">Search for an organization to request to join their team.</p>
            </div>
            {quota && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Join Requests</span>
                <Badge className={`rounded-none ${quota.used >= quota.limit ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} border-none font-black text-xs px-2`}>
                  {quota.used} / {quota.limit}
                </Badge>
              </div>
            )}
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 relative z-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search companies by name or email..."
                className="w-full pl-10 pr-4 h-11 text-sm font-medium rounded-none border border-slate-200 focus:outline-none focus:border-[#34b678] focus:ring-1 focus:ring-[#34b678]/20 transition-all bg-slate-50 hover:bg-white"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={searching} className="h-11 rounded-none bg-slate-900 text-white hover:bg-emerald-600 px-6 font-bold uppercase text-xs tracking-widest transition-colors">
              {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-6 space-y-3 relative z-10">
              {searchResults.map(company => (
                <div key={company._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-none border border-slate-200 hover:border-[#34b678]/50 transition-colors bg-white gap-4 group">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 rounded-none border border-slate-100 shadow-sm group-hover:border-[#34b678]/30 transition-colors">
                      <AvatarImage src={company.logo} />
                      <AvatarFallback className="rounded-none bg-slate-50 text-slate-400 font-black text-lg">{company.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{company.name}</h4>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{company.admin_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      id={`status-${company._id}`}
                      className="h-10 text-xs font-bold uppercase tracking-wider rounded-none border border-slate-200 bg-slate-50 px-3 py-0 focus:outline-none focus:border-emerald-500 cursor-pointer text-slate-600"
                    >
                      <option value="Current">Current</option>
                      <option value="Previous">Previous</option>
                    </select>
                    <Button onClick={() => {
                      const status = document.getElementById(`status-${company._id}`).value;
                      handleRequestJoin(company._id, status);
                    }} size="sm" variant="outline" className="h-10 px-4 text-[10px] uppercase tracking-widest font-bold rounded-none border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors">
                      Request to Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {myRequests.length > 0 && (
          <div className="bg-white rounded-none p-6 border border-slate-200 shadow-sm mt-6">
            <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-tight">Requested Companies</h3>
            <div className="space-y-3">
              {myRequests.map((req, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-none border border-slate-200 bg-white hover:border-[#34b678]/50 transition-colors gap-4">
                   <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 rounded-none shadow-sm border border-slate-100">
                        <AvatarImage src={req.logo} />
                        <AvatarFallback className="rounded-none font-black bg-slate-50 text-slate-400 text-lg">
                          {req.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{req.name || 'Company'}</h4>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{req.admin_email}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <Badge className="bg-amber-50 text-amber-600 border-amber-200 rounded-none font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                       {req.status}
                     </Badge>
                     <Button 
                       onClick={() => handleRevokeRequest(req._id)} 
                       size="sm" 
                       variant="outline" 
                       className="h-10 px-4 rounded-none text-[10px] uppercase tracking-widest font-bold border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                     >
                       Revoke
                     </Button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {myCompanies.length > 0 && (
            <div className="bg-white rounded-none p-6 border border-slate-200 shadow-sm mt-6">
              <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-tight">Organizations you worked at</h3>
              <div className="space-y-3">
                {myCompanies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((c, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-none border ${c.status === 'Current' ? 'border-[#34b678]/50 bg-emerald-50/20' : 'border-slate-200 bg-white hover:border-slate-300'} transition-colors`}>
                     <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 rounded-none shadow-sm border border-slate-100">
                          <AvatarImage src={c.logo} />
                          <AvatarFallback className={`rounded-none font-black text-lg ${c.status === 'Current' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                            {c.name?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{c.name || 'Company'}</h4>
                          <Badge className={`${c.status === 'Current' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'} rounded-none font-bold text-[9px] uppercase tracking-widest mt-1 px-2 py-0.5`}>
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
        <div className="bg-white rounded-none p-6 border border-slate-200 shadow-sm">
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
                            <button onClick={() => setAcceptTarget(req)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">
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

        {acceptedMembers.length > 0 && (
          <div className="bg-white rounded-none p-6 border border-slate-200 shadow-sm mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Accepted Requests</h3>
                <p className="text-xs text-slate-500">Members who have successfully joined your organization.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search by ID, name or email..."
                  value={acceptedSearchQuery}
                  onChange={(e) => setAcceptedSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 h-9 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {acceptedMembers
                .filter(m => {
                  if (!acceptedSearchQuery) return true;
                  const q = acceptedSearchQuery.toLowerCase();
                  return m.name?.toLowerCase().includes(q) || 
                         m.email?.toLowerCase().includes(q) || 
                         m.display_id?.toLowerCase().includes(q);
                })
                .map(member => (
                <div key={member._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 gap-4">
                   <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 rounded-lg shadow-sm border border-slate-200">
                        <AvatarImage src={member.avatar?.startsWith('http') ? member.avatar : `${API.replace('/api', '')}${member.avatar}`} />
                        <AvatarFallback className="rounded-lg font-bold bg-emerald-100 text-emerald-700">
                          {member.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                        <p className="text-[10px] text-slate-500">{member.email}</p>
                        {member.display_id && <p className="text-[10px] text-slate-400 mt-0.5">ID: {member.display_id}</p>}
                      </div>
                   </div>
                   <div className="flex items-center">
                     <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] uppercase">
                       {member.kind}
                     </Badge>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}


        <ConfirmDialog
          open={!!acceptTarget}
          onOpenChange={(open) => { if (!open) setAcceptTarget(null); }}
          title={`Accept ${acceptTarget?.name || 'this'}'s request to join?`}
          description="Choose whether they're joining as an Employee or a Recruiter, and (for Recruiters) which pages they can access."
          confirmLabel="Accept"
          loading={accepting}
          onConfirm={confirmAccept}
        >
          <TeamTypePermissionPicker
            type={acceptType}
            onTypeChange={setAcceptType}
            permissions={acceptPermissions}
            onPermissionsChange={setAcceptPermissions}
          />
        </ConfirmDialog>
      </div>
    );
  }

  return null;
};

/* ─── Admin Assigned Requests Module ─────────────────────────────────────────── */
const AdminAssignedModule = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [viewReq, setViewReq] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [slot1Date, setSlot1Date] = useState('');
  const [slot1StartTime, setSlot1StartTime] = useState('');
  const [slot1EndTime, setSlot1EndTime] = useState('');
  const [slot2Date, setSlot2Date] = useState('');
  const [slot2StartTime, setSlot2StartTime] = useState('');
  const [slot2EndTime, setSlot2EndTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/requests/assigned`, { headers: authHeader() });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleUpdate = async (id, status, notes = '', action = null) => {
    setUpdating(true);
    try {
      const payload = { status, adminNotes: notes, action };
      if (status === 'approved') {
        payload.slot1Date = slot1Date;
        payload.slot1StartTime = slot1StartTime;
        payload.slot1EndTime = slot1EndTime;
        payload.slot2Date = slot2Date;
        payload.slot2StartTime = slot2StartTime;
        payload.slot2EndTime = slot2EndTime;
        payload.meetingLink = meetingLink;
      }
      await axios.patch(`${API}/requests/assigned/${id}`, payload, { headers: authHeader() });
      toast.success(action === 'reject' ? 'Request rejected' : 'Request updated successfully');
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      toast.error('Failed to update request');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  if (requests.length === 0) return null; // Only show if they have assignments

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
      <h3 className="text-sm font-bold text-slate-900 mb-1">Platform Assignments</h3>
      <p className="text-xs text-slate-500 mb-4">Requests assigned to you by the platform admins (e.g. Mock Interviews, Counselling).</p>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-3 px-2 font-bold text-slate-500 uppercase">User</th>
              <th className="py-3 px-2 font-bold text-slate-500 uppercase">Type</th>
              <th className="py-3 px-2 font-bold text-slate-500 uppercase">Details</th>
              <th className="py-3 px-2 font-bold text-slate-500 uppercase">Status</th>
              <th className="py-3 px-2 font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req._id} className="border-b border-slate-50">
                <td className="py-3 px-2">
                  <p className="font-bold text-slate-900">{req.user?.name}</p>
                  <p className="text-[10px] text-slate-500">{req.user?.email}</p>
                </td>
                <td className="py-3 px-2 font-medium capitalize">{req.type.replace('_', ' ')}</td>
                <td className="py-3 px-2 text-slate-600 max-w-[250px]">
                  {req.type === 'mock_interview' ? (
                    <div className="space-y-0.5">
                      <p><span className="font-bold text-slate-700">Skills:</span> {req.skills}</p>
                      <p><span className="font-bold text-slate-700">Date:</span> {req.mockInterviewDate} at {req.mockInterviewTime}</p>
                    </div>
                  ) : req.type === 'counselling' ? (
                    <div className="space-y-0.5">
                      <p><span className="font-bold text-slate-700">Date:</span> {req.bookingDate} at {req.bookingTime}</p>
                      {req.qualification && <p><span className="font-bold text-slate-700">Edu:</span> {req.qualification} ({req.major})</p>}
                      {req.workExperience && <p><span className="font-bold text-slate-700">Exp:</span> {req.workExperience}</p>}
                      {req.notes && <p className="text-[10px] text-slate-500 mt-1"><span className="font-bold text-slate-700">User Notes:</span> {req.notes}</p>}
                    </div>
                  ) : 'N/A'}
                  {req.adminNotes && (
                    <div className="mt-2 p-1.5 bg-blue-50/50 border border-blue-100 rounded text-[10px] text-blue-700 leading-tight">
                      <span className="font-bold block mb-0.5">Admin Instructions:</span> 
                      {req.adminNotes}
                    </div>
                  )}
                </td>
                <td className="py-3 px-2">
                  <Badge className={`${
                    req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  } border-none`}>
                    {req.status}
                  </Badge>
                </td>
                <td className="py-3 px-2 flex gap-2">
                  <Button onClick={() => setViewReq(req)} size="sm" variant="outline" className="h-7 text-[10px] text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">View</Button>
                  {req.status === 'pending' && (
                    <>
                      <Button onClick={() => { setSelectedReq(req); setAdminNotes(req.adminNotes || ''); }} size="sm" className="h-7 text-[10px] bg-emerald-600">Accept</Button>
                      <Button onClick={() => handleUpdate(req._id, null, '', 'reject')} size="sm" variant="outline" className="h-7 text-[10px] text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700">Reject</Button>
                    </>
                  )}
                  {req.status === 'approved' && (
                    <Button onClick={() => handleUpdate(req._id, 'completed', req.adminNotes)} size="sm" variant="outline" className="h-7 text-[10px]">Mark Complete</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!selectedReq}
        onOpenChange={(open) => { 
          if (!open) {
            setSelectedReq(null);
            setSlot1Date('');
            setSlot1StartTime('');
            setSlot1EndTime('');
            setSlot2Date('');
            setSlot2StartTime('');
            setSlot2EndTime('');
            setMeetingLink('');
            setAdminNotes('');
          } 
        }}
        title={`Accept ${selectedReq?.type?.replace('_', ' ') || ''} Request`}
        description="Please provide the exact schedule and meeting details. The jobseeker will receive an email immediately with these details."
        confirmLabel="Accept & Notify User"
        loading={updating}
        onConfirm={() => {
          if (!slot1Date || !slot1StartTime || !slot1EndTime || !slot2Date || !slot2StartTime || !slot2EndTime) {
             toast.error('Please fill in both Slot 1 and Slot 2 dates and times.');
             return;
          }
          handleUpdate(selectedReq._id, 'approved', adminNotes);
        }}
      >
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Slot 1 */}
            <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-2 mt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Slot 1 Options</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slot 1 Date *</label>
              <input type="date" value={slot1Date} onChange={e => setSlot1Date(e.target.value)} required className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slot 1 Start Time *</label>
              <input type="time" value={slot1StartTime} onChange={e => setSlot1StartTime(e.target.value)} required className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slot 1 End Time *</label>
              <input type="time" value={slot1EndTime} onChange={e => setSlot1EndTime(e.target.value)} required className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="hidden sm:block"></div>

            {/* Slot 2 */}
            <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-2 mt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Slot 2 Options</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slot 2 Date *</label>
              <input type="date" value={slot2Date} onChange={e => setSlot2Date(e.target.value)} required className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slot 2 Start Time *</label>
              <input type="time" value={slot2StartTime} onChange={e => setSlot2StartTime(e.target.value)} required className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slot 2 End Time *</label>
              <input type="time" value={slot2EndTime} onChange={e => setSlot2EndTime(e.target.value)} required className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="hidden sm:block"></div>
            
            <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-2 mt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Link</label>
              <input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="Leave blank to generate native link" className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes</label>
            <textarea
              className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:border-emerald-500 focus:outline-none"
              rows={2}
              placeholder="Any preparation instructions..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>
      </ConfirmDialog>

      {/* View Details Modal */}
      {viewReq && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Request Details</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">User Name</p>
                  <p className="font-medium">{viewReq.user?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                  <p className="font-medium truncate" title={viewReq.user?.email}>{viewReq.user?.email}</p>
                </div>
              </div>
              
              {viewReq.type === 'counselling' && (
                <div className="space-y-2">
                  <p><span className="font-bold">Date & Time:</span> {viewReq.bookingDate} at {viewReq.bookingTime}</p>
                  {viewReq.bookingPhone && <p><span className="font-bold">Phone:</span> {viewReq.bookingPhone}</p>}
                  {viewReq.qualification && <p><span className="font-bold">Qualification:</span> {viewReq.qualification}</p>}
                  {viewReq.major && <p><span className="font-bold">Major:</span> {viewReq.major}</p>}
                  {viewReq.workExperience && <p><span className="font-bold">Work Exp:</span> {viewReq.workExperience}</p>}
                  {viewReq.notes && (
                    <div>
                      <p className="font-bold mb-1">Notes / Goals:</p>
                      <div className="bg-slate-50 p-3 rounded-xl text-xs">{viewReq.notes}</div>
                    </div>
                  )}
                </div>
              )}

              {viewReq.type === 'mock_interview' && (
                <div className="space-y-2">
                  <p><span className="font-bold">Skills:</span> {viewReq.skills}</p>
                  {viewReq.careerGoal && <p><span className="font-bold">Career Goal:</span> {viewReq.careerGoal}</p>}
                  <p><span className="font-bold">Date & Time:</span> {viewReq.mockInterviewDate} at {viewReq.mockInterviewTime}</p>
                </div>
              )}

              {viewReq.adminNotes && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800">
                  <p className="font-bold text-xs mb-1">Additional Notes / Instructions:</p>
                  <p className="whitespace-pre-wrap">{viewReq.adminNotes}</p>
                </div>
              )}

              {viewReq.status === 'approved' && !viewReq.selectedSlot && viewReq.slot1Date && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800">
                  <p className="font-bold text-xs mb-2">Suggested Slots (Awaiting Seeker Selection):</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border border-amber-100">
                      <span className="font-bold">Slot 1:</span> {viewReq.slot1Date} at {viewReq.slot1StartTime} - {viewReq.slot1EndTime}
                    </div>
                    {viewReq.slot2Date && (
                      <div className="p-2 bg-white rounded border border-amber-100">
                        <span className="font-bold">Slot 2:</span> {viewReq.slot2Date} at {viewReq.slot2StartTime} - {viewReq.slot2EndTime}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewReq.status === 'approved' && viewReq.selectedSlot && viewReq.meetingDate && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
                  <p className="font-bold text-xs mb-2">Scheduled Meeting Details:</p>
                  <p className="mb-1"><span className="font-semibold">Date:</span> {viewReq.meetingDate}</p>
                  <p className="mb-1"><span className="font-semibold">Time:</span> {viewReq.meetingStartTime} - {viewReq.meetingEndTime}</p>
                  {viewReq.meetingLink && (
                    <p className="mt-2">
                      <a href={viewReq.meetingLink} target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">Join Meeting Link</a>
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setViewReq(null)} variant="outline" className="h-9 px-4 text-xs font-bold rounded-xl">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const AssignedRequests = () => {
  const { user } = useAuth();
  
  return (
    <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-10 py-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex-1 min-w-0 space-y-12">
      <PageSOPBanner pageKey="assignedRequests" />
      
      {/* Premium Welcome Header */}
      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ background: 'linear-gradient(135deg, #1b496d 0%, #153e5e 50%, #0d2e49 100%)', borderRadius: 0 }} className="relative shadow-sm overflow-hidden group">
        <div className="p-8 sm:p-10 relative z-10">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#34b678]/10 blur-[80px] rounded-full transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#34b678] rounded-none flex items-center justify-center border border-white/10 shrink-0">
                <Inbox className="w-7 h-7 text-white" />
              </div>
              <div>
                 <div className="flex items-center gap-3 mb-2">
                   <Tag style={{ background: 'rgba(52, 182, 120, 0.2)', borderColor: 'rgba(52, 182, 120, 0.3)', color: '#34b678', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', fontSize: 9, padding: '2px 8px', borderRadius: 0 }}>
                     {user?.role === 'recruiter' ? 'Recruiter Requests' : 'Company Requests'}
                   </Tag>
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tight m-0">My Requests</h2>
                 <p className="text-xs text-slate-400 font-medium max-w-xl leading-relaxed mt-1 m-0">
                   Manage organizational join requests and invitations dynamically.
                 </p>
              </div>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="text-white/70 hover:text-white transition-colors p-3 rounded-none border border-white/10 hover:bg-white/10 flex items-center gap-2"
            >
              <RefreshCw size={15} /> <span className="text-[10px] uppercase font-bold tracking-widest">Refresh</span>
            </button>
          </div>
        </div>
      </Card>

      <JoinRequestsModule />
      <AdminAssignedModule />
      </div>
    </div>
  );
};

export default AssignedRequests;
