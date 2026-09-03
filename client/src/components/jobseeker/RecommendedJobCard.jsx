import React from 'react';
import { Card, Typography } from 'antd';
import { MapPin, Briefcase, Star } from 'lucide-react';

const { Text, Title } = Typography;

const RecommendedJobCard = ({ job }) => {
  // Generate a predictable but varied color based on company name
  const colors = ['#eab308', '#334155', '#22c55e', '#0284c7', '#ea580c', '#7c3aed'];
  const colorIndex = job.company ? job.company.charCodeAt(0) % colors.length : 0;
  const bgColor = colors[colorIndex];

  return (
    <Card
      bordered={false}
      bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      className="min-w-[280px] w-[280px] hover:shadow-lg transition-all cursor-pointer group bg-white overflow-hidden shadow-sm border border-slate-100 rounded-none h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4 min-w-0">
          {job.logo && job.logo !== '/default-company-logo.png' && !job.logo.includes('default') ? (
            <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0 border border-slate-100">
              <img src={job.logo} alt={job.company} className="max-w-full max-h-full p-2 object-contain" />
            </div>
          ) : (
            <div
              className="w-14 h-14 flex items-center justify-center text-white shrink-0 font-black text-xl"
              style={{ backgroundColor: bgColor }}
            >
              {job.company?.[0]?.toUpperCase() || <Briefcase size={24} />}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Text className="text-slate-600 font-semibold text-xs truncate" title={job.company}>
                {job.company}
              </Text>
              {job.rating && (
                <>
                  <div className="h-3 w-px bg-slate-200 shrink-0" />
                  <div className="flex items-center gap-0.5 text-[10px] font-black text-green-600 shrink-0">
                    {job.rating} <Star size={10} className="fill-green-600" />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-400 mt-0.5">
              <MapPin size={10} className="shrink-0" />
              <Text className="text-[10px] text-slate-400 truncate">{job.location}</Text>
            </div>
          </div>
        </div>
        <div className="shrink-0 ml-2">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{job.postedAt}</span>
        </div>
      </div>

      <div className="space-y-4">
        <Title level={5} className="m-0 text-[17px] font-semibold text-slate-700 line-clamp-1 group-hover:text-blue-600 transition-colors" title={job.title}>
          {job.title}
        </Title>

        <div className="flex flex-col gap-1 mt-3">
          <Text className="text-slate-400 font-semibold text-[11px]">
            {job.salary || 'Salary Not Disclosed'}
          </Text>
          <Text className="text-slate-400 font-semibold text-[11px]">
            {job.experience || 'Experience Not Specified'}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default RecommendedJobCard;
