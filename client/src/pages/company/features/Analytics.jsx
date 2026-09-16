import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2, TrendingUp, Eye, Users, Briefcase, Clock, Loader2 } from 'lucide-react';
import { Card, Row, Col, Progress, Spin, Typography } from 'antd';
import FeatureGate from '@/components/subscription/FeatureGate';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const { Title, Text } = Typography;

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const monthlyValues = data?.monthlyData?.map(m => m.count) || [];
  const maxMonthly = Math.max(...monthlyValues, 1);

  const funnel = data
    ? [
        { label: 'Applications', value: data.totalApplicants ?? 0 },
        { label: 'Reviewed', value: data.reviewed ?? 0 },
        { label: 'Shortlisted', value: data.shortlisted ?? 0 },
        { label: 'Rejected', value: data.rejected ?? 0 },
      ]
    : [];

  const funnelMax = funnel[0]?.value || 1;

  return (
    <FeatureGate
      featureKey="hasAnalyticsDashboard"
      featureName="Analytics Dashboard"
      description="Deep insights into your job post performance, candidate funnels, and hiring efficiency metrics."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-8 pb-12">
        <PageSOPBanner pageKey="analytics" />
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <BarChart2 size={16} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Analytics Dashboard</h1>
          </div>
          <p className="text-sm text-slate-500">Monitor hiring performance and optimize your recruitment funnel.</p>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <Row gutter={[16, 16]}>
              {[
                { label: 'Total Jobs', value: data?.totalJobs ?? 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Applications', value: data?.totalApplicants ?? 0, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Active Jobs', value: data?.activeJobs ?? 0, icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Shortlisted', value: data?.shortlisted ?? 0, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(k => (
                <Col xs={12} sm={6} key={k.label}>
                  <Card bordered={false} className="shadow-sm rounded-xl h-full">
                    <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <k.icon size={18} className={k.color} />
                    </div>
                    <Title level={3} style={{ margin: 0 }}>{k.value.toLocaleString()}</Title>
                    <Text type="secondary" className="text-xs">{k.label}</Text>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Monthly Applications Chart */}
            {monthlyValues.length > 0 && (
              <Card 
                title={<span className="font-semibold">Monthly Applications (Last 12 Months)</span>}
                bordered={false} 
                className="shadow-sm rounded-xl mt-6"
                extra={
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <TrendingUp size={13} /> Live Data
                  </div>
                }
              >
                <div className="flex items-end gap-2 h-32 mt-2">
                  {data.monthlyData.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">{m.count || ''}</span>
                      <div
                        className="w-full bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600 min-h-[4px]"
                        style={{ height: `${(m.count / maxMonthly) * 100}%` }}
                        title={`${m.month}: ${m.count} applications`}
                      />
                      <span className="text-[10px] font-semibold text-slate-500">{m.month.slice(0, 1)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Row gutter={[24, 24]} className="mt-6">
              {/* Hiring Funnel */}
              <Col xs={24} sm={12}>
                <Card title={<span className="font-semibold">Hiring Funnel</span>} bordered={false} className="shadow-sm rounded-xl h-full">
                  <div className="space-y-4 pt-2">
                    {funnel.map((f, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{f.label}</span>
                          <span className="text-sm font-bold text-slate-900">{f.value.toLocaleString()}</span>
                        </div>
                        <Progress 
                          percent={funnelMax > 0 ? (f.value / funnelMax) * 100 : 0} 
                          showInfo={false} 
                          strokeColor="#8b5cf6" 
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>

              {/* Conversion Rates */}
              <Col xs={24} sm={12}>
                <Card title={<span className="font-semibold">Conversion Rates</span>} bordered={false} className="shadow-sm rounded-xl h-full">
                  <div className="space-y-5 pt-2">
                    {[
                      {
                        label: 'Review Rate',
                        value: data?.totalApplicants
                          ? Math.round(((data.reviewed || 0) / data.totalApplicants) * 100)
                          : 0,
                        color: '#3b82f6',
                      },
                      {
                        label: 'Shortlist Rate',
                        value: data?.totalApplicants
                          ? Math.round(((data.shortlisted || 0) / data.totalApplicants) * 100)
                          : 0,
                        color: '#10b981',
                      },
                      {
                        label: 'Rejection Rate',
                        value: data?.totalApplicants
                          ? Math.round(((data.rejected || 0) / data.totalApplicants) * 100)
                          : 0,
                        color: '#fb7185',
                      },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{r.label}</span>
                          <span className="text-sm font-bold text-slate-900">{r.value}%</span>
                        </div>
                        <Progress 
                          percent={r.value} 
                          showInfo={false} 
                          strokeColor={r.color} 
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                  {data?.totalApplicants === 0 && (
                    <p className="text-xs text-slate-400 text-center mt-6">
                      No applicants yet. Post jobs to start seeing metrics.
                    </p>
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </FeatureGate>
  );
};

export default Analytics;
