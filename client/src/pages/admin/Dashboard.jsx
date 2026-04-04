import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { Users, Building2, Briefcase, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Command Center</h1>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-none shadow-sm bg-blue-600 text-white">
            <Statistic 
              title={<span className="text-blue-100">Total Users</span>} 
              value={12540} 
              prefix={<Users size={20} className="mr-2" />} 
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-none shadow-sm bg-orange-500 text-white">
            <Statistic 
              title={<span className="text-orange-100">Active Jobs</span>} 
              value={842} 
              prefix={<Briefcase size={20} className="mr-2" />} 
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-none shadow-sm bg-purple-600 text-white">
            <Statistic 
              title={<span className="text-purple-100">Companies</span>} 
              value={450} 
              prefix={<Building2 size={20} className="mr-2" />} 
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-none shadow-sm bg-green-600 text-white">
            <Statistic 
              title={<span className="text-green-100">Daily Traffic</span>} 
              value={2400} 
              prefix={<TrendingUp size={20} className="mr-2" />} 
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="mt-8 rounded-2xl shadow-sm border-gray-100">
        <h3 className="text-lg font-bold mb-4">Recent System Logs</h3>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">New user registered: user_{i}@example.com</span>
              <span className="text-xs text-gray-400">2 mins ago</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
