import React from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Users, ClipboardList, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STAFF_PERMISSIONS, STAFF_ROLES } from '../../config/staffPermissions';

const ICONS = { '/admin/tickets': Headphones, '/admin/users': Users, '/admin/requests': ClipboardList, '/admin/colleges': GraduationCap };

// Home page for platform staff (role subadmin). Lists only the areas the Super Admin has granted.
// Replaces the earlier mock "Operational Dashboard", which showed invented queue items.
const StaffHome = () => {
  const { user } = useAuth();
  const permissions = user?.staff?.permissions || [];
  const roleLabel = STAFF_ROLES[user?.staff?.role]?.label || 'Staff';
  const areas = STAFF_PERMISSIONS.filter((p) => p.path && permissions.includes(p.key)).map((p) => ({
    ...p,
    extras: STAFF_PERMISSIONS.filter((q) => q.area === p.area && !q.path && permissions.includes(q.key)).map((q) => q.label),
  }));

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600 m-0 mb-2">{roleLabel}</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</h1>
        <p className="text-slate-500 mt-2 m-0">These are the areas you can work in. Anything else on the platform is outside your account's permissions.</p>
      </div>

      {areas.length === 0 ? (
        <div className="border border-dashed border-slate-200 p-8 text-center">
          <ShieldCheck size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 m-0">No areas have been assigned to you yet.</p>
          <p className="text-sm text-slate-500 mt-1 m-0">Ask the Super Admin to set your permissions under Admin &gt; Staff.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {areas.map((a) => {
            const Icon = ICONS[a.path] || ClipboardList;
            return (
              <Link key={a.key} to={a.path} className="group border border-slate-200 bg-white p-6 hover:border-emerald-300 transition-colors no-underline">
                <Icon size={22} className="text-emerald-600 mb-4" />
                <h2 className="text-base font-bold text-slate-900 m-0">{a.area}</h2>
                <p className="text-sm text-slate-500 mt-1 m-0">{a.extras.length ? a.extras.join('. ') + '.' : 'Read-only.'}</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-4">Open <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 m-0">Need something you cannot see here? Raise a ticket under Help &amp; Support and the Super Admin can extend your permissions.</p>
    </div>
  );
};

export default StaffHome;
