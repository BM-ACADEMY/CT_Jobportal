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
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [myCompanies, setMyCompanies] = useState([]);
  const [page, setPage] = useState(1);
  const [quota, setQuota] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingReqs(true);
    try {
      if (user.role === 'company') {
        const reqs = await axios.get(`${API}/company/join-requests`, { headers: authHeader() });
        setJoinRequests(reqs.data);
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
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                {user.pendingCompanyInvite.company?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Organization Invitation</h3>
                <p className="text-sm text-slate-500">
                  You have been invited to join <strong>{user.pendingCompanyInvite.company?.name}</strong>'s team as
                  a <strong>{user.pendingCompanyInvite.type === 'recruiter' ? 'Recruiter' : 'Employee'}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button onClick={() => handleInviteAction('decline')} variant="outline" className="flex-1 md:flex-none border-rose-200 text-rose-600 hover:bg-rose-50">Decline</Button>
              <Button onClick={() => handleInviteAction('accept')} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20">Accept Invite</Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Join an Organization</h3>
              <p className="text-xs text-slate-500">Search for an organization to request to join their team.</p>
            </div>
            {quota && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Join Requests</span>
                <Badge className={`${quota.used >= quota.limit ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} border-none font-black text-xs px-2`}>
                  {quota.used} / {quota.limit}
                </Badge>
              </div>
            )}
          </div>
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
  return (
    <div className="space-y-6 pb-12">
      <PageSOPBanner pageKey="assignedRequests" />
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
      <AdminAssignedModule />
    </div>
  );
};

export default AssignedRequests;
