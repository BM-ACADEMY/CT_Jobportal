import React from 'react';
import { TEAM_PERMISSIONS } from '../../config/teamPermissions';

// Shared by MyTeam.jsx's invite form / edit-permissions action and AssignedRequests.jsx's
// accept action — the org admin picks Employee or Recruiter, and only when Recruiter is
// picked, which pages that recruiter can access.
const TeamTypePermissionPicker = ({ type, onTypeChange, permissions, onPermissionsChange, showTypeChoice = true }) => {
  const togglePermission = (key) => {
    if (permissions.includes(key)) {
      onPermissionsChange(permissions.filter(p => p !== key));
    } else {
      onPermissionsChange([...permissions, key]);
    }
  };

  return (
    <div className="space-y-3">
      {showTypeChoice && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
            <input type="radio" name="team-type" checked={type === 'employee'} onChange={() => onTypeChange('employee')} />
            Employee
          </label>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
            <input type="radio" name="team-type" checked={type === 'recruiter'} onChange={() => onTypeChange('recruiter')} />
            Recruiter
          </label>
        </div>
      )}

      {type === 'recruiter' && (
        <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Page Access</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEAM_PERMISSIONS.map(p => (
              <label key={p.key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.includes(p.key)}
                  onChange={() => togglePermission(p.key)}
                  className="rounded"
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamTypePermissionPicker;
