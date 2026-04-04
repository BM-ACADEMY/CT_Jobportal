import React from 'react';
import { Card, Tag, Button, Checkbox, Tooltip } from 'antd';
import { Briefcase, MapPin, Building2, Clock, Globe, Bookmark, EyeOff, Star } from 'lucide-react';

const DetailedJobCard = ({ job }) => {
  return (
    <Card 
      className="mb-4 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div className="flex gap-4">
        {/* Checkbox for Bulk Selection */}
        <div className="pt-1">
          <Checkbox className="rounded" />
        </div>

        {/* Job Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-gray-600">{job.company}</span>
                <div className="flex items-center text-xs font-bold px-1.5 py-0.5 rounded-sm bg-green-50 text-green-700">
                  {job.rating} <Star size={12} className="inline ml-1 fill-green-700" />
                </div>
                <span className="text-gray-400 text-xs border-l border-gray-200 pl-2">
                  {job.reviews} Reviews
                </span>
              </div>
            </div>
            
            {/* Company Logo in Card */}
            <div className="w-12 h-12 rounded-lg border border-gray-50 flex items-center justify-center p-1 overflow-hidden">
               <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Job Metadata */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-1.5">
              <Briefcase size={14} className="text-gray-400" />
              <span>{job.experience}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-bold">₹</span>
              <span>{job.salary}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" />
              <span>{job.location}</span>
            </div>
          </div>

          {/* Key Responsible Units */}
          <div className="mt-4 flex flex-wrap gap-2">
            {job.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-[11px] font-medium border border-gray-100">
                {tag}
              </span>
            ))}
          </div>

          {/* Horizontal Line Divider */}
          <div className="my-5 border-t border-gray-50 opacity-50"></div>

          {/* Footer of Card */}
          <div className="flex justify-between items-center sm:hidden md:flex">
            <div className="flex items-center gap-4">
               <span className="text-xs text-gray-400 font-medium">{job.postedAt}</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase">
                <EyeOff size={14} /> Hide
              </button>
              <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase">
                <Bookmark size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DetailedJobCard;
