import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, FileText, MessageCircle, Users, Settings,
  Building2, CheckCircle2, ArrowRight, Sparkles, Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasFeature } from '@/components/subscription/FeatureGate';
import { Card, Typography, Row, Col, Tag, Avatar, Button } from 'antd';

const { Title, Text } = Typography;

const QuickCard = ({ icon: Icon, label, desc, to, solidBgColor }) => {
  const navigate = useNavigate();
  return (
    <Card
      hoverable
      onClick={() => navigate(to)}
      className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group h-full min-h-[160px] overflow-hidden relative rounded-sm"
      style={{ backgroundColor: solidBgColor }}
      styles={{ body: { padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      {/* Decorative overlapping circles */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-4">
          <Icon size={24} color="white" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 mt-auto pt-4">
          <Text strong style={{ color: 'rgba(255, 255, 255, 0.9)' }} className="text-[10px] uppercase tracking-widest mb-2 block">
            {label}
          </Text>
          <Text style={{ color: '#ffffff' }} className="text-sm font-semibold leading-snug block">
            {desc}
          </Text>
        </div>
      </div>
    </Card>
  );
};

const PlanFeatureRow = ({ label, active }) => (
  <div className="flex items-center gap-2.5">
    <CheckCircle2 size={13} className={active ? 'text-emerald-500' : 'text-slate-200'} />
    <Text className={`text-xs font-medium ${active ? 'text-slate-600' : 'text-slate-400'}`}>{label}</Text>
    {!active && <Lock size={10} className="text-slate-300" />}
  </div>
);

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const companyName = user?.employerCompanyName || 'Your Organization';
  const planName = user?.subscription?.name || null;

  const planFeatures = [
    { label: 'Video Interview',      key: 'hasVideoInterview' },
    { label: 'Interview Scheduling', key: 'hasInterviewScheduling' },
    { label: 'Bulk Messaging',       key: 'hasBulkMessaging' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Welcome Header matching Job Seeker portal style */}
      <Card 
        bordered={false} 
        styles={{ body: { padding: 0 } }} 
        style={{ background: 'linear-gradient(135deg, #1b496d 0%, #153e5e 50%, #0d2e49 100%)', borderRadius: 0 }} 
        className="relative shadow-sm overflow-hidden group"
      >
        <div className="p-8 sm:p-10 relative z-10">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#34b678] rounded-none flex items-center justify-center border border-white/10 shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                 <div className="flex items-center gap-3 mb-2">
                   <Tag style={{ background: 'rgba(52, 182, 120, 0.2)', borderColor: 'rgba(52, 182, 120, 0.3)', color: '#34b678', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', fontSize: 9, padding: '2px 8px', borderRadius: 0 }}>
                     {companyName}
                   </Tag>
                   {planName && (
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">
                       PLAN: <span className="text-[#34b678]">{planName} TIER</span>
                     </p>
                   )}
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tight m-0">Welcome back, {user?.name?.split(' ')[0] || 'Employee'}</h2>
                 <p className="text-xs text-slate-400 font-medium max-w-xl leading-relaxed mt-1 m-0">
                   Post openings, review candidates, and manage hiring alongside your organization's team.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-6 px-4 sm:px-0 mt-12">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
           <Sparkles size={12} className="text-emerald-500" /> Quick Access
        </Text>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <QuickCard
              icon={Briefcase}
              label="My Jobs"
              desc="View and manage your posted openings."
              to="/company/jobs"
              solidBgColor="#8b5cf6"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <QuickCard
              icon={FileText}
              label="Post Job"
              desc="Create a new job opening."
              to="/company/jobs/new"
              solidBgColor="#f97316"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <QuickCard
              icon={Users}
              label="Find Candidates"
              desc="Search and shortlist candidates."
              to="/company/candidates"
              solidBgColor="#10b981"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <QuickCard
              icon={MessageCircle}
              label="Messages"
              desc="Communicate with candidates and your team."
              to="/company/messages"
              solidBgColor="#f43f5e"
            />
          </Col>
        </Row>
      </div>

      <Row gutter={[32, 32]} className="px-4 sm:px-0 mt-2">
        {/* Organization plan */}
        <Col xs={24} md={12}>
          <Card 
            bordered={false}
            className="rounded-[32px] shadow-sm hover:shadow-lg transition-all duration-500 h-full"
            styles={{ body: { padding: '32px' } }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Sparkles size={20} className="text-emerald-600" />
              </div>
              <div>
                 <Title level={4} className="!text-lg !font-bold !text-slate-800 tracking-tight !m-0">Organization Plan</Title>
                 <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">Available Features</Text>
              </div>
            </div>
            
            {planName ? (
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl">
                <Text className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4 block">{planName} — Active Capability</Text>
                <div className="space-y-3">
                   {planFeatures.map(f => (
                     <PlanFeatureRow key={f.key} label={f.label} active={hasFeature(user, f.key)} />
                   ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Building2 size={24} className="text-slate-300 mx-auto mb-2" />
                <Text strong className="text-sm text-slate-500 block">No active plan assigned</Text>
                <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1 block">Contact your organization admin.</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Profile & settings */}
        <Col xs={24} md={12}>
          <Card 
            bordered={false}
            className="rounded-[32px] shadow-sm hover:shadow-lg transition-all duration-500 h-full flex flex-col"
            styles={{ body: { padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' } }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Settings size={20} className="text-slate-600" />
              </div>
              <div>
                 <Title level={4} className="!text-lg !font-bold !text-slate-800 tracking-tight !m-0">Your Profile</Title>
                 <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">Account Settings</Text>
              </div>
            </div>
            
            <div className="flex items-center gap-5 mb-8 bg-slate-50 p-6 rounded-2xl">
              <div className="relative">
                <Avatar 
                  size={64}
                  src={user?.avatar}
                  className="bg-slate-300 flex items-center justify-center text-slate-500 font-bold text-2xl shrink-0"
                  shape="circle"
                >
                  {!user?.avatar && (user?.name?.[0]?.toUpperCase() || '')}
                </Avatar>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-50"></div>
              </div>
              <div>
                <Text strong className="text-lg font-bold text-slate-800 tracking-tight block">{user?.name}</Text>
                <Text className="text-xs font-medium text-slate-500 mb-1 block">{user?.email}</Text>
                <Tag bordered={false} className="text-[10px] text-slate-800 font-bold uppercase tracking-[0.1em] bg-slate-200/70 px-2 py-0.5 rounded-md mt-1 m-0">
                  {companyName}
                </Tag>
              </div>
            </div>
            
            <div className="mt-auto flex justify-center">
               <Button 
                 type="text" 
                 onClick={() => navigate('/employee/settings')}
                 className="flex items-center gap-3 px-6 py-6 rounded-2xl hover:bg-slate-50 transition-all duration-300 group"
               >
                 <span className="text-xs font-bold text-slate-600 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Edit Profile & Settings</span>
                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                 </div>
               </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDashboard;
