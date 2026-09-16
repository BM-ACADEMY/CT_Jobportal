import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { QrCode, Calendar, Building2, Megaphone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Typography, Button, Input, Form, Tag, Skeleton, Space, Result } from 'antd';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import PhoneNumberInput from '@/components/shared/PhoneNumberInput';

const { Title, Text, Paragraph } = Typography;
const API_COLLEGE_URL = `${import.meta.env.VITE_API_BASE_URL}/college`;

const CampusDrives = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [drives, setDrives] = useState([]);
  const [joinForm] = Form.useForm();
  const [joining, setJoining] = useState(false);
  const [registeringId, setRegisteringId] = useState(null);
  
  const [reapplyForm] = Form.useForm();
  const [reapplying, setReapplying] = useState(false);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_COLLEGE_URL}/me/drives`);
      setStudent(res.data.student);
      setDrives(res.data.drives || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrives(); }, []);

  // Update reapply form if student was rejected
  useEffect(() => {
    if (student?.idVerification?.status === 'rejected') {
      reapplyForm.setFieldsValue({
        rollNumber: student.rollNumber || '',
        department: student.department || '',
        batchYear: student.batchYear || '',
        phone: student.phone || '',
      });
    }
  }, [student, reapplyForm]);

  const handleJoin = async (values) => {
    const { collegeCode, rollNumber, department, batchYear, phone } = values;
    if (!phone) return toast.error('Phone number is required');
    
    setJoining(true);
    try {
      const res = await axios.post(`${API_COLLEGE_URL}/me/join`, {
        collegeCode: collegeCode.trim(),
        rollNumber: rollNumber.trim(),
        department: department.trim(),
        batchYear: parseInt(batchYear),
        phone: phone.trim(),
      });
      toast.success(res.data.msg || 'Join request sent');
      joinForm.resetFields();
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to join college');
    } finally {
      setJoining(false);
    }
  };

  const handleReapply = async (values) => {
    if (!student?.college?.code) return toast.error('Missing college code');
    const { rollNumber, department, batchYear, phone } = values;
    if (!phone) return toast.error('Phone number is required');

    setReapplying(true);
    try {
      const res = await axios.post(`${API_COLLEGE_URL}/me/join`, {
        collegeCode: student.college.code,
        rollNumber: rollNumber.trim(),
        department: department.trim(),
        batchYear: parseInt(batchYear),
        phone: phone.trim(),
      });
      toast.success(res.data.msg || 'Re-submitted your join request');
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to re-apply');
    } finally {
      setReapplying(false);
    }
  };

  const registerForDrive = async (driveId, e) => {
    e.preventDefault();
    setRegisteringId(driveId);
    try {
      await axios.post(`${API_COLLEGE_URL}/me/drives/${driveId}/register`);
      toast.success('Registered for drive!');
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to register');
    } finally {
      setRegisteringId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-6">
        <Skeleton active paragraph={{ rows: 1 }} />
        <Card bordered={false} className="rounded-none border border-slate-200">
           <Skeleton active avatar paragraph={{ rows: 3 }} />
        </Card>
        <Card bordered={false} className="rounded-none border border-slate-200">
           <Skeleton active avatar paragraph={{ rows: 3 }} />
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-md mx-auto py-16 animate-in fade-in duration-500">
        <div className="text-center mb-6">
          <QrCode size={48} className="text-emerald-500 mx-auto mb-4" />
          <Title level={3} className="m-0 font-black text-slate-900">Join Your College</Title>
          <Paragraph className="text-slate-500 mt-2">
            Link your account to your college's placement portal to see campus drives here.
          </Paragraph>
        </div>
        
        <Card bordered={false} className="rounded-2xl border border-slate-200 shadow-sm" bodyStyle={{ padding: '32px' }}>
          <Form form={joinForm} onFinish={handleJoin} layout="vertical" requiredMark={false}>
            <Form.Item 
              label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">College Code</span>}
              name="collegeCode"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input size="large" placeholder="e.g. SKCT" className="rounded-xl font-medium" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item 
                label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roll Number</span>}
                name="rollNumber"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input size="large" placeholder="e.g. 21CS045" className="rounded-xl font-medium" />
              </Form.Item>
              <Form.Item 
                label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</span>}
                name="department"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input size="large" placeholder="e.g. CSE" className="rounded-xl font-medium" />
              </Form.Item>
              <Form.Item 
                label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Passing Year</span>}
                name="batchYear"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input type="number" size="large" placeholder="e.g. 2026" className="rounded-xl font-medium" />
              </Form.Item>
              <Form.Item 
                label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</span>}
                name="phone"
              >
                <PhoneNumberInput value={joinForm.getFieldValue('phone')} onChange={val => joinForm.setFieldsValue({ phone: val })} />
              </Form.Item>
            </div>

            <Button type="primary" htmlType="submit" size="large" loading={joining} block className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest mt-2">
              Send Join Request
            </Button>
          </Form>
        </Card>
      </div>
    );
  }

  const rejected = student.idVerification?.status === 'rejected';

  return (
    <div className="space-y-6 py-6 animate-in fade-in duration-500">
      <PageSOPBanner pageKey="jobseekerCampusDrives" />
      
      <div className="flex flex-col mb-4">
        <Title level={3} className="m-0 font-black text-slate-900 tracking-tight flex items-center gap-3">
          <QrCode size={24} className="text-emerald-600" /> Campus Drives
        </Title>
        <Text className="text-slate-500 mt-1 font-semibold text-sm">
          {student.college?.name} · Status: <span className="font-bold uppercase text-emerald-600">{rejected ? 'NOT LINKED' : student.placementStatus}</span>
          {student.idVerification?.status === 'pending' && ' · (ID verification pending TPO approval)'}
        </Text>
      </div>

      {rejected ? (
        <Card bordered={false} className="max-w-md mx-auto rounded-2xl border border-rose-200 text-center shadow-sm" bodyStyle={{ padding: '32px' }}>
          <XCircle size={48} className="text-rose-400 mx-auto mb-4" />
          <Title level={4} className="m-0 text-slate-800">Your join request was rejected</Title>
          <Paragraph className="text-slate-500 mt-2 mb-6">
            {student.college?.name} rejected your request to join.
            {student.idVerification?.rejectionReason ? <><br/>Reason: "{student.idVerification.rejectionReason}"</> : ''}
            <br/><br/>Double-check your details below and re-apply.
          </Paragraph>

          <Form form={reapplyForm} onFinish={handleReapply} layout="vertical" requiredMark={false} className="text-left">
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item 
                label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roll Number</span>}
                name="rollNumber"
                rules={[{ required: true }]}
              >
                <Input className="rounded-lg font-medium" />
              </Form.Item>
              <Form.Item 
                label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</span>}
                name="department"
                rules={[{ required: true }]}
              >
                <Input className="rounded-lg font-medium" />
              </Form.Item>
              <Form.Item 
                label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Passing Year</span>}
                name="batchYear"
                rules={[{ required: true }]}
              >
                <Input type="number" className="rounded-lg font-medium" />
              </Form.Item>
              <Form.Item 
                label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</span>}
                name="phone"
              >
                <PhoneNumberInput value={reapplyForm.getFieldValue('phone')} onChange={val => reapplyForm.setFieldsValue({ phone: val })} size="sm" />
              </Form.Item>
            </div>
            <Button type="primary" htmlType="submit" loading={reapplying} block className="rounded-xl bg-emerald-600 font-bold uppercase tracking-widest h-10 mt-2">
              Re-apply
            </Button>
          </Form>
        </Card>
      ) : drives.length === 0 ? (
        <Card bordered={false} className="text-center py-16 rounded-3xl border border-dashed border-slate-200 bg-slate-50 shadow-none">
          <QrCode size={48} className="text-slate-300 mx-auto mb-4" />
          <Title level={4} className="m-0 text-slate-700">No active drives right now</Title>
          <Paragraph className="text-slate-500 mt-2 mb-0">Your TPO will announce new campus drives here.</Paragraph>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {drives.map(drive => {
             const companiesList = drive.companies?.length > 0 ? drive.companies : drive.companyName ? [{ name: drive.companyName, packageLPA: drive.packageLPA }] : [];
             return (
              <Link key={drive._id} to={`/candidate/campus-drives/${drive._id}`} className="block group">
                <Card 
                  bordered={false} 
                  bodyStyle={{ padding: '24px' }}
                  className="rounded-none border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all h-full"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <Title level={4} className="m-0 font-bold text-slate-800 group-hover:text-emerald-700 transition-colors mb-4">
                        {drive.title}
                      </Title>
                      
                      {companiesList.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {companiesList.map((c, i) => (
                            <span key={i} className="inline-flex items-center flex-row gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-xs">
                              <Building2 size={12} className="text-slate-500 shrink-0" /> 
                              <span>{c.name} {c.packageLPA ? <span className="text-slate-400 font-normal ml-1">| {c.packageLPA} LPA</span> : ''}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {drive.description && (
                        <Paragraph className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                          {drive.description}
                        </Paragraph>
                      )}
                      
                      <div className="inline-flex items-center flex-row gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                        <Calendar size={14} className="shrink-0" /> BATCH {drive.batchYear}
                      </div>
                    </div>

                    <div className="shrink-0 mt-4 sm:mt-0">
                      {drive.myApplication ? (
                        <div className="inline-flex items-center flex-row gap-1.5 px-4 py-2 rounded bg-emerald-50 text-emerald-700 font-bold uppercase tracking-widest border border-emerald-100 text-[11px]">
                          <CheckCircle2 size={14} className="shrink-0" /> <span>{drive.myApplication.status}</span>
                        </div>
                      ) : (
                        <Button 
                          disabled={registeringId === drive._id}
                          loading={registeringId === drive._id}
                          onClick={(e) => registerForDrive(drive._id, e)} 
                          className="rounded bg-emerald-600 hover:bg-emerald-700 text-white border-transparent hover:text-white font-bold uppercase tracking-widest px-8 h-9 shadow-none"
                        >
                          Register
                        </Button>
                      )}
                    </div>
                  </div>

                  {drive.announcements?.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                        <Megaphone size={12} /> Recent Announcements
                      </div>
                      <div className="space-y-2">
                        {drive.announcements.slice().reverse().slice(0, 3).map((a, i) => (
                          <div key={i} className="bg-slate-50 rounded-sm p-3 border border-slate-100">
                            <Text strong className="text-slate-800 text-sm block mb-1">{a.title}</Text>
                            {a.message && <Paragraph className="text-slate-500 text-xs mb-1 m-0">{a.message}</Paragraph>}
                            {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold text-xs hover:underline block mt-1">{a.link}</a>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
             );
          })}
        </div>
      )}
    </div>
  );
};

export default CampusDrives;
