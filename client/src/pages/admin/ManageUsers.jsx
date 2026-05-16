import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Trash2, 
  Search, 
  Loader2, 
  Eye, 
  Edit2, 
  ShieldAlert, 
  ShieldCheck,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Building2,
  Users,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  ChevronRight,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
// Note: Dialog kept for the Edit modal
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    profile: {
      phone: '',
      location: '',
      bio: '',
      headline: ''
    }
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        console.error('API returned non-array data for users:', res.data);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setRoles(res.data);
      } else {
        console.error('API returned non-array data for roles:', res.data);
        setRoles([]);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${id}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.msg);
      setUsers(users.map(u => u._id === id ? { ...u, isAdminBlocked: res.data.isAdminBlocked } : u));
    } catch (err) {
      toast.error('Failed to update block status');
    }
  };

  const handleViewDetails = (user) => {
    navigate(`/admin/users/${user._id}`);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role?._id || '',
      profile: {
        phone: user.profile?.phone || '',
        location: user.profile?.location || '',
        bio: user.profile?.bio || '',
        headline: user.profile?.headline || ''
      }
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${selectedUser._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleStartConversation = async (recipientId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/messages/conversation`, 
        { recipientId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/admin/messages', { state: { conversationId: res.data._id } });
    } catch (err) {
      console.error(err);
      toast.error("Failed to start conversation");
    }
  };

  const filterUsersByRole = (roleName) => {
    return (Array.isArray(users) ? users : []).filter(user => {
      const matchesRole = user.role?.name === roleName;
      const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) || 
                           user.email?.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  };

  const UserTable = ({ data, roleLabel }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Identity</th>
            <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">Status</th>
            <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">Registration</th>
            <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {(data || []).length === 0 ? (
            <tr>
              <td colSpan="4" className="p-20 text-center text-slate-400 font-medium text-sm italic">No {roleLabel} records identified.</td>
            </tr>
          ) : (
            Array.isArray(data) && data.map((user) => (
              <tr key={user._id} className={`hover:bg-slate-50/50 transition-colors group ${user.isAdminBlocked ? 'bg-red-50/20' : ''}`}>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 rounded-xl border border-slate-200 p-0.5 bg-white shadow-sm transition-transform group-hover:scale-105">
                      <AvatarImage src={user.avatar} className="rounded-lg" />
                      <AvatarFallback className="bg-slate-100 text-slate-400 rounded-lg text-[10px] font-bold uppercase">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {user.name}
                        {user.isAdminBlocked && (
                          <span className="text-[8px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                             BLOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.isVerified ? 'bg-emerald-500' : 'bg-orange-400'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
                      {user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </td>
                <td className="p-6 text-center">
                   <span className="text-xs text-slate-400 font-bold tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                   </span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(user)} className="h-9 w-9 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Inspect">
                      <Eye size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)} className="h-9 w-9 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all" title="Edit">
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleBlock(user._id)} className={`h-9 w-9 rounded-lg transition-all ${
                        user.isAdminBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                      }`} title={user.isAdminBlocked ? 'Unblock' : 'Block'}>
                      {user.isAdminBlocked ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleStartConversation(user._id)} className="h-9 w-9 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all" title="Direct Message">
                      <MessageSquare size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user._id)} className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header - Simple & Professional */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Identity Directory</h1>
            <p className="text-base text-slate-500 font-medium">Manage platform participants and institutional access levels.</p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <Input
              type="text"
              className="pl-12 h-12 border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-0 font-medium text-sm bg-white shadow-sm transition-all"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="h-px bg-slate-200 w-full" />
      </div>

      <Tabs defaultValue="jobseeker" className="w-full space-y-8">
        <TabsList className="bg-slate-100/50 p-1 flex gap-1 rounded-xl border border-slate-200 w-fit">
          <TabsTrigger value="jobseeker" className="rounded-lg px-6 py-2 font-bold text-xs text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all uppercase tracking-tight">
            Job Seekers
          </TabsTrigger>
          <TabsTrigger value="recruiter" className="rounded-lg px-6 py-2 font-bold text-xs text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all uppercase tracking-tight">
            Recruiters
          </TabsTrigger>
          {/* <TabsTrigger value="company" className="rounded-lg px-6 py-2 font-bold text-xs text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all uppercase tracking-tight">
            Organizations
          </TabsTrigger> */}
        </TabsList>

        <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 bg-white gap-4">
              <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
              <p className="text-xs font-bold text-slate-400">Syncing directory...</p>
            </div>
          ) : (
            <>
              <TabsContent value="jobseeker" className="m-0">
                <UserTable data={filterUsersByRole('jobseeker')} roleLabel="Job Seeker" />
              </TabsContent>
              <TabsContent value="recruiter" className="m-0">
                <UserTable data={filterUsersByRole('recruiter')} roleLabel="Recruiter" />
              </TabsContent>
              {/* <TabsContent value="company" className="m-0">
                <UserTable data={filterUsersByRole('company')} roleLabel="Company Admin" />
              </TabsContent> */}
            </>
          )}
        </Card>
      </Tabs>

      {/* Edit User Modal - Elegant Style */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-[24px] p-0 border-slate-200 shadow-2xl overflow-hidden bg-white">
          <DialogHeader className="p-8 border-b border-slate-100 bg-white">
            <div className="space-y-1">
               <DialogTitle className="text-2xl font-bold text-[#0f172a] tracking-tight">Account Configuration</DialogTitle>
               <DialogDescription className="text-sm text-slate-500 font-medium">Modify administrative access and account permissions.</DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="flex flex-col bg-white">
            <div className="p-8 space-y-10">
               <div className="flex items-center gap-5 p-5 rounded-xl bg-slate-50/50 border border-slate-100">
                  <Avatar className="h-14 w-14 rounded-xl border border-white shadow-sm">
                    <AvatarImage src={selectedUser?.avatar} className="rounded-xl" />
                    <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                      {selectedUser?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                     <p className="text-sm font-bold text-slate-900">{selectedUser?.name}</p>
                     <p className="text-xs font-medium text-slate-500">{selectedUser?.email}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Assigned Access Role</Label>
                  <Select 
                    value={editForm.role} 
                    onValueChange={(val) => setEditForm({...editForm, role: val})}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 h-12 font-bold text-sm bg-white focus:ring-0 focus:border-emerald-600 transition-all">
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      {Array.isArray(roles) && roles.map(role => (
                        <SelectItem key={role._id} value={role._id} className="text-sm py-2">
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-start gap-2 text-[10px] font-medium text-amber-600 px-1 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                    <AlertCircle size={14} className="shrink-0" /> 
                    <span>Modifying roles will immediately alter user permissions and feature access levels across the platform.</span>
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 justify-end">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl h-11 px-8 font-bold text-sm text-slate-500 hover:bg-slate-100 transition-all" 
                onClick={() => setEditModalOpen(false)}
              >
                Discard
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl h-11 px-8 font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsers;
