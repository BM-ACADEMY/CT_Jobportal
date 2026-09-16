import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { Table, Avatar, Tag, Card, Typography, Space, Spin } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, WarningOutlined } from '@ant-design/icons';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const { Text } = Typography;
const API = import.meta.env.VITE_API_BASE_URL;

// Read-only "who's on my team" view for delegated team members (recruiters and org_employees).
// Full management (invite/remove/edit-permissions/seat-toggle) is the owner-only /company/team page.
const TeamRoster = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/company/team/roster`, { headers: { Authorization: `Bearer ${token}` } });
        setMembers(res.data);
      } catch {
        toast.error('Failed to load team roster');
      } finally {
        setLoading(false);
      }
    };
    fetchRoster();
  }, []);

  const columns = [
    {
      title: 'Member',
      key: 'member',
      render: (_, record) => (
        <Space size="middle">
          <Avatar 
            size={48} 
            src={record.avatar?.startsWith('http') ? record.avatar : `${import.meta.env.VITE_API_DOMAIN}${record.avatar}`}
            icon={!record.avatar && <UserOutlined />}
            style={{ border: '1px solid #f0f0f0', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 'bold' }}
          >
            {!record.avatar && record.name?.[0]?.toUpperCase()}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ fontSize: '14px', color: '#0f172a' }}>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => {
        let color = 'blue';
        let text = 'Recruiter';
        if (record.role?.name === 'company') {
          color = 'orange';
          text = 'Owner';
        } else if (record.role?.name === 'org_employee') {
          color = 'green';
          text = 'Employee';
        }
        return <Tag color={color} style={{ fontWeight: 'bold', fontSize: '10px', padding: '2px 8px', letterSpacing: '0.05em' }}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Seat Status',
      key: 'status',
      align: 'right',
      render: (_, record) => {
        if (record.role?.name === 'company') return null;
        if (record.isActiveSeat) {
          return (
            <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ fontWeight: 'bold', borderRadius: '12px', padding: '4px 12px', fontSize: '10px', letterSpacing: '0.05em' }}>
              ACTIVE SEAT
            </Tag>
          );
        }
        return (
          <Tag icon={<WarningOutlined />} color="default" style={{ fontWeight: 'bold', borderRadius: '12px', padding: '4px 12px', fontSize: '10px', letterSpacing: '0.05em' }}>
            NO SEAT
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <PageSOPBanner pageKey="teamRoster" />
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
          <Users size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Team</h2>
          <p className="text-sm text-slate-500 mt-0.5">Everyone with access to your organization.</p>
        </div>
      </div>

      <Card 
        bordered={false} 
        style={{ borderRadius: '32px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={members}
          rowKey="_id"
          loading={{ indicator: <Spin size="large" />, spinning: loading }}
          pagination={false}
          showHeader={false}
          style={{ width: '100%' }}
          rowClassName={() => 'hover:bg-slate-50/50 transition-colors cursor-pointer'}
        />
      </Card>
    </div>
  );
};

export default TeamRoster;
