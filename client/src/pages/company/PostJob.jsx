import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import { Link } from 'react-router-dom';
import { 
  Form, Input, Button, Card, Select, InputNumber, 
  Switch, Space, Typography, Tag, Tooltip, Row, Col, Alert, Spin, Checkbox
} from 'antd';
import { 
  SaveOutlined, SendOutlined, ArrowLeftOutlined,
  PlusOutlined, InfoCircleOutlined, TagsOutlined, TeamOutlined, CloseOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import { IndianRupee, Briefcase } from 'lucide-react';

const { Title, Text } = Typography;
const { TextArea } = Input;

const API_JOBS_URL = `${import.meta.env.VITE_API_BASE_URL}/jobs`;

const PostJob = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [form] = Form.useForm();
    
    const [loading, setLoading] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [quota, setQuota] = useState(null);
    const [editingJobId, setEditingJobId] = useState(null);
    const [isRangeHidden, setIsRangeHidden] = useState(false);
    const [skills, setSkills] = useState([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const initialize = async () => {
            try {
                setFetching(true);
                // Fetch Quota
                const token = localStorage.getItem('token');
                try {
                    const quotaRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/quota`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setQuota(quotaRes.data);
                } catch {
                    // Quota error is non-critical
                }

                // If editing, fetch jobs to find the job to edit
                const editId = searchParams.get('edit');
                if (editId) {
                    const res = await axios.get(`${API_JOBS_URL}/company-jobs`);
                    const jobToEdit = res.data.find(j => j._id === editId);
                    if (jobToEdit) {
                        setEditingJobId(jobToEdit._id);
                        setSkills(jobToEdit.skillsRequired || []);
                        setIsRangeHidden(jobToEdit.salary?.isRangeHidden || false);
                        
                        form.setFieldsValue({
                            title: jobToEdit.title,
                            description: jobToEdit.description,
                            vacancies: jobToEdit.vacancies,
                            postedAs: jobToEdit.postedAs || 'company',
                            jobType: jobToEdit.jobType || 'Full-time',
                            workMode: jobToEdit.workMode || 'On-site',
                            location: jobToEdit.location,
                            minExperience: jobToEdit.experience?.min || 0,
                            maxExperience: jobToEdit.experience?.max || 0,
                            minSalary: jobToEdit.salary?.min ? jobToEdit.salary.min / 100000 : null,
                            maxSalary: jobToEdit.salary?.max ? jobToEdit.salary.max / 100000 : null,
                            isRangeHidden: jobToEdit.salary?.isRangeHidden,
                            additionalDetails: jobToEdit.additionalDetails || [],
                            applicationQuestions: jobToEdit.applicationQuestions || []
                        });
                    }
                } else {
                    // Initial form defaults
                    form.setFieldsValue({
                        postedAs: user?.company ? 'company' : 'recruiter',
                        jobType: 'Full-time',
                        workMode: 'On-site',
                        vacancies: 1,
                        isRangeHidden: false,
                        applicationQuestions: [
                            { questionText: 'Full Name', type: 'text', isRequired: true, isStandard: true },
                            { questionText: 'Email Address', type: 'text', isRequired: true, isStandard: true },
                            { questionText: 'Phone Number', type: 'text', isRequired: true, isStandard: true },
                            { questionText: 'Resume/CV', type: 'text', isRequired: true, isStandard: true },
                        ]
                    });
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load data");
            } finally {
                setFetching(false);
            }
        };
        initialize();
    }, [searchParams, user, form]);

    const handleCloseSkill = (removedSkill) => {
        const newSkills = skills.filter((skill) => skill !== removedSkill);
        setSkills(newSkills);
    };

    const handleInputConfirm = () => {
        if (inputValue && skills.indexOf(inputValue) === -1) {
            setSkills([...skills, inputValue]);
        }
        setInputValue('');
    };

    const handleSubmit = async (values, status = 'active') => {
        const loadingSetter = status === 'draft' ? setDraftLoading : setLoading;
        loadingSetter(true);
        try {
            const submissionData = {
                title: values.title,
                description: values.description,
                vacancies: values.vacancies,
                experience: { min: values.minExperience || 0, max: values.maxExperience || 0 },
                jobType: values.jobType,
                workMode: values.workMode,
                location: values.location,
                salary: {
                    min: values.minSalary ? Number(values.minSalary) * 100000 : 0,
                    max: values.maxSalary ? Number(values.maxSalary) * 100000 : 0,
                    currency: 'INR',
                    isRangeHidden: isRangeHidden
                },
                skillsRequired: skills,
                additionalDetails: values.additionalDetails || [],
                applicationQuestions: values.applicationQuestions || [],
                postedAs: user?.company ? values.postedAs : 'recruiter',
                status
            };

            if (editingJobId) {
                await axios.put(`${API_JOBS_URL}/${editingJobId}`, submissionData);
                toast.success(status === 'draft' ? "Draft updated!" : "Position published successfully!");
            } else {
                await axios.post(API_JOBS_URL, submissionData);
                toast.success(status === 'draft' ? "Job saved as draft!" : "Job posted successfully!");
            }
            navigate('/company/jobs');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Action failed");
        } finally {
            loadingSetter(false);
        }
    };

    if (fetching) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    const limitReached = quota && !quota.unlimited && quota.used >= quota.limit;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <PageSOPBanner pageKey="postJob" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate('/company/jobs')}
                        shape="circle"
                    />
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            {editingJobId ? 'Edit Job' : 'Post a New Job'}
                        </Title>
                        <Text type="secondary">
                            {editingJobId ? 'Update your recruitment criteria' : 'Specify the details for your new opening'}
                        </Text>
                    </div>
                </div>
                <Space>
                    <Button 
                        icon={<SaveOutlined />} 
                        onClick={() => form.validateFields().then(v => handleSubmit(v, 'draft'))}
                        loading={draftLoading}
                        disabled={loading || limitReached}
                        size="large"
                    >
                        Save Draft
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<SendOutlined />} 
                        onClick={() => form.validateFields().then(v => handleSubmit(v, 'active'))}
                        loading={loading}
                        disabled={draftLoading || limitReached}
                        style={{ backgroundColor: '#10b981' }}
                        size="large"
                    >
                        Publish Job
                    </Button>
                </Space>
            </div>

            {limitReached && (
                <Alert
                    message={`Job posting limit reached (${quota.used}/${quota.limit})`}
                    description={`Your total limit is ${quota.limit} job posting${quota.limit > 1 ? 's' : ''}. Delete an existing job to free up a slot, or upgrade your plan for more.`}
                    type="error"
                    showIcon
                    action={
                        <Link to="/company/subscription">
                            <Button danger size="small">Upgrade Plan</Button>
                        </Link>
                    }
                />
            )}

            <Form
                form={form}
                layout="vertical"
                className="space-y-6"
                style={{ marginTop: '32px' }}
                disabled={limitReached}
            >
                <Row gutter={[24, 24]}>
                    {/* Left Column: Main Details */}
                    <Col xs={24} lg={16}>
                        <Card 
                            title={<span className="font-semibold flex items-center gap-2"><Briefcase className="text-emerald-500" /> Basic Information</span>} 
                            bordered={false}
                            className="shadow-sm rounded-xl overflow-hidden"
                            headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}
                        >
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item 
                                        label="Post Job As" 
                                        name="postedAs"
                                        rules={[{ required: true }]}
                                    >
                                        <Select size="large" disabled={!user?.company}>
                                            <Option value="recruiter">My Profile (Recruiter)</Option>
                                            {user?.company && <Option value="company">Company Account</Option>}
                                            {user?.company && <Option value="both">Both (Company & Recruiter)</Option>}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item 
                                        label="Job Title" 
                                        name="title"
                                        rules={[{ required: true, message: 'Please enter a job title' }]}
                                    >
                                        <Input size="large" placeholder="e.g. Senior Software Engineer" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item 
                                        label="Full Description" 
                                        name="description"
                                        rules={[{ required: true, message: 'Please enter a description' }]}
                                    >
                                        <TextArea rows={8} placeholder="Outline roles, responsibilities, and benefits..." />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        <Card 
                            title={<span className="font-semibold flex items-center gap-2"><TagsOutlined className="text-emerald-500" /> Requirements & Skills</span>} 
                            bordered={false}
                            className="shadow-sm rounded-xl overflow-hidden"
                            style={{ marginTop: '24px' }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}
                        >
                            <Row gutter={16}>
                                <Col xs={12}>
                                    <Form.Item label="Min Experience (Years)" name="minExperience">
                                        <InputNumber min={0} className="w-full" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col xs={12}>
                                    <Form.Item label="Max Experience (Years)" name="maxExperience">
                                        <InputNumber min={0} className="w-full" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Required Skills">
                                        <Space wrap className="mb-2">
                                            {skills.map((skill) => (
                                                <Tag 
                                                    key={skill} 
                                                    closable 
                                                    onClose={() => handleCloseSkill(skill)}
                                                    className="px-3 py-1 text-sm bg-emerald-50 text-emerald-700 border-emerald-200 rounded-md"
                                                    closeIcon={<CloseOutlined className="text-emerald-700" />}
                                                >
                                                    {skill}
                                                </Tag>
                                            ))}
                                        </Space>
                                        <Input
                                            type="text"
                                            size="large"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onPressEnter={(e) => { e.preventDefault(); handleInputConfirm(); }}
                                            placeholder="Type a skill and press Enter"
                                            suffix={<Button type="text" icon={<PlusOutlined />} onClick={handleInputConfirm} />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        <Card 
                            title={<span className="font-semibold flex items-center gap-2"><InfoCircleOutlined className="text-emerald-500" /> Additional Details (Optional)</span>} 
                            bordered={false}
                            className="shadow-sm rounded-xl overflow-hidden"
                            style={{ marginTop: '24px' }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}
                        >
                            <Form.List name="additionalDetails">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'key']}
                                                    rules={[{ required: true, message: 'Missing label' }]}
                                                >
                                                    <Input placeholder="Label (e.g. Shift)" size="large" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'value']}
                                                    rules={[{ required: true, message: 'Missing value' }]}
                                                >
                                                    <Input placeholder="Value (e.g. Night Shift)" size="large" />
                                                </Form.Item>
                                                <Button type="text" danger icon={<CloseOutlined />} onClick={() => remove(name)} />
                                            </Space>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="large">
                                            Add Detail
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </Card>
                    </Col>

                    {/* Right Column: Logistics */}
                    <Col xs={24} lg={8}>
                        <Card 
                            title={<span className="font-semibold flex items-center gap-2"><TeamOutlined className="text-emerald-500" /> Logistics</span>} 
                            bordered={false}
                            className="shadow-sm rounded-xl overflow-hidden"
                            headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}
                        >
                            <Form.Item label="Job Type" name="jobType" rules={[{ required: true }]}>
                                <Select size="large">
                                    <Option value="Full-time">Full-time</Option>
                                    <Option value="Part-time">Part-time</Option>
                                    <Option value="Contract">Contract</Option>
                                    <Option value="Internship">Internship</Option>
                                    <Option value="Freelance">Freelance</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Work Mode" name="workMode" rules={[{ required: true }]}>
                                <Select size="large">
                                    <Option value="On-site">On-site</Option>
                                    <Option value="Remote">Remote</Option>
                                    <Option value="Hybrid">Hybrid</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Location" name="location">
                                <Input size="large" placeholder="e.g. Chennai, India" />
                            </Form.Item>

                            <Form.Item label="Number of Vacancies" name="vacancies">
                                <InputNumber min={1} className="w-full" size="large" />
                            </Form.Item>
                        </Card>

                        <Card 
                            title={<span className="font-semibold flex items-center gap-2"><IndianRupee className="text-emerald-500" size={20} /> Compensation (LPA)</span>} 
                            bordered={false}
                            className="shadow-sm rounded-xl overflow-hidden"
                            style={{ marginTop: '24px' }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}
                        >
                            <Row gutter={16}>
                                <Col xs={12}>
                                    <Form.Item label="Min Salary" name="minSalary">
                                        <InputNumber min={0} step={0.1} className="w-full" size="large" disabled={isRangeHidden} placeholder="e.g. 3.5" />
                                    </Form.Item>
                                </Col>
                                <Col xs={12}>
                                    <Form.Item label="Max Salary" name="maxSalary">
                                        <InputNumber min={0} step={0.1} className="w-full" size="large" disabled={isRangeHidden} placeholder="e.g. 6.0" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item name="isRangeHidden" valuePropName="checked" className="mb-0">
                                <Checkbox onChange={(e) => setIsRangeHidden(e.target.checked)}>
                                    Hide salary range (Show "As per Industry")
                                </Checkbox>
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default PostJob;
