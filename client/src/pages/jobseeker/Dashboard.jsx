import React from 'react';
import DetailedJobCard from '../../components/jobseeker/DetailedJobCard';
import RecommendedJobCard from '../../components/jobseeker/RecommendedJobCard';
import { Button, Tabs, Card, Tooltip } from 'antd';
import { ChevronRight, QrCode, Smartphone, ExternalLink, Sparkles } from 'lucide-react';

const mockRecommendedJobs = [
  { id: 1, title: 'HCL Tech-Hiring- B...', company: 'HCLTech', rating: 3.4, location: 'Bengaluru', postedAt: '3d ago', logo: 'https://logo.clearbit.com/hcltech.com' },
  { id: 2, title: 'Walk-in || Service D...', company: 'Wipro', rating: 3.6, location: 'Bengaluru', postedAt: '23h ago', logo: 'https://logo.clearbit.com/wipro.com' },
  { id: 3, title: 'Associate Analy...', company: 'GlobalLogic', rating: 3.5, location: 'Mahbubnagar', postedAt: '1d ago', logo: 'https://logo.clearbit.com/globallogic.com' },
  { id: 4, title: 'Software Engineer', company: 'TCS', rating: 3.8, location: 'Hyderabad', postedAt: '2d ago', logo: 'https://logo.clearbit.com/tcs.com' },
];

const mockDetailedJobs = [
  { 
    id: 1, 
    title: 'HCL Tech-Hiring- Bangalore Location-Freshers-Process Associate', 
    company: 'HCLTech', 
    rating: 3.4, 
    reviews: '45546', 
    experience: '0 Yrs', 
    salary: 'Not disclosed', 
    location: 'Bengaluru', 
    summary: 'HCL Tech-Hiring- Bangalore Location-Freshers-Process Associate / Customer ser...', 
    tags: ['Customer Support', 'BPO', 'Freshers'], 
    postedAt: '3 Days Ago', 
    logo: 'https://logo.clearbit.com/hcltech.com' 
  },
  { 
    id: 2, 
    title: 'Walk-in || Service Desk Administrator', 
    company: 'Wipro', 
    rating: 3.6, 
    reviews: '64633', 
    experience: '07 Apr - 10 Apr', 
    salary: 'Not disclosed', 
    location: 'Bengaluru', 
    summary: 'Shifts: Rotational ( 5 days WFO ). Flexible and Open to working in a 24x7 environ...', 
    tags: ['Service Desk', 'Communication Skills', 'IT Helpdesk', 'L1 Support'], 
    postedAt: '1 Day Ago', 
    logo: 'https://logo.clearbit.com/wipro.com' 
  },
];

const JobSeekerDashboard = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Middle Column - Main Feed */}
      <div className="flex-1 min-w-0">
        
        {/* Recommended Jobs Horizontal Strip */}
        <section className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6 px-1">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Recommended jobs for you</h2>
            <Button type="link" className="text-blue-600 font-bold p-0 flex items-center hover:translate-x-1 transition-transform">
              View all <ChevronRight size={16} />
            </Button>
          </div>
          
          <Tabs 
            defaultActiveKey="1" 
            className="mb-4 job-tabs"
            items={[
              { key: '1', label: <span className="px-2 font-bold">Profile (50)</span> },
              { key: '2', label: <span className="px-2 font-bold">Preferences (0)</span> },
            ]}
          />

          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide no-scrollbar">
            {mockRecommendedJobs.map(job => (
              <RecommendedJobCard key={job.id} job={job} />
            ))}
          </div>
        </section>

        {/* Create Resume Banner (Premium look) */}
        <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-r from-blue-50/50 via-white to-blue-50/50 border border-blue-100 overflow-hidden group">
           <div className="flex items-center gap-8 relative z-10">
              <div className="flex-shrink-0 w-24 h-32 bg-white rounded-lg border border-gray-200 p-2 shadow-sm transform -rotate-3 group-hover:rotate-0 transition-transform">
                <div className="w-full h-full bg-gray-50 flex flex-col gap-1 p-1">
                  <div className="h-2 w-2/3 bg-gray-200 rounded"></div>
                  <div className="h-1 w-full bg-gray-100 rounded"></div>
                  <div className="h-1 w-full bg-gray-100 rounded"></div>
                  <div className="mt-4 h-1 w-full bg-blue-100 rounded"></div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  Create your resume in 3 easy steps <Sparkles size={18} className="text-blue-500 animate-pulse" />
                </h3>
                <ol className="space-y-1 text-sm text-gray-600 font-medium list-decimal list-inside">
                  <li>Add the missing details in your profile</li>
                  <li>Choose a template for your resume</li>
                  <li>Improve the content with AI</li>
                </ol>
              </div>
              <Button type="primary" className="h-11 px-8 rounded-full font-bold shadow-lg shadow-blue-200">
                Create resume
              </Button>
           </div>
           {/* Decorative graphic element */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 opacity-5 blur-[100px] rounded-full"></div>
        </div>

        {/* Main Job Feed */}
        <div className="flex justify-between items-center mb-6 px-1">
           <h2 className="text-xl font-bold text-gray-800">Job recommended for you</h2>
           <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">You can select upto 5 jobs to apply</span>
              <Button disabled className="rounded-lg h-10 px-6 font-bold bg-blue-100 text-blue-300 border-none">Apply</Button>
           </div>
        </div>

        {mockDetailedJobs.map(job => (
          <DetailedJobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Right Column - Utility Cards */}
      <div className="hidden xl:flex flex-col gap-6 w-80">
        {/* QR Code App Download */}
        <Card className="rounded-2xl border-gray-100 shadow-sm" bodyStyle={{ padding: '24px' }}>
          <div className="flex gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <QrCode size={56} className="text-gray-800" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 leading-tight mb-2">
                <span className="text-orange-500">3587+</span> users downloaded our app in last 30 mins!
              </p>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Scan to download from <Smartphone size={10} />
              </div>
            </div>
          </div>
        </Card>

        {/* Promotional Card (50% Women) */}
        <Card 
          className="rounded-2xl border-gray-100 shadow-sm overflow-hidden group cursor-pointer"
          cover={
            <div className="h-32 bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center overflow-hidden">
               <div className="text-center">
                  <p className="text-pink-600 font-black text-xl italic leading-none">WHAT WOMEN</p>
                  <p className="text-purple-600 font-medium text-xs tracking-[0.2em] -mt-1">PROFESSIONALS WANT</p>
               </div>
            </div>
          }
        >
          <h4 className="text-base font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors">
            50% women hide marriage & maternity plans amid bias fears
          </h4>
          <Button type="link" className="p-0 font-bold text-blue-600 hover:text-blue-700 flex items-center">
            Know more <ChevronRight size={16} />
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
