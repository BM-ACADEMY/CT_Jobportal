import React from 'react';
import { Card, Row, Col, List, Tag } from 'antd';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const SubAdminDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Operational Dashboard (Sub-Admin)</h1>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="rounded-2xl border-none shadow-sm mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" /> Pending Moderations
            </h2>
            <List
              itemLayout="horizontal"
              dataSource={[
                { title: 'New Job: Senior React Dev', time: '10 mins ago', type: 'Job' },
                { title: 'Company Update: TechNova Inc', time: '45 mins ago', type: 'Company' },
                { title: 'Reported User: bad_actor_123', time: '1 hour ago', type: 'User' },
              ]}
              renderItem={item => (
                <List.Item actions={[<a className="text-blue-600 font-bold">Review</a>]}>
                  <List.Item.Meta
                    title={<span className="text-sm font-bold text-gray-800">{item.title}</span>}
                    description={<div className="flex gap-2 items-center"><Tag color="blue">{item.type}</Tag> <span className="text-xs text-gray-400">{item.time}</span></div>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card className="rounded-2xl border-none shadow-sm h-full bg-blue-50/50">
             <h2 className="text-lg font-bold mb-4">My Stats</h2>
             <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-500" size={20} />
                      <span className="text-sm font-bold text-gray-600">Processed</span>
                   </div>
                   <span className="text-xl font-bold text-gray-800">42</span>
                </div>
                <div className="p-4 bg-white rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <AlertTriangle className="text-orange-500" size={20} />
                      <span className="text-sm font-bold text-gray-600">Escalated</span>
                   </div>
                   <span className="text-xl font-bold text-gray-800">03</span>
                </div>
             </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SubAdminDashboard;
