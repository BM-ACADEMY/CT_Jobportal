import React from 'react';
import { Card, Row, Col, Button, Tag, Avatar } from 'antd';
import { UserPlus, Briefcase, FileText, Share2, Plus } from 'lucide-react';

const CompanyDashboard = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recruiter Dashboard</h1>
        <Button type="primary" icon={<Plus size={16} />} className="rounded-full font-bold h-10 px-6">
          Post a New Job
        </Button>
      </div>
      
      <Row gutter={[16, 16]}>
        {/* Quick Actions */}
        <Col xs={24} md={6}>
          <div className="flex flex-col gap-4">
            <Card className="rounded-2xl shadow-sm border-none bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer group">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                     <UserPlus size={24} />
                  </div>
                  <div>
                     <p className="text-sm font-bold text-gray-800">Invite Candidate</p>
                     <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Growth Plan</p>
                  </div>
               </div>
            </Card>
          </div>
        </Col>
        
        {/* Main Stats */}
        <Col xs={24} md={18}>
           <Card className="rounded-2xl border-none shadow-sm p-2">
              <div className="flex items-center justify-around py-4">
                 <div className="text-center px-8 border-r border-gray-100">
                    <p className="text-3xl font-black text-blue-600">12</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Active Postings</p>
                 </div>
                 <div className="text-center px-8 border-r border-gray-100">
                    <p className="text-3xl font-black text-orange-500">248</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">New Applicants</p>
                 </div>
                 <div className="text-center px-8">
                    <p className="text-3xl font-black text-purple-600">08</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Interviews Set</p>
                 </div>
              </div>
           </Card>
        </Col>
      </Row>

      <div className="mt-8">
         <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-blue-500" /> Recent Job Postings
         </h2>
         <div className="space-y-4">
            {[1, 2].map(i => (
               <Card key={i} className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                     <div className="flex gap-4">
                        <Avatar size={48} shape="square" className="bg-gray-100 rounded-lg">JD</Avatar>
                        <div>
                           <h4 className="text-base font-bold text-gray-800">Senior Product Designer (UX/UI)</h4>
                           <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
                              Full-time • Remote • Posted 2 days ago
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <Tag color="blue" className="rounded-full border-none px-3 font-bold">128 New</Tag>
                        <Button type="text" shape="circle" icon={<Share2 size={16} />} />
                     </div>
                  </div>
               </Card>
            ))}
         </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
