import React from 'react';
import { Card, Tag, Button } from 'antd';
import { Star, MapPin, Clock } from 'lucide-react';

const RecommendedJobCard = ({ job }) => {
  return (
    <Card 
      className="min-w-[280px] w-[280px] h-[180px] rounded-2xl border border-gray-100 hover:shadow-md transition-all cursor-pointer group p-0 overflow-hidden"
      bodyStyle={{ padding: '20px' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-lg border border-gray-50 flex items-center justify-center p-2 shadow-sm overflow-hidden bg-white">
          <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
          {job.postedAt}
        </span>
      </div>

      <h4 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">
        {job.title}
      </h4>
      
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-500">{job.company}</span>
        <div className="flex items-center text-[10px] font-bold text-green-600">
          {job.rating} <Star size={10} className="ml-0.5 fill-green-600" />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
        <div className="flex items-center gap-1">
          <MapPin size={12} />
          <span>{job.location}</span>
        </div>
      </div>
    </Card>
  );
};

export default RecommendedJobCard;
