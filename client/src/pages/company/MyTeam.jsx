import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Trash2, Mail, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const MyTeam = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    email: ''
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/company/employees`, { headers });
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/company/employees`, formData, { headers });
      toast.success('Invite sent successfully');
      setFormData({ email: '' });
      setIsAdding(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send invite');
    }
  };

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const handleRemoveEmployee = (id) => setRemoveTarget(id);

  const confirmRemove = async () => {
    setRemoving(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/company/employees/${removeTarget}`, { headers });
      toast.success('Team member removed');
      setRemoveTarget(null);
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to remove team member');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Users size={20} strokeWidth={2.5} />
            </div>
            My Team
          </h2>
          <p className="text-sm text-slate-500 mt-2 ml-1">
            Manage your organization's team members and staff accounts.
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)}
          className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 gap-2"
        >
          <Plus size={18} />
          {isAdding ? 'Cancel' : 'Invite Member'}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Invite Team Member</h3>
          <form onSubmit={handleAddEmployee} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({email: e.target.value})}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 outline-none focus:border-emerald-400 text-sm transition-all"
                  placeholder="john@company.com"
                />
              </div>
            </div>
            <Button type="submit" className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0">
              Send Invite
            </Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Users size={24} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No team members yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              You haven't added anyone to your organization's team. Add members to let them access the platform.
            </p>
            <Button 
              onClick={() => setIsAdding(true)}
              className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Add Your First Member
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {employees.map(emp => (
              <div key={emp._id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 rounded-xl border border-slate-100">
                    <AvatarImage src={emp.avatar?.startsWith('http') ? emp.avatar : `${import.meta.env.VITE_API_DOMAIN}${emp.avatar}`} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold">
                      {emp.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                    <p className="text-xs text-slate-500 mb-1">{emp.email}</p>
                    <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                      {emp.companyProfile?.adminRole || 'Employee'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveEmployee(emp._id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all outline-none"
                  title="Remove Member"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove this member from your team?"
        confirmLabel="Remove"
        destructive
        loading={removing}
        onConfirm={confirmRemove}
      />
    </div>
  );
};

export default MyTeam;
