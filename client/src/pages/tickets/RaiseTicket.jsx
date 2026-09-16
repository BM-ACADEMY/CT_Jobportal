import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Steps,
  Card,
  Radio,
  Input,
  Select,
  Button,
  Checkbox,
  Upload,
  Typography,
  Space,
  Form
} from 'antd';
import {
  SendOutlined,
  LeftOutlined,
  RightOutlined,
  UploadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const API = import.meta.env.VITE_API_BASE_URL;

const ROLE_PLANS = {
  jobseeker: ['Plus', 'Premium'],
  recruiter: ['Pro', 'Elite'],
  company: ['Starter', 'Business', 'Enterprise'],
  college: ['Lite', 'Pro', 'Elite'],
};

const CATEGORIES = [
  { value: 'subscription_gating', label: 'Subscription & Plan Gating' },
  { value: 'payment_checkout', label: 'Payment Processing & Checkout' },
  { value: 'refunds_invoicing', label: 'Refunds & Invoicing' },
  { value: 'platform_errors', label: 'Core Features & Platform Errors' },
  { value: 'others', label: 'Others (Custom Input)' },
];

const SEVERITIES = [
  { value: 'critical', label: 'Critical (P1)', desc: 'Revenue stopping, payment failed, or site completely broken' },
  { value: 'major', label: 'Major (P2)', desc: 'Core features like ATS or AI matching experiencing errors' },
  { value: 'minor', label: 'Minor (P3)', desc: 'Text typos, cosmetic UI issues, or missing branding assets' },
];

const stepsContent = [
  { title: 'Context' },
  { title: 'Diagnostics' },
  { title: 'Submit' },
];

const RaiseTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [logFile, setLogFile] = useState(null);

  const [form, setForm] = useState({
    userRole: user?.role || 'jobseeker',
    accountIdentity: user?.email || '',
    category: '',
    diagnostics: {},
    severity: '',
    diagnosticsConsent: false,
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setDiag = (field, value) => setForm(f => ({ ...f, diagnostics: { ...f.diagnostics, [field]: value } }));

  const canProceedStep0 = form.userRole && form.accountIdentity && form.category;
  const canSubmit = form.severity && form.diagnosticsConsent;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('userRole', form.userRole);
      fd.append('accountIdentity', form.accountIdentity);
      fd.append('category', form.category);
      fd.append('diagnostics', JSON.stringify(form.diagnostics));
      fd.append('severity', form.severity);
      fd.append('diagnosticsConsent', form.diagnosticsConsent);
      if (logFile) fd.append('errorLogFile', logFile);

      await axios.post(`${API}/tickets`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Ticket raised successfully! We will respond within 24 hours.');
      navigate('/tickets/my');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setLogFile(null);
    },
    beforeUpload: (file) => {
      setLogFile(file);
      return false;
    },
    fileList: logFile ? [logFile] : [],
    accept: ".txt,.log,.json",
    maxCount: 1
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Raise a Support Ticket</Title>
        <Text type="secondary">Our team will review your request and respond within 24 hours.</Text>
      </div>

      {/* Step Indicator */}
      <Steps current={current} items={stepsContent} style={{ marginBottom: 40 }} />

      {/* Content Cards */}
      <Card bordered={false} className="shadow-sm" style={{ borderRadius: 16 }}>
        {current === 0 && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={5}>Step 1: Establish Context</Title>
            
            <Form layout="vertical">
              <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Your Role</Text>}>
                <Radio.Group 
                  value={form.userRole} 
                  onChange={e => set('userRole', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="horizontal" wrap>
                    <Radio.Button value="jobseeker">Job Seeker</Radio.Button>
                    <Radio.Button value="recruiter">Recruiter</Radio.Button>
                    <Radio.Button value="company">Organization</Radio.Button>
                    <Radio.Button value="college">College / TPO</Radio.Button>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>User ID / Registered Email</Text>}>
                <Input
                  size="large"
                  value={form.accountIdentity}
                  onChange={e => set('accountIdentity', e.target.value)}
                  placeholder="e.g. JS26-00123 or you@example.com"
                />
              </Form.Item>

              <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Issue Category</Text>}>
                <Radio.Group 
                  value={form.category} 
                  onChange={e => set('category', e.target.value)}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {CATEGORIES.map(cat => (
                    <Radio.Button key={cat.value} value={cat.value} style={{ width: '100%', textAlign: 'left', borderRadius: 8, height: 'auto', padding: '10px 15px' }}>
                      {cat.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Form>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" size="large" disabled={!canProceedStep0} onClick={() => setCurrent(1)}>
                Continue <RightOutlined />
              </Button>
            </div>
          </Space>
        )}

        {current === 1 && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={5}>Step 2: Provide Diagnostics</Title>

            <Form layout="vertical">
              {form.category === 'subscription_gating' && (
                <>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Impacted Plan</Text>}>
                    <Select
                      size="large"
                      value={form.diagnostics.impactedPlan}
                      onChange={val => setDiag('impactedPlan', val)}
                      placeholder="Select plan…"
                      options={(ROLE_PLANS[form.userRole] || []).map(p => ({ value: p, label: p }))}
                    />
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Gated Feature Encountered</Text>}>
                    <Select
                      size="large"
                      value={form.diagnostics.gatedFeature}
                      onChange={val => setDiag('gatedFeature', val)}
                      placeholder="Select feature…"
                      options={['AI Resume Review', 'Candidate DB Export', 'Branded Careers Page', 'Video Interview Integration', 'Auto-Generated Reports'].map(f => ({ value: f, label: f }))}
                    />
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Error Type</Text>}>
                    <Radio.Group value={form.diagnostics.errorType} onChange={e => setDiag('errorType', e.target.value)}>
                      <Space>
                        <Radio.Button value="Plan Limit Reached Prematurely">Plan Limit Reached Prematurely</Radio.Button>
                        <Radio.Button value="Feature Blocked Incorrectly">Feature Blocked Incorrectly</Radio.Button>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </>
              )}

              {form.category === 'payment_checkout' && (
                <>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Payment Gateway</Text>}>
                    <Radio.Group value={form.diagnostics.paymentGateway} onChange={e => setDiag('paymentGateway', e.target.value)}>
                      <Radio.Button value="Razorpay">Razorpay</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Payment Mode</Text>}>
                    <Select
                      size="large"
                      value={form.diagnostics.paymentMode}
                      onChange={val => setDiag('paymentMode', val)}
                      placeholder="Select mode…"
                      options={['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'].map(m => ({ value: m, label: m }))}
                    />
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Transaction State</Text>}>
                    <Radio.Group value={form.diagnostics.transactionState} onChange={e => setDiag('transactionState', e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['Failed at Gateway', 'Deducted but Order Not Created', 'Pending / Timeout'].map(s => (
                        <Radio.Button key={s} value={s}>{s}</Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </>
              )}

              {form.category === 'refunds_invoicing' && (
                <>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Transaction ID / Payment Reference</Text>}>
                    <Input size="large" value={form.diagnostics.transactionId} onChange={e => setDiag('transactionId', e.target.value)} placeholder="e.g. pay_PkHFxyz123" />
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Billing Invoice Number</Text>}>
                    <Input size="large" value={form.diagnostics.invoiceNumber} onChange={e => setDiag('invoiceNumber', e.target.value)} placeholder="e.g. INV/2026/A1B2C3" />
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Requested Action</Text>}>
                    <Select
                      size="large"
                      value={form.diagnostics.requestedAction}
                      onChange={val => setDiag('requestedAction', val)}
                      placeholder="Select action…"
                      options={['Full Refund Request', 'Missing PDF Invoice', 'Invoice Correction', 'Duplicate Charge Dispute'].map(a => ({ value: a, label: a }))}
                    />
                  </Form.Item>
                </>
              )}

              {form.category === 'platform_errors' && (
                <>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Impacted Sub-System</Text>}>
                    <Select
                      size="large"
                      value={form.diagnostics.impactedSubsystem}
                      onChange={val => setDiag('impactedSubsystem', val)}
                      placeholder="Select sub-system…"
                      options={['ATS Pipeline Dashboard', 'AI Candidate Matching', 'Video Interview Sync', 'Campus Drive QR Registration', 'Job Search & Filters', 'Resume Builder', 'Messaging System'].map(s => ({ value: s, label: s }))}
                    />
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Environment</Text>}>
                    <Radio.Group value={form.diagnostics.environmentContext} onChange={e => setDiag('environmentContext', e.target.value)}>
                      <Radio.Button value="Production">Production (app.)</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Attach Console / Error Log (optional)</Text>}>
                    <Dragger {...uploadProps}>
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                      </p>
                      <p className="ant-upload-text">Click or drag file to this area to upload</p>
                      <p className="ant-upload-hint">Support for a single .txt, .log, or .json file. Max 5 MB.</p>
                    </Dragger>
                  </Form.Item>
                </>
              )}

              {form.category === 'others' && (
                <>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Area of Concern</Text>}>
                    <Input size="large" value={form.diagnostics.areaOfConcern} onChange={e => setDiag('areaOfConcern', e.target.value)} placeholder="e.g. Feature Request, Data Compliance Query" />
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Detailed Description</Text>}>
                    <TextArea
                      size="large"
                      rows={5}
                      value={form.diagnostics.detailedDescription}
                      onChange={e => setDiag('detailedDescription', e.target.value)}
                      placeholder="Please provide a step-by-step description of what you were doing when the issue occurred, including any visible error codes or unusual platform behaviors."
                    />
                  </Form.Item>
                  <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>System Action Impacted</Text>}>
                    <Select
                      size="large"
                      value={form.diagnostics.systemActionImpacted}
                      onChange={val => setDiag('systemActionImpacted', val)}
                      placeholder="Select impact level…"
                      options={['Blocks Workflow Entirely', 'Annoying but Manageable Workaround Available', 'General Question'].map(i => ({ value: i, label: i }))}
                    />
                  </Form.Item>
                </>
              )}
            </Form>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <Button size="large" onClick={() => setCurrent(0)}>
                <LeftOutlined /> Back
              </Button>
              <Button type="primary" size="large" onClick={() => setCurrent(2)}>
                Continue <RightOutlined />
              </Button>
            </div>
          </Space>
        )}

        {current === 2 && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={5}>Step 3: Finalize & Submit</Title>

            <Form layout="vertical">
              <Form.Item label={<Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: 12 }}>Impact Severity</Text>}>
                <Radio.Group 
                  value={form.severity} 
                  onChange={e => set('severity', e.target.value)}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {SEVERITIES.map(sev => (
                    <Radio.Button key={sev.value} value={sev.value} style={{ height: 'auto', padding: '15px', borderRadius: 8, textAlign: 'left' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 24 }}>
                          {sev.value === 'critical' ? '🔴' : sev.value === 'major' ? '🟡' : '🔵'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{sev.label}</div>
                          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{sev.desc}</div>
                        </div>
                      </div>
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Form>

            <Card size="small" style={{ backgroundColor: '#f8fafc', border: 'none' }}>
              <Title level={5} style={{ marginTop: 0 }}>Ticket Summary</Title>
              <Text type="secondary">Role:</Text> <Text strong style={{ textTransform: 'capitalize' }}>{form.userRole}</Text><br/>
              <Text type="secondary">Category:</Text> <Text strong>{CATEGORIES.find(c => c.value === form.category)?.label}</Text><br/>
              <Text type="secondary">Account:</Text> <Text strong>{form.accountIdentity}</Text>
            </Card>

            <Checkbox 
              checked={form.diagnosticsConsent}
              onChange={e => set('diagnosticsConsent', e.target.checked)}
            >
              <Text type="secondary" style={{ fontSize: 13 }}>
                I authorize support personnel to securely review the metadata payload associated with my user ID (<Text code>users.id</Text>) for resolution purposes.
              </Text>
            </Checkbox>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <Button size="large" onClick={() => setCurrent(1)}>
                <LeftOutlined /> Back
              </Button>
              <Button 
                type="primary" 
                size="large" 
                onClick={handleSubmit} 
                disabled={!canSubmit || submitting}
                loading={submitting}
                icon={<SendOutlined />}
              >
                Submit Ticket
              </Button>
            </div>
          </Space>
        )}
      </Card>
    </div>
  );
};

export default RaiseTicket;
