import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, MapPin, Globe, Users, Calendar, Briefcase, 
  ChevronRight, 
  CheckCircle2, Sparkles, FileText, PlayCircle, Image as ImageIcon,
  ShieldCheck, Info, ArrowLeft, Loader2, Link2, ExternalLink
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import VerifiedEmployerBadge from "@/components/shared/VerifiedEmployerBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { jobPath } from '../utils/jobUrl';
import SEOHead from '../components/seo/SEOHead';
import WaveLines from '@/components/common/WaveLines';

const CompanyProfilePage = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/public/companies/${id}`);
        setCompany(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load company profile");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center bg-[#f4faf7]">
        <Loader2 className="w-8 h-8 animate-spin text-[#34B678]" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center bg-[#f4faf7] gap-3 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#eaf7f0] flex items-center justify-center text-[#1f8a57]">
            <Building2 size={26} />
        </div>
        <h2 className="m-0 text-lg font-bold text-[#10213D]">We couldn&apos;t find this company</h2>
        <Link to="/companies" className="text-[13px] font-semibold text-[#1f8a57] no-underline hover:underline">See all companies</Link>
      </div>
    );
  }

  const hasFullProfile = company.subscription?.companyProfileType && company.subscription.companyProfileType !== 'No';

  const formatSalary = (salary) => {
    if (!salary || salary.isRangeHidden) return 'Not Disclosed';
    if (salary.min && salary.max) return `₹${(salary.min / 100000).toFixed(1)}–${(salary.max / 100000).toFixed(1)} LPA`;
    if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
    return 'Competitive';
  };

  const formatExperience = (experience) => {
    if (!experience || (!experience.min && !experience.max)) return 'Any Experience';
    if (experience.min && experience.max) return `${experience.min}-${experience.max} Yrs`;
    return `${experience.min || experience.max}+ Yrs`;
  };


  const companySeoName = company.display_name || company.name;
  const companySeoPlace = company.location ? ` in ${company.location}` : '';
  const companySeoTitle = [
    `${companySeoName} Jobs & Careers${companySeoPlace} – Apply | Velaivaaipu`,
    `${companySeoName} Jobs & Careers${companySeoPlace} | Velaivaaipu`,
    `${companySeoName} Jobs & Careers | Velaivaaipu`,
  ].find((t) => t.length <= 60) || `${companySeoName} Jobs | Velaivaaipu`;
  const name = company.display_name || company.name;
  const size = company.company_size_range || company.employeeCount;
  const tabCls = 'relative h-11 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 text-[13px] font-semibold text-zinc-500 shadow-none data-[state=active]:border-[#34B678] data-[state=active]:bg-transparent data-[state=active]:text-[#10213D] data-[state=active]:shadow-none hover:text-[#10213D]';
  const sectionTitle = 'm-0 text-[15px] font-semibold text-[#10213D]';
  const panel = 'rounded-2xl bg-white p-5 ring-1 ring-zinc-200/80 sm:p-6';
  const empty = (Icon, text) => (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-zinc-200/80">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf7f0] text-[#1f8a57]"><Icon size={22} /></span>
      <p className="m-0 text-sm font-semibold text-[#10213D]">{text}</p>
    </div>
  );
  const details = [
    { label: 'Founded', value: company.founded_year || company.foundedYear, icon: Calendar },
    { label: 'Location', value: company.location, icon: MapPin },
    { label: 'Industry', value: company.industry, icon: Factory },
    { label: 'Team size', value: size && `${size} people`, icon: Users },
    { label: 'Work mode', value: company.work_model?.join(', '), icon: Briefcase },
  ].filter((d) => d.value);
  const perks = company.perks ? [
    company.perks.health_insurance && 'Health insurance',
    company.perks.unlimited_pto && 'Unlimited paid leave',
    company.perks.equity_package && 'Equity / shares',
  ].filter(Boolean) : [];
  const socials = [
    company.social_links?.linkedin && { href: company.social_links.linkedin, label: 'LinkedIn', Icon: ExternalLink },
    company.social_links?.twitter && { href: company.social_links.twitter, label: 'X / Twitter', Icon: Globe },
    company.social_links?.instagram && { href: company.social_links.instagram, label: 'Instagram', Icon: Link2 },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f4faf7] pb-20">
      <SEOHead
        title={companySeoTitle}
        description={`See current job openings at ${companySeoName}${companySeoPlace}. Read the company profile, check roles for freshers and experienced, and apply free on Velaivaaipu.`}
        path={`/companies/${id}`}
      />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-zinc-200/70 bg-white">
        <WaveLines id="company-profile-waves" />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10">
          <Link to="/companies" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 no-underline transition hover:text-[#1f8a57]">
            <ArrowLeft size={15} /> All companies
          </Link>

          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-zinc-200 shadow-sm sm:h-24 sm:w-24">
              {company.logo
                ? <img src={company.logo} alt={name} className="h-full w-full object-contain" />
                : <span className="text-3xl font-bold text-[#1f8a57]">{name?.[0]?.toUpperCase() || <Building2 size={32} />}</span>}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="m-0 text-2xl font-bold tracking-tight text-[#10213D] sm:text-[1.75rem]">{name}</h1>
                {company.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#eaf7f0] px-2 py-1 text-[11px] font-semibold text-[#1f8a57]">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                )}
                <VerifiedEmployerBadge company={company} />
              </div>
              {(company.tagline || company.industry) && <p className="m-0 mt-1 max-w-2xl text-sm text-zinc-500">{company.tagline || company.industry}</p>}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-zinc-600">
                {company.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-[#1f8a57]" /> {company.location}</span>}
                {size && <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-[#1f8a57]" /> {size} people</span>}
                {company.responseTime?.label && (
                  <span className="inline-flex items-center gap-1.5" title={`Median time to first reply, from ${company.responseTime.sample} applications in the last 90 days`}>
                    <CheckCircle2 size={14} className="text-[#1f8a57]" /> Usually replies in {company.responseTime.label}
                  </span>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#1f8a57] no-underline hover:underline">
                    <Globe size={14} /> Website
                  </a>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button className="h-10 rounded-xl bg-[#34B678] px-5 text-[13px] font-semibold text-white shadow-md shadow-[#34B678]/25 hover:bg-[#2ca66b]">
                Follow company
              </Button>
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-500 ring-1 ring-zinc-200 transition hover:text-[#1f8a57] hover:ring-[#34B678]/50">
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="mb-5 flex h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-zinc-200 bg-transparent p-0 [scrollbar-width:none]">
              <TabsTrigger value="about" className={tabCls}>About</TabsTrigger>
              {hasFullProfile && <TabsTrigger value="gallery" className={tabCls}>Photos & video</TabsTrigger>}
              {hasFullProfile && <TabsTrigger value="norms" className={tabCls}>Policies</TabsTrigger>}
              <TabsTrigger value="jobs" className={tabCls}>Open jobs ({company.openJobs?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-0 space-y-5 outline-none">
              <section className={panel}>
                <h2 className={sectionTitle}>About {name}</h2>
                <p className="m-0 mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                  {company.about_us || company.description || 'This company has not added a description yet.'}
                </p>
              </section>

              {hasFullProfile && company.mission_statement && (
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#eaf7f0] to-white p-5 ring-1 ring-[#34B678]/20 sm:p-6">
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1f8a57]">Our mission</p>
                  <p className="m-0 mt-2 text-base font-semibold leading-relaxed text-[#10213D]">“{company.mission_statement}”</p>
                </section>
              )}

              {hasFullProfile && company.culture_values?.length > 0 && (
                <section className={panel}>
                  <h2 className={sectionTitle}>Culture and values</h2>
                  <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2">
                    {company.culture_values.map((val, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eaf7f0] text-xs font-bold text-[#1f8a57]">{i + 1}</span>
                        <span className="text-sm font-medium text-[#10213D]">{val}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </TabsContent>

            {hasFullProfile && (
              <TabsContent value="gallery" className="mt-0 space-y-5 outline-none">
                {company.video_intro_url && (
                  <section className={panel}>
                    <h2 className={sectionTitle}>Company video</h2>
                    <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-zinc-100">
                      <iframe
                        className="h-full w-full"
                        src={company.video_intro_url.replace('watch?v=', 'embed/')}
                        title="Company video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </section>
                )}
                {company.gallery_images?.length > 0 ? (
                  <section className={panel}>
                    <h2 className={sectionTitle}>Photos</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {company.gallery_images.map((img, i) => (
                        <div key={i} className="group aspect-video overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/70">
                          <img src={img} alt={`${name} photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </section>
                ) : empty(ImageIcon, 'No photos added yet')}
              </TabsContent>
            )}

            {hasFullProfile && (
              <TabsContent value="norms" className="mt-0 outline-none">
                <section className={panel}>
                  <h2 className={sectionTitle}>Workplace policies</h2>
                  <p className="m-0 mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                    {company.norms_conditions || 'This company has not added its policies yet. Ask HR during your interview.'}
                  </p>
                </section>
              </TabsContent>
            )}

            <TabsContent value="jobs" className="mt-0 outline-none">
              {company.openJobs?.length > 0 ? (
                <ul className="m-0 list-none space-y-3 p-0">
                  {company.openJobs.map((job) => (
                    <li key={job._id}>
                      <Link to={jobPath(job)} className="group flex flex-col gap-3 rounded-2xl bg-white p-4 no-underline ring-1 ring-zinc-200/80 transition hover:ring-[#34B678]/50 hover:shadow-[0_18px_40px_-28px_rgba(16,33,61,0.45)] sm:flex-row sm:items-center sm:p-5">
                        <div className="min-w-0 flex-1">
                          <h3 className="m-0 text-[15px] font-semibold text-[#10213D] group-hover:text-[#1f8a57]">{job.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                            {job.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-zinc-400" /> {job.location}</span>}
                            {job.jobType && <span className="inline-flex items-center gap-1.5"><Briefcase size={13} className="text-zinc-400" /> {job.jobType}</span>}
                            <span className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-zinc-400" /> {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="sm:text-right">
                            <p className="m-0 text-sm font-semibold text-[#10213D]">{formatSalary(job.salary)}</p>
                            <p className="m-0 text-xs text-zinc-500">{formatExperience(job.experience)}</p>
                          </div>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-400 transition group-hover:bg-[#34B678] group-hover:text-white">
                            <ChevronRight size={18} />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : empty(Briefcase, 'No open jobs right now')}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-5">
          {details.length > 0 && (
            <section className={panel}>
              <h2 className={sectionTitle}>Company details</h2>
              <ul className="m-0 mt-4 list-none space-y-3.5 p-0">
                {details.map(({ label, value, icon: Icon }) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200/70"><Icon size={16} /></span>
                    <span className="min-w-0">
                      <span className="block text-xs text-zinc-500">{label}</span>
                      <span className="block truncate text-sm font-semibold text-[#10213D]">{value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {perks.length > 0 && (
            <section className={panel}>
              <h2 className={sectionTitle}>Perks</h2>
              <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
                {perks.map((p) => (
                  <li key={p} className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf7f0] px-2.5 py-1.5 text-xs font-semibold text-[#1f8a57]"><CheckCircle2 size={13} /> {p}</li>
                ))}
              </ul>
            </section>
          )}

          <section className={panel}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf7f0] text-[#1f8a57]"><FileText size={18} /></span>
            <h2 className={`${sectionTitle} mt-3`}>Get noticed by {name}</h2>
            <p className="m-0 mt-1 text-[13px] leading-relaxed text-zinc-500">A clear resume helps recruiters say yes faster.</p>
            <Link to="/candidate/resume-builder" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-white text-[13px] font-semibold text-[#10213D] no-underline ring-1 ring-zinc-200 transition hover:text-[#1f8a57] hover:ring-[#34B678]/50">
              Build my resume
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
};

// Internal Factory component for icon placeholder
const Factory = ({ size, className }) => <Building2 size={size} className={className} />;

export default CompanyProfilePage;
