import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  ChevronLeft,
  Download,
  Globe,
  Loader2,
  Calendar,
  Building2,
  CheckCircle2,
  Star,
  BadgeCheck,
  Clock,
  FileText,
  Target,
  Sparkles,
  IndianRupee,
  Layers,
  Heart,
  ExternalLink,
  Shield,
  Hash,
  CalendarDays,
  Zap,
  Award,
  BookOpen,
  CircleDot,
  ArrowRight
} from 'lucide-react';
import { Button, Card, Tag as AntTag, Avatar as AntAvatar, Divider as Separator, Tooltip } from 'antd';
import { toast } from "sonner";

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/user/profile/${id}`);
        setProfile(res.data);
        
        // Track view if visitor is not the owner
        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && storedUser.id !== id) {
          axios.post(`${API_BASE_URL}/user/profile/${id}/view`).catch(() => {});
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const p = profile.profile || {};
  const jp = p.jobPreferences || {};
  const isAdmin = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.role === 'admin' || u.role?.name === 'admin';
    } catch { return false; }
  })();

  const handleDownloadCV = async () => {
    if (!p.resumeUrl) {
      toast.error("No resume uploaded");
      return;
    }
    try {
      const url = p.resumeUrl.startsWith('http') ? p.resumeUrl : `${API_DOMAIN}${p.resumeUrl}`;
      const filename = p.resumeName || `${profile.name || 'resume'}.pdf`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Failed to download resume");
    }
  };

  const handleDownloadDoc = async (doc) => {
    try {
      const url = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${API_DOMAIN}${doc.fileUrl}`;
      const filename = doc.fileName || doc.name || 'document';
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Failed to download document");
    }
  };

  const handleOpenPortfolio = () => {
    if (p.portfolioUrl) {
      const url = p.portfolioUrl.startsWith('http') ? p.portfolioUrl : `https://${p.portfolioUrl}`;
      window.open(url, '_blank');
    } else {
      toast.error("No portfolio provided");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeColor = (type) => {
    if (!type) return 'default';
    if (type.includes('pdf')) return 'red';
    if (type.includes('doc') || type.includes('word')) return 'blue';
    if (type.includes('image')) return 'green';
    return 'default';
  };

  const avatarUrl = profile.avatar ? (profile.avatar.startsWith('http') ? profile.avatar : `${API_DOMAIN}${profile.avatar}`) : null;
  const coverUrl = profile.coverPic ? (profile.coverPic.startsWith('http') ? profile.coverPic : `${API_DOMAIN}${profile.coverPic}`) : null;

  // Section component for consistent styling
  const Section = ({ icon: Icon, title, children, className = '' }) => (
    <div className={`bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      <div className="px-7 pt-7 pb-4 border-b border-slate-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          <Icon size={19} />
        </div>
        <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>
      </div>
      <div className="px-7 py-6">{children}</div>
    </div>
  );

  const InfoChip = ({ icon: Icon, label, value, color = 'emerald' }) => (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100/80 hover:border-slate-200 transition-colors">
      <div className={`w-8 h-8 rounded-xl bg-${color}-50 flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon size={14} className={`text-${color}-600`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-700 mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-700">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-all hover:-translate-y-0.5 shadow-sm"
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* ===== HERO HEADER CARD ===== */}
      <div className="relative rounded-[36px] overflow-hidden shadow-2xl">
        {/* Cover Photo / Gradient */}
        <div
          className="h-48 md:h-56 relative"
          style={{
            background: coverUrl
              ? `url(${coverUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, #064e3b 0%, #065f46 30%, #0f766e 60%, #134e4a 100%)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20" />
          
          {/* Status badges on cover */}
          <div className="absolute top-5 right-5 flex items-center gap-2">
            {profile.display_id && (
              <span className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10">
                <Hash size={10} /> {profile.display_id}
              </span>
            )}
            {profile?.profileVerificationStatus === 'Verified' && (
              <span className="inline-flex items-center gap-1.5 bg-blue-500/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-400/30">
                <BadgeCheck size={12} /> Verified
              </span>
            )}
            {(profile.isPriority || profile.subscription?.hasProfileBoost) && (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-amber-400/30">
                <Star size={12} className="fill-current" /> Priority
              </span>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white px-8 md:px-10 pb-8 pt-0 relative">
          {/* Avatar */}
          <div className="absolute -top-16 left-8 md:left-10">
            <div className="w-32 h-32 rounded-[32px] border-4 border-white shadow-xl overflow-hidden bg-emerald-600 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl font-black">{profile.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className="pt-20 md:pt-4 md:pl-40 space-y-5">
            {/* Name & Headline */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
                {profile?.profileVerificationStatus === 'Verified' && (
                  <Tooltip title="Verified Profile">
                    <BadgeCheck size={24} className="text-blue-500 shrink-0" />
                  </Tooltip>
                )}
              </div>
              <p className="text-lg font-bold text-emerald-600">{p.headline || 'Job Seeker'}</p>
              {p.preferredRole && (
                <p className="text-sm font-semibold text-slate-400">Looking for: <span className="text-slate-600">{p.preferredRole}</span></p>
              )}
            </div>

            {/* Contact Info Row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <Mail size={15} className="text-emerald-500" />
                <span>{profile.email}</span>
              </div>
              {p.phone && (profile.isPhoneVisible !== false || isAdmin) && (
                <div className="flex items-center gap-1.5">
                  <Phone size={15} className="text-emerald-500" />
                  <span>{p.phone}</span>
                </div>
              )}
              {p.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-emerald-500" />
                  <span>{p.location}</span>
                </div>
              )}
              {profile.createdAt && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-slate-400" />
                  <span className="text-slate-400">Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handleDownloadCV}
                disabled={!p.resumeUrl}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-md ${
                  p.resumeUrl
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 hover:-translate-y-0.5'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Download size={16} /> Download CV
              </button>
              {p.portfolioUrl ? (
                <button
                  onClick={handleOpenPortfolio}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all hover:-translate-y-0.5"
                >
                  <Globe size={16} className="text-emerald-500" /> View Portfolio
                </button>
              ) : (
                <button disabled className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed">
                  <Globe size={16} /> No Portfolio
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ===== LEFT COLUMN ===== */}
        <div className="space-y-6">

          {/* About Me */}
          <Section icon={User} title="About Me">
            <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
              {p.bio || 'No bio provided.'}
            </p>
          </Section>

          {/* Core Skills */}
          <Section icon={Sparkles} title="Core Expertise">
            {p.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {p.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[11px] uppercase tracking-wider hover:bg-emerald-100 hover:border-emerald-200 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No skills listed</p>
            )}
          </Section>

          {/* Interested Domains */}
          {p.interestedDomain?.length > 0 && (
            <Section icon={Heart} title="Interested Domains">
              <div className="flex flex-wrap gap-2">
                {p.interestedDomain.map((domain, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 font-bold text-[11px] uppercase tracking-wider"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Shift Preferences */}
          {p.shifts?.length > 0 && (
            <Section icon={Clock} title="Shift Preferences">
              <div className="flex flex-wrap gap-2">
                {p.shifts.map((shift, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[11px] uppercase tracking-wider"
                  >
                    {shift}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Documents */}
          {p.documents?.length > 0 && (
            <Section icon={FileText} title={`Documents (${p.documents.length})`}>
              <div className="space-y-3">
                {p.documents.map((doc, i) => (
                  <div
                    key={doc._id || i}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group cursor-pointer"
                    onClick={() => handleDownloadDoc(doc)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                      <FileText size={18} className="text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-700 truncate group-hover:text-emerald-700">{doc.name}</p>
                        {doc.isPrimary && (
                          <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md uppercase tracking-widest shrink-0">Primary</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {doc.fileType && (
                          <AntTag color={getFileTypeColor(doc.fileType)} className="!text-[9px] !font-bold !m-0 !py-0 uppercase">
                            {doc.fileType.split('/').pop()?.toUpperCase()?.slice(0, 4)}
                          </AntTag>
                        )}
                        {doc.fileSize > 0 && (
                          <span className="text-[10px] font-semibold text-slate-400">{formatFileSize(doc.fileSize)}</span>
                        )}
                      </div>
                    </div>
                    <Download size={14} className="text-slate-300 group-hover:text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ===== RIGHT COLUMN (2 cols) ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Job Preferences */}
          {(jp.jobTitles?.length > 0 || jp.noticePeriod || jp.expectedSalary || jp.employmentTypes?.length > 0 || jp.locationTypes?.length > 0 || jp.startDate) && (
            <Section icon={Target} title="Job Preferences">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {jp.jobTitles?.length > 0 && (
                  <InfoChip icon={Briefcase} label="Desired Roles" value={jp.jobTitles.join(', ')} />
                )}
                {jp.employmentTypes?.length > 0 && (
                  <InfoChip icon={Layers} label="Employment Type" value={jp.employmentTypes.join(', ')} />
                )}
                {jp.locationTypes?.length > 0 && (
                  <InfoChip icon={MapPin} label="Work Mode" value={jp.locationTypes.join(', ')} />
                )}
                {jp.noticePeriod && (
                  <InfoChip icon={Clock} label="Notice Period" value={jp.noticePeriod} />
                )}
                {jp.expectedSalary && (
                  <InfoChip icon={IndianRupee} label="Expected Salary" value={jp.expectedSalary} />
                )}
                {jp.startDate && (
                  <InfoChip icon={Calendar} label="Available From" value={jp.startDate} />
                )}
                {jp.onSiteLocations?.length > 0 && (
                  <InfoChip
                    icon={MapPin}
                    label="Preferred Locations"
                    value={jp.onSiteLocations.map(l => [l.city, l.state].filter(Boolean).join(', ')).join(' • ')}
                  />
                )}
              </div>
            </Section>
          )}

          {/* Professional Experience */}
          <Section icon={Briefcase} title="Professional Experience">
            {p.experience?.length > 0 ? (
              <div className="space-y-6">
                {p.experience.map((exp, i) => (
                  <div key={i} className="flex gap-5 relative group">
                    {/* Timeline Line */}
                    {i !== p.experience.length - 1 && (
                      <div className="absolute left-[19px] top-[44px] bottom-[-24px] w-[2px] bg-slate-100 group-hover:bg-emerald-100 transition-colors" />
                    )}
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 z-10 group-hover:border-emerald-300 group-hover:bg-emerald-50 transition-all">
                      <Building2 size={17} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    {/* Content */}
                    <div className="space-y-1.5 pb-1 flex-1 min-w-0">
                      <h4 className="text-base font-black text-slate-900 leading-tight">{exp.role}</h4>
                      <p className="text-emerald-600 font-bold text-sm">{exp.company}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {exp.duration && (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                            <Calendar size={11} /> {exp.duration}
                          </span>
                        )}
                        {exp.location && (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                            <MapPin size={11} /> {exp.location}
                          </span>
                        )}
                      </div>
                      {exp.description && (
                        <p className="text-slate-500 text-sm font-medium pt-1.5 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <Briefcase size={22} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">No experience added yet</p>
              </div>
            )}
          </Section>

          {/* Education */}
          <Section icon={GraduationCap} title="Academic Background">
            {p.qualification?.length > 0 ? (
              <div className="space-y-6">
                {p.qualification.map((edu, i) => (
                  <div key={i} className="flex gap-5 relative group">
                    {i !== p.qualification.length - 1 && (
                      <div className="absolute left-[19px] top-[44px] bottom-[-24px] w-[2px] bg-slate-100 group-hover:bg-emerald-100 transition-colors" />
                    )}
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 z-10 group-hover:border-emerald-300 group-hover:bg-emerald-50 transition-all">
                      <GraduationCap size={17} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <div className="space-y-1.5 pb-1 flex-1 min-w-0">
                      <h4 className="text-base font-black text-slate-900 leading-tight">{edu.degree}</h4>
                      <p className="text-emerald-600 font-bold text-sm">{edu.institution}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {edu.startYear && edu.endYear && (
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest inline-flex items-center gap-1">
                            <Calendar size={11} /> {edu.startYear} — {edu.currentlyPursuing ? 'Present' : edu.endYear}
                          </span>
                        )}
                        {!edu.startYear && edu.year && (
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest inline-flex items-center gap-1">
                            <Calendar size={11} /> Class of {edu.year}
                          </span>
                        )}
                        {edu.currentlyPursuing && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                            Currently Pursuing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <GraduationCap size={22} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">No education added yet</p>
              </div>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
