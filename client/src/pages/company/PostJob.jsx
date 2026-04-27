import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  Briefcase, MapPin, Clock, DollarSign, Users, 
  FileText, Plus, X, Save, Sparkles, LayoutGrid,
  Send, Trash2, ShieldCheck, Target, ChevronLeft, 
  ArrowRight, Calendar, BadgeCheck, ExternalLink
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const API_JOBS_URL = `${import.meta.env.VITE_API_BASE_URL}/jobs`;

const PostJob = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'detail'
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [editingJobId, setEditingJobId] = useState(null);
    const [newSkill, setNewSkill] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        vacancies: 1,
        experience: { min: 0, max: 0 },
        jobType: 'Full-time',
        workMode: 'On-site',
        location: '',
        salary: { min: '', max: '', currency: 'INR', isRangeHidden: false },
        timings: '',
        shifts: '',
        skillsRequired: [],
        additionalDetails: []
    });

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setFetching(true);
            const res = await axios.get(`${API_JOBS_URL}/company-jobs`);
            setJobs(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch jobs");
        } finally {
            setFetching(false);
        }
    };

    const handleAddSkill = () => {
        if (newSkill && !formData.skillsRequired.includes(newSkill)) {
            setFormData({
                ...formData,
                skillsRequired: [...formData.skillsRequired, newSkill]
            });
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skill) => {
        setFormData({
            ...formData,
            skillsRequired: formData.skillsRequired.filter(s => s !== skill)
        });
    };

    const handleAddDetail = () => {
        setFormData({
            ...formData,
            additionalDetails: [...formData.additionalDetails, { key: '', value: '' }]
        });
    };

    const handleRemoveDetail = (index) => {
        const newDetails = [...formData.additionalDetails];
        newDetails.splice(index, 1);
        setFormData({ ...formData, additionalDetails: newDetails });
    };

    const handleDetailChange = (index, field, value) => {
        const newDetails = [...formData.additionalDetails];
        newDetails[index][field] = value;
        setFormData({ ...formData, additionalDetails: newDetails });
    };

    const resetForm = () => {
        setEditingJobId(null);
        setFormData({
            title: '',
            description: '',
            vacancies: 1,
            experience: { min: 0, max: 0 },
            jobType: 'Full-time',
            workMode: 'On-site',
            location: '',
            salary: { min: '', max: '', currency: 'INR', isRangeHidden: false },
            timings: '',
            shifts: '',
            skillsRequired: [],
            additionalDetails: []
        });
    };

    const handleEdit = (job) => {
        setEditingJobId(job._id);
        setFormData({
            title: job.title || '',
            description: job.description || '',
            vacancies: job.vacancies || 1,
            experience: job.experience || { min: 0, max: 0 },
            jobType: job.jobType || 'Full-time',
            workMode: job.workMode || 'On-site',
            location: job.location || '',
            salary: job.salary || { min: '', max: '', currency: 'INR', isRangeHidden: false },
            timings: job.timings || '',
            shifts: job.shifts || '',
            skillsRequired: job.skillsRequired || [],
            additionalDetails: job.additionalDetails || []
        });
        setViewMode('create');
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this position?")) return;
        try {
            await axios.delete(`${API_JOBS_URL}/${id}`);
            toast.success("Job deleted successfully");
            fetchJobs();
            if (selectedJob?._id === id) setViewMode('list');
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete job");
        }
    };

    const handleStatusToggle = async (job) => {
        const newStatus = job.status === 'active' ? 'inactive' : 'active';
        try {
            const res = await axios.put(`${API_JOBS_URL}/${job._id}`, { status: newStatus });
            toast.success(`Position is now ${newStatus}`);
            fetchJobs();
            if (selectedJob?._id === job._id) setSelectedJob(res.data.job);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const [draftLoading, setDraftLoading] = useState(false);

    const handleSubmit = async (e, status = 'active') => {
        if (e) e.preventDefault();
        
        if (!user?.company) {
            toast.error("Complete your company profile in settings before posting a job");
            return;
        }

        const loadingSetter = status === 'draft' ? setDraftLoading : setLoading;
        loadingSetter(true);
        try {
            if (editingJobId) {
                await axios.put(`${API_JOBS_URL}/${editingJobId}`, { ...formData, status });
                toast.success(status === 'draft' ? "Draft updated!" : "Position published successfully!");
            } else {
                await axios.post(API_JOBS_URL, { ...formData, status });
                toast.success(status === 'draft' ? "Job saved as draft!" : "Job posted successfully!");
            }
            resetForm();
            fetchJobs();
            setViewMode('list');
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
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Synchronizing Jobs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-12 px-4">
            
            {/* ── VIEW: LIST OF JOBS ── */}
            {viewMode === 'list' && (
                <div className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-8 rounded-[40px] border border-primary/10">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
                                Career Opportunities <LayoutGrid className="text-primary w-8 h-8" />
                            </h1>
                            <p className="text-muted-foreground font-bold">Manage and track all positions posted for {user?.company?.name}</p>
                        </div>
                        <Button 
                            onClick={() => setViewMode('create')}
                            className="rounded-2xl font-black text-sm uppercase tracking-widest px-10 h-14 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                        >
                            <Plus className="w-5 h-5 mr-2" /> Post a New Position
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {jobs.map((job) => (
                            <Card 
                                key={job._id} 
                                onClick={() => { setSelectedJob(job); setViewMode('detail'); }}
                                className="group rounded-[32px] border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden relative"
                            >
                                <div className="absolute top-6 right-6 flex items-center gap-2">
                                    <Badge className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        job.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                                        job.status === 'draft' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                        {job.status}
                                    </Badge>
                                </div>
                                <CardHeader className="p-8 pb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Briefcase className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl font-black group-hover:text-primary transition-colors pr-10 leading-tight">
                                        {job.title}
                                    </CardTitle>
                                    <CardDescription className="font-bold flex items-center gap-2 mt-2">
                                        <MapPin className="w-3 h-3" /> {job.location || 'Remote'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 pt-4 space-y-6">
                                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-primary opacity-60" />
                                            {job.applicantsCount} Applicants
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary opacity-60" />
                                            {job.jobType}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-border flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                            Posted {new Date(job.createdAt).toLocaleDateString()}
                                        </span>
                                        <ArrowRight className="w-5 h-5 text-primary translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {jobs.length === 0 && (
                            <div className="col-span-full py-24 text-center space-y-4 bg-muted/20 border-2 border-dashed border-border rounded-[40px]">
                                <Sparkles className="w-12 h-12 text-primary/20 mx-auto" />
                                <h3 className="text-xl font-black text-muted-foreground">No active positions found</h3>
                                <p className="text-sm font-bold text-muted-foreground/60">Ready to expand your team? Start by posting your first position.</p>
                                <Button 
                                    onClick={() => setViewMode('create')}
                                    variant="outline"
                                    className="mt-6 rounded-xl font-black px-8 border-primary/20 text-primary"
                                >
                                    Post Job Regularly
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── VIEW: JOB DETAILS ── */}
            {viewMode === 'detail' && selectedJob && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-6">
                        <Button 
                            variant="ghost" 
                            onClick={() => setViewMode('list')}
                            className="w-12 h-12 rounded-2xl bg-muted/50 hover:bg-muted border border-border"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black tracking-tight">{selectedJob.title || "Untitled Role"}</h2>
                            <p className="text-muted-foreground font-bold flex items-center gap-2">
                                Full Role Specification & Requirements
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={(e) => { e.stopPropagation(); handleEdit(selectedJob); }}
                                className="rounded-xl border-border px-6 font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all"
                            >
                                Edit Role
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={(e) => { e.stopPropagation(); handleStatusToggle(selectedJob); }}
                                className="rounded-xl border-border px-6 font-black text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
                            >
                                {selectedJob.status === 'active' ? 'Set Inactive' : 'Set Active'}
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={(e) => { e.stopPropagation(); handleDelete(selectedJob._id); }}
                                className="w-12 h-12 rounded-xl text-destructive hover:bg-destructive/5"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                            <Card className="rounded-[40px] border-border shadow-sm">
                                <CardHeader className="p-10 pb-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-widest">
                                            {selectedJob.jobType}
                                        </Badge>
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-widest">
                                            {selectedJob.workMode}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-2xl font-black">Detailed Job Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8">
                                    <div className="prose prose-sm max-w-none text-muted-foreground font-bold leading-relaxed whitespace-pre-wrap">
                                        {selectedJob.description}
                                    </div>

                                    <div className="pt-8 border-t border-border space-y-6">
                                        <h3 className="font-black text-xs uppercase tracking-[0.2em]">Required Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedJob.skillsRequired.map(skill => (
                                                <Badge key={skill} className="px-5 py-2.5 rounded-2xl bg-muted/50 border-border text-foreground font-black text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedJob.additionalDetails.length > 0 && (
                                        <div className="pt-8 border-t border-border space-y-6">
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em]">Additional Criteria</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedJob.additionalDetails.map((detail, idx) => (
                                                    <div key={idx} className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{detail.key}</span>
                                                        <span className="font-black text-sm text-primary">{detail.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-10">
                            <Card className="rounded-[40px] bg-foreground text-background shadow-2xl">
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Compensation</p>
                                            <p className="text-2xl font-black">
                                                {selectedJob.salary.isRangeHidden ? 'Undisclosed' : `₹ ${selectedJob.salary.min} - ${selectedJob.salary.max} LPA`}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Locations</p>
                                            <p className="text-lg font-bold">{selectedJob.location}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Experience</p>
                                            <p className="text-lg font-bold">{selectedJob.experience.min} - {selectedJob.experience.max} Years</p>
                                        </div>
                                    </div>
                                    <div className="pt-8 border-t border-background/10 space-y-4">
                                        <div className="flex items-center justify-between font-black text-xs uppercase tracking-widest">
                                            <span className="opacity-40">Active Vacancies</span>
                                            <span>{selectedJob.vacancies} Positions</span>
                                        </div>
                                        <div className="flex items-center justify-between font-black text-xs uppercase tracking-widest">
                                            <span className="opacity-40">Last Updated</span>
                                            <span>{new Date(selectedJob.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button className="w-full h-16 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform">
                                <ExternalLink className="w-5 h-5 mr-3" /> View Applicants
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── VIEW: CREATE JOB FORM ── */}
            {viewMode === 'create' && (
                <form id="post-job-form" onSubmit={handleSubmit} className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-8 rounded-[40px] border border-primary/10">
                        <div className="flex items-center gap-6">
                            <Button 
                                type="button"
                                variant="ghost" 
                                onClick={() => { setViewMode('list'); resetForm(); }}
                                className="w-12 h-12 rounded-2xl bg-muted/50 hover:bg-muted border border-border"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                             <div className="space-y-1">
                                <h1 className="text-3xl font-black tracking-tight">{editingJobId ? 'Retouch Position' : 'Post New Position'}</h1>
                                <p className="text-muted-foreground font-bold">{editingJobId ? 'Refine the details of your opportunity' : 'Define the future of your team'}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button 
                                type="button"
                                variant="ghost" 
                                onClick={() => { setViewMode('list'); resetForm(); }}
                                className="rounded-2xl font-black text-sm uppercase tracking-widest px-8"
                            >
                                Discard
                            </Button>
                            <Button 
                                type="button"
                                variant="outline"
                                onClick={() => handleSubmit(null, 'draft')}
                                loading={draftLoading}
                                disabled={loading}
                                className="rounded-2xl font-black text-sm uppercase tracking-widest px-8 border-primary/20 text-primary hover:bg-primary/5"
                            >
                                <FileText className="w-4 h-4 mr-2" /> Save as Draft
                            </Button>
                            <Button 
                                type="submit"
                                form="post-job-form"
                                loading={loading}
                                disabled={draftLoading}
                                className="rounded-2xl font-black text-sm uppercase tracking-widest px-10 h-14 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                            >
                                <Send className="w-4 h-4 mr-2" /> Publish Position
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                            {/* Role architecture */}
                            <Card className="rounded-[40px] border-border shadow-sm">
                                <CardHeader className="p-10 pb-4">
                                    <CardTitle className="text-xl font-black flex items-center gap-3 ">
                                        Position Blueprint
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Internal Title / Role</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input 
                                                placeholder="e.g. Senior Software Architect"
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                required
                                                className="pl-11 h-16 rounded-2xl bg-muted/20 border-border font-bold focus:bg-background transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Scope of Responsibilities</Label>
                                        <textarea 
                                            className="w-full min-h-[300px] p-8 rounded-[32px] bg-muted/20 border border-border font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background text-sm leading-relaxed"
                                            placeholder="What will this person achieve in their first 6 months?..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            required
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                                {/* Requirements */}
                                <Card className="rounded-[40px] border-border shadow-sm">
                                    <CardHeader className="p-10 pb-4">
                                        <CardTitle className="text-xl font-black flex items-center gap-3">
                                            <Target className="text-primary w-5 h-5" /> Requirements & Expertise
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-10 space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Min Experience (Years)</Label>
                                                <Input 
                                                    type="number" 
                                                    value={formData.experience.min}
                                                    onChange={(e) => setFormData({...formData, experience: {...formData.experience, min: e.target.value}})}
                                                    className="h-14 rounded-2xl bg-muted/20 border-border font-bold text-lg"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Max Experience (Years)</Label>
                                                <Input 
                                                    type="number" 
                                                    value={formData.experience.max}
                                                    onChange={(e) => setFormData({...formData, experience: {...formData.experience, max: e.target.value}})}
                                                    className="h-14 rounded-2xl bg-muted/20 border-border font-bold text-lg"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Core Expertise Stack</Label>
                                            <div className="flex gap-3">
                                                <Input 
                                                    placeholder="e.g. React.js, Python, Project Management..."
                                                    value={newSkill}
                                                    onChange={(e) => setNewSkill(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                                    className="h-14 rounded-2xl bg-muted/20 border-border font-bold"
                                                />
                                                <Button type="button" onClick={handleAddSkill} className="h-14 w-14 rounded-2xl shrink-0 shadow-lg bg-primary hover:bg-primary/90 transition-all">
                                                    <Plus className="w-6 h-6" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-3 pt-2">
                                                {formData.skillsRequired.map((skill) => (
                                                    <Badge key={skill} className="px-5 py-2.5 rounded-2xl font-black text-xs bg-primary/10 text-primary border-primary/20 flex items-center gap-3 hover:bg-primary/20 transition-all cursor-default">
                                                        {skill}
                                                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-destructive text-primary/40 hover:opacity-100 transition-all">
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                            {/* Additional Criteria */}
                            <Card className="rounded-[40px] border-border shadow-sm border-dashed border-2 bg-gradient-to-b from-transparent to-primary/5">
                                <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-black">Dynamic Matrix</CardTitle>
                                        <CardDescription className="font-bold">Add bespoke requirements (Gender, Notice Period, Shift etc.)</CardDescription>
                                    </div>
                                    <Button type="button" variant="outline" onClick={handleAddDetail} className="rounded-xl border-primary/20 text-primary hover:bg-white shadow-sm">
                                        <Plus className="w-4 h-4 mr-2" /> New Matrix
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-10 space-y-6 pt-0">
                                    {formData.additionalDetails.map((detail, index) => (
                                        <div key={index} className="flex gap-6 items-end group">
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60">Key Identifier</Label>
                                                <Input 
                                                    placeholder="e.g. Notice Period"
                                                    value={detail.key}
                                                    onChange={(e) => handleDetailChange(index, 'key', e.target.value)}
                                                    className="h-14 rounded-2xl bg-white border-border font-bold shadow-sm"
                                                />
                                            </div>
                                            <div className="flex-[2] space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60">Expected Value</Label>
                                                <Input 
                                                    placeholder="e.g. 15 Days (Immediate)"
                                                    value={detail.value}
                                                    onChange={(e) => handleDetailChange(index, 'value', e.target.value)}
                                                    className="h-14 rounded-2xl bg-white border-border font-bold shadow-sm"
                                                />
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                onClick={() => handleRemoveDetail(index)}
                                                className="h-14 w-14 rounded-2xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-10">
                            {/* Distribution settings */}
                            <Card className="rounded-[40px] border-border shadow-sm overflow-hidden">
                                <CardHeader className="p-10 pb-4 bg-muted/20">
                                    <CardTitle className="text-lg font-black flex items-center gap-3">
                                        <Target className="w-5 h-5 text-primary" /> Delivery Logic
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-10 space-y-10">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Contract Type</Label>
                                        <select 
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/20 border border-border font-black text-sm focus:bg-background transition-all outline-none"
                                            value={formData.jobType}
                                            onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                                        >
                                            {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Arrangement</Label>
                                        <select 
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/20 border border-border font-black text-sm focus:bg-background transition-all outline-none"
                                            value={formData.workMode}
                                            onChange={(e) => setFormData({...formData, workMode: e.target.value})}
                                        >
                                            {['On-site', 'Remote', 'Hybrid'].map(mode => (
                                                <option key={mode} value={mode}>{mode}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Base Location</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input 
                                                placeholder="e.g. Pune, Maharashtra"
                                                value={formData.location}
                                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                                className="pl-11 h-14 rounded-2xl bg-muted/20 border-border font-bold"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Reward Bracket */}
                            <Card className="rounded-[40px] border-border shadow-sm overflow-hidden border-2 border-primary/20 bg-primary/5">
                                <CardHeader className="p-10 pb-4">
                                    <CardTitle className="text-lg font-black flex items-center gap-3">
                                        <DollarSign className="w-5 h-5 text-primary" /> Compensation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8 pt-0">
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[10px] uppercase font-black opacity-60">Min</Label>
                                            <Input 
                                                placeholder="7.5"
                                                disabled={formData.salary.isRangeHidden}
                                                value={formData.salary.min}
                                                onChange={(e) => setFormData({...formData, salary: {...formData.salary, min: e.target.value}})}
                                                className="h-14 rounded-2xl bg-background border-border font-grey text-lg"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[10px] uppercase font-black opacity-60">Max</Label>
                                            <Input 
                                                placeholder="15.0"
                                                disabled={formData.salary.isRangeHidden}
                                                value={formData.salary.max}
                                                onChange={(e) => setFormData({...formData, salary: {...formData.salary, max: e.target.value}})}
                                                className="h-14 rounded-2xl bg-background border-border font-grey text-lg"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-background/50 p-6 rounded-3xl border border-primary/10">
                                        <input 
                                            type="checkbox" 
                                            id="hide-range"
                                            className="w-6 h-6 accent-primary cursor-pointer rounded-lg"
                                            checked={formData.salary.isRangeHidden}
                                            onChange={(e) => setFormData({...formData, salary: {...formData.salary, isRangeHidden: e.target.checked}})}
                                        />
                                        <Label htmlFor="hide-range" className="text-sm font-black cursor-pointer uppercase tracking-tight">As per Industry Standard</Label>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default PostJob;
