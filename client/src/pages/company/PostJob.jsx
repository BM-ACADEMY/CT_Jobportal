import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Briefcase, MapPin, Clock, DollarSign, Users, FileText, Plus, X, Sparkles, LayoutGrid, Send, Trash2, Target, ChevronLeft, ArrowRight, ExternalLink, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
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
        additionalDetails: [],
        applicationQuestions: [
            { questionText: 'Full Name', type: 'text', isRequired: true, isStandard: true, enabled: true },
            { questionText: 'Email Address', type: 'text', isRequired: true, isStandard: true, enabled: true },
            { questionText: 'Phone Number', type: 'text', isRequired: true, isStandard: true, enabled: true },
            { questionText: 'Resume/CV', type: 'text', isRequired: true, isStandard: true, enabled: true },
        ]
    });

    const standardFields = [
        { id: 'name', label: 'Full Name', type: 'text' },
        { id: 'email', label: 'Email Address', type: 'text' },
        { id: 'phone', label: 'Phone Number', type: 'text' },
        { id: 'resume', label: 'Resume/CV', type: 'text' },
        { id: 'coverLetter', label: 'Cover Letter', type: 'textarea' },
        { id: 'portfolio', label: 'Portfolio URL', type: 'text' },
    ];

    const toggleStandardField = (field) => {
        const exists = formData.applicationQuestions.find(q => q.questionText === field.label);
        if (exists) {
            setFormData({
                ...formData,
                applicationQuestions: formData.applicationQuestions.filter(q => q.questionText !== field.label)
            });
        } else {
            setFormData({
                ...formData,
                applicationQuestions: [...formData.applicationQuestions, { 
                    questionText: field.label, 
                    type: field.type, 
                    isRequired: true, 
                    isStandard: true 
                }]
            });
        }
    };

    const addCustomQuestion = () => {
        setFormData({
            ...formData,
            applicationQuestions: [...formData.applicationQuestions, { 
                questionText: '', 
                type: 'text', 
                isRequired: true, 
                isStandard: false,
                options: []
            }]
        });
    };

    const updateCustomQuestion = (index, updates) => {
        const updated = [...formData.applicationQuestions];
        updated[index] = { ...updated[index], ...updates };
        setFormData({ ...formData, applicationQuestions: updated });
    };

    const removeCustomQuestion = (index) => {
        const updated = [...formData.applicationQuestions];
        updated.splice(index, 1);
        setFormData({ ...formData, applicationQuestions: updated });
    };

    const addQuestionOption = (qIndex) => {
        const updated = [...formData.applicationQuestions];
        const question = updated[qIndex];
        question.options = [...(question.options || []), ''];
        setFormData({ ...formData, applicationQuestions: updated });
    };

    const updateQuestionOption = (qIndex, oIndex, value) => {
        const updated = [...formData.applicationQuestions];
        updated[qIndex].options[oIndex] = value;
        setFormData({ ...formData, applicationQuestions: updated });
    };

    const removeQuestionOption = (qIndex, oIndex) => {
        const updated = [...formData.applicationQuestions];
        updated[qIndex].options.splice(oIndex, 1);
        setFormData({ ...formData, applicationQuestions: updated });
    };

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
            additionalDetails: [],
            applicationQuestions: [
                { questionText: 'Full Name', type: 'text', isRequired: true, isStandard: true },
                { questionText: 'Email Address', type: 'text', isRequired: true, isStandard: true },
                { questionText: 'Phone Number', type: 'text', isRequired: true, isStandard: true },
                { questionText: 'Resume/CV', type: 'text', isRequired: true, isStandard: true },
            ]
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
            additionalDetails: job.additionalDetails || [],
            applicationQuestions: job.applicationQuestions || [
                { questionText: 'Full Name', type: 'text', isRequired: true, isStandard: true },
                { questionText: 'Email Address', type: 'text', isRequired: true, isStandard: true },
                { questionText: 'Phone Number', type: 'text', isRequired: true, isStandard: true },
                { questionText: 'Resume/CV', type: 'text', isRequired: true, isStandard: true },
            ]
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
    const [quota, setQuota] = useState(null);

    useEffect(() => {
        const fetchQuota = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/quota`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQuota(res.data);
            } catch { /* quota display is non-critical */ }
        };
        fetchQuota();
    }, [jobs]);

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
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    const DisplayField = ({ label, value, icon: Icon }) => (
        <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3 text-emerald-600/70" />}
                {label}
            </p>
            <p className="text-sm font-semibold text-foreground">{value || '—'}</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
            
            {/* ── VIEW: LIST OF JOBS ── */}
            {viewMode === 'list' && (
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Job <span className="text-emerald-600">Postings</span>
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">Manage and track your active recruitment opportunities</p>
                            {quota && !quota.unlimited && (
                                <div className={`mt-2 inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full ${
                                    quota.used >= quota.limit ? 'bg-rose-50 text-rose-600' :
                                    quota.used >= quota.limit * 0.8 ? 'bg-amber-50 text-amber-600' :
                                    'bg-emerald-50 text-emerald-700'
                                }`}>
                                    <Briefcase className="w-3 h-3" />
                                    {quota.used}/{quota.limit} job postings used
                                    {quota.used >= quota.limit && ' — Limit reached'}
                                </div>
                            )}
                        </div>
                        <Button
                            onClick={() => setViewMode('create')}
                            disabled={quota && !quota.unlimited && quota.used >= quota.limit}
                            className="rounded-lg font-semibold px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Post a New Job
                        </Button>
                    </div>

                    {/* Job posting limit reached banner */}
                    {quota && !quota.unlimited && quota.used >= quota.limit && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl border border-rose-200 bg-rose-50">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={16} className="text-rose-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-rose-800">Job posting limit reached ({quota.used}/{quota.limit})</p>
                                    <p className="text-xs text-rose-600 mt-0.5">
                                        Your current plan allows {quota.limit} job posting{quota.limit > 1 ? 's' : ''}. Delete an existing job to free up a slot, or upgrade your plan for more.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Link to="/company/subscription">
                                    <Button size="sm" className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 h-9 px-4">
                                        <Sparkles size={12} /> Upgrade Plan
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <Card 
                                key={job._id} 
                                onClick={() => { setSelectedJob(job); setViewMode('detail'); }}
                                className="group rounded-xl border-border bg-white hover:border-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/5 transition-all cursor-pointer overflow-hidden relative"
                            >
                                <div className="absolute top-4 right-4">
                                    <Badge className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                        job.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                        job.status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                        {job.status}
                                    </Badge>
                                </div>
                                <CardHeader className="p-6 pb-2">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Briefcase className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <CardTitle className="text-lg font-bold group-hover:text-emerald-600 transition-colors pr-12 line-clamp-1">
                                        {job.title}
                                    </CardTitle>
                                    <CardDescription className="font-medium flex items-center gap-1.5 mt-1">
                                        <MapPin className="w-3.5 h-3.5" /> {job.location || 'Remote'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 pt-4 space-y-4">
                                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-emerald-600/70" />
                                            {job.applicantsCount} Applicants
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-emerald-600/70" />
                                            {job.jobType}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-border flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {jobs.length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-4 bg-muted/20 border border-dashed border-border rounded-xl">
                                <Sparkles className="w-10 h-10 text-emerald-600/30 mx-auto" />
                                <h3 className="text-lg font-bold text-muted-foreground">No active postings</h3>
                                <p className="text-sm text-muted-foreground/70">Start your recruitment journey by posting your first job.</p>
                                <Button 
                                    onClick={() => setViewMode('create')}
                                    variant="outline"
                                    className="mt-4 rounded-lg font-semibold border-emerald-600/20 text-emerald-700 hover:bg-emerald-50"
                                >
                                    Post Your First Job
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── VIEW: JOB DETAILS ── */}
            {viewMode === 'detail' && selectedJob && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                onClick={() => setViewMode('list')}
                                className="w-10 h-10 p-0 rounded-lg border-border hover:bg-muted"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">{selectedJob.title}</h2>
                                <p className="text-muted-foreground text-sm font-medium">Full specifications and requirements</p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button 
                                variant="outline" 
                                onClick={() => handleEdit(selectedJob)}
                                className="rounded-lg font-semibold border-border hover:bg-muted flex-1 md:flex-none"
                            >
                                Edit Job
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => handleStatusToggle(selectedJob)}
                                className="rounded-lg font-semibold border-border hover:bg-muted flex-1 md:flex-none"
                            >
                                {selectedJob.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => handleDelete(selectedJob._id)}
                                className="w-10 h-10 p-0 rounded-lg text-destructive hover:bg-destructive/5"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="rounded-xl border-border bg-white shadow-none">
                                <CardHeader className="p-6 border-b border-border/50">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider">
                                            {selectedJob.jobType}
                                        </Badge>
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider">
                                            {selectedJob.workMode}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg font-bold mt-4">Job Description</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-8">
                                    <div className="text-sm text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap">
                                        {selectedJob.description}
                                    </div>

                                    <div className="pt-6 border-t border-border/50 space-y-4">
                                        <h3 className="font-bold text-xs uppercase tracking-widest text-emerald-600/70">Required Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedJob.skillsRequired.map(skill => (
                                                <Badge key={skill} className="px-3 py-1.5 rounded-md bg-muted/50 border-border text-foreground font-semibold text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedJob.additionalDetails.length > 0 && (
                                        <div className="pt-6 border-t border-border/50 space-y-4">
                                            <h3 className="font-bold text-xs uppercase tracking-widest text-emerald-600/70">Additional Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedJob.additionalDetails.map((detail, idx) => (
                                                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{detail.key}</span>
                                                        <span className="font-semibold text-sm text-emerald-600">{detail.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="rounded-xl bg-slate-950 text-white shadow-xl">
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Compensation</p>
                                            <p className="text-xl font-bold">
                                                {selectedJob.salary.isRangeHidden ? 'As per Industry' : `₹ ${selectedJob.salary.min} - ${selectedJob.salary.max} LPA`}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Location</p>
                                            <p className="text-md font-semibold">{selectedJob.location}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Experience</p>
                                            <p className="text-md font-semibold">{selectedJob.experience.min} - {selectedJob.experience.max} Years</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 space-y-3">
                                        <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider">
                                            <span className="text-white/40">Vacancies</span>
                                            <span>{selectedJob.vacancies} Positions</span>
                                        </div>
                                        <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider">
                                            <span className="text-white/40">Posted on</span>
                                            <span>{new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button 
                                onClick={() => navigate(`/company/applicants/${selectedJob._id}`)}
                                className="w-full h-12 rounded-lg font-bold text-sm uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/10 transition-all"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" /> View Applicants
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── VIEW: CREATE JOB FORM ── */}
            {viewMode === 'create' && (
                <form id="post-job-form" onSubmit={handleSubmit} className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
                        <div className="flex items-center gap-4">
                            <Button 
                                type="button"
                                variant="outline" 
                                onClick={() => { setViewMode('list'); resetForm(); }}
                                className="w-10 h-10 p-0 rounded-lg border-border hover:bg-muted"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">{editingJobId ? 'Edit Job' : 'Post a New Job'}</h1>
                                <p className="text-muted-foreground text-sm font-medium">{editingJobId ? 'Update your recruitment criteria' : 'Specify the details for your new opening'}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button 
                                type="button"
                                variant="outline" 
                                onClick={() => handleSubmit(null, 'draft')}
                                disabled={loading || draftLoading}
                                className="rounded-lg font-semibold px-6 border-border hover:bg-muted flex-1 md:flex-none"
                            >
                                {draftLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                                Save Draft
                            </Button>
                            <Button 
                                type="submit"
                                form="post-job-form"
                                disabled={loading || draftLoading}
                                className="rounded-lg font-semibold px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex-1 md:flex-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                Publish Job
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="rounded-xl border-border bg-white shadow-none">
                                <CardHeader className="p-6 border-b border-border/50">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <LayoutGrid className="text-emerald-600 w-5 h-5" /> Job Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground">Job Title</Label>
                                        <Input 
                                            placeholder="e.g. Senior Software Engineer"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            required
                                            className="h-10 rounded-lg border-border focus-visible:ring-emerald-600 font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground">Full Description</Label>
                                        <textarea 
                                            className="w-full min-h-[250px] p-4 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-emerald-600 text-sm font-medium leading-relaxed"
                                            placeholder="Outline roles, responsibilities, and benefits..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            required
                                        />
                                    </div>
                                </CardContent>
                                     <Card className="rounded-xl border-border bg-white shadow-none">
                                <CardHeader className="p-6 border-b border-border/50">
                                     <CardTitle className="text-lg font-bold flex items-center gap-2">
                                         <Target className="text-emerald-600 w-5 h-5" /> Requirements
                                     </CardTitle>
                                 </CardHeader>
                                 <CardContent className="p-6 space-y-8">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="space-y-2">
                                             <Label className="text-xs font-semibold text-muted-foreground">Min Experience (Years)</Label>
                                             <Input 
                                                 type="number" 
                                                 value={formData.experience.min}
                                                 onChange={(e) => setFormData({...formData, experience: {...formData.experience, min: e.target.value}})}
                                                 className="h-10 rounded-lg border-border focus-visible:ring-emerald-600 font-semibold"
                                             />
                                         </div>
                                         <div className="space-y-2">
                                             <Label className="text-xs font-semibold text-muted-foreground">Max Experience (Years)</Label>
                                             <Input 
                                                 type="number" 
                                                 value={formData.experience.max}
                                                 onChange={(e) => setFormData({...formData, experience: {...formData.experience, max: e.target.value}})}
                                                 className="h-10 rounded-lg border-border focus-visible:ring-emerald-600 font-semibold"
                                             />
                                         </div>
                                     </div>

                                     <div className="space-y-4">
                                         <Label className="text-xs font-semibold text-muted-foreground">Required Skills</Label>
                                         <div className="flex gap-2">
                                             <Input 
                                                 placeholder="Add a skill..."
                                                 value={newSkill}
                                                 onChange={(e) => setNewSkill(e.target.value)}
                                                 onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                                 className="h-10 rounded-lg border-border focus-visible:ring-emerald-600 font-semibold"
                                             />
                                             <Button type="button" onClick={handleAddSkill} className="h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700">
                                                 <Plus className="w-4 h-4" />
                                             </Button>
                                         </div>
                                         <div className="flex flex-wrap gap-2 pt-2">
                                             {formData.skillsRequired.map((skill) => (
                                                 <Badge key={skill} className="px-3 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-2">
                                                     {skill}
                                                     <X size={12} className="cursor-pointer" onClick={() => handleRemoveSkill(skill)} />
                                                 </Badge>
                                             ))}
                                         </div>
                                     </div>
                                 </CardContent>
                             </Card>

                            <Card className="rounded-xl border-border bg-white shadow-none border-emerald-600/5">
                                <CardHeader className="p-6 border-b border-border/50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                <FileText className="text-emerald-600 w-5 h-5" /> Application Form Builder
                                            </CardTitle>
                                            <CardDescription className="text-xs">Select fields and add custom questions for applicants</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-8">
                                    {/* Standard Fields */}
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Standard Fields</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {standardFields.map((field) => {
                                                const isEnabled = formData.applicationQuestions.some(q => q.questionText === field.label);
                                                return (
                                                    <div 
                                                        key={field.id}
                                                        onClick={() => toggleStandardField(field)}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                            isEnabled 
                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                                                            : 'bg-white border-border text-muted-foreground hover:border-emerald-200'
                                                        }`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                            isEnabled ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-border'
                                                        }`}>
                                                            {isEnabled && <Plus size={10} className="text-white rotate-45" />}
                                                        </div>
                                                        <span className="text-xs font-bold uppercase tracking-tight">{field.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Custom Questions */}
                                    <div className="space-y-4 pt-6 border-t border-border/50">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Custom Questions</Label>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={addCustomQuestion}
                                                className="h-8 rounded-md border-emerald-600/20 text-emerald-700 hover:bg-emerald-50"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Question
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {formData.applicationQuestions.filter(q => !q.isStandard).map((question, qIdx) => {
                                                // Find the original index in the full array
                                                const fullIdx = formData.applicationQuestions.findIndex((q, i) => i >= 0 && q === question);
                                                return (
                                                    <div key={qIdx} className="p-4 rounded-xl border border-border bg-slate-50/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="flex gap-4">
                                                            <div className="flex-1 space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Question Text</Label>
                                                                <Input 
                                                                    placeholder="e.g. Why do you want to join us?"
                                                                    value={question.questionText}
                                                                    onChange={(e) => updateCustomQuestion(fullIdx, { questionText: e.target.value })}
                                                                    className="h-9 rounded-md bg-white"
                                                                />
                                                            </div>
                                                            <div className="w-40 space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</Label>
                                                                <select 
                                                                    className="w-full h-9 px-2 rounded-md border border-border text-xs font-bold bg-white"
                                                                    value={question.type}
                                                                    onChange={(e) => updateCustomQuestion(fullIdx, { type: e.target.value })}
                                                                >
                                                                    <option value="text">Short Text</option>
                                                                    <option value="textarea">Long Text</option>
                                                                    <option value="multiple-choice">Multiple Choice</option>
                                                                </select>
                                                            </div>
                                                            <div className="flex items-end pb-1">
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    onClick={() => removeCustomQuestion(fullIdx)}
                                                                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {question.type === 'multiple-choice' && (
                                                            <div className="pl-4 space-y-3 border-l-2 border-emerald-100">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Options</Label>
                                                                <div className="space-y-2">
                                                                    {(question.options || []).map((opt, oIdx) => (
                                                                        <div key={oIdx} className="flex gap-2 items-center">
                                                                            <div className="w-2 h-2 rounded-full border-2 border-emerald-600/30" />
                                                                            <Input 
                                                                                placeholder={`Option ${oIdx + 1}`}
                                                                                value={opt}
                                                                                onChange={(e) => updateQuestionOption(fullIdx, oIdx, e.target.value)}
                                                                                className="h-8 rounded-md bg-white text-xs"
                                                                            />
                                                                            <Button 
                                                                                type="button" 
                                                                                variant="ghost" 
                                                                                onClick={() => removeQuestionOption(fullIdx, oIdx)}
                                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                                            >
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    <Button 
                                                                        type="button" 
                                                                        variant="ghost" 
                                                                        onClick={() => addQuestionOption(fullIdx)}
                                                                        className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 p-0 h-auto"
                                                                    >
                                                                        + Add Option
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {formData.applicationQuestions.filter(q => !q.isStandard).length === 0 && (
                                                <p className="text-center py-4 text-xs font-medium text-muted-foreground italic">No custom questions added</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>                     </Card>

                            <Card className="rounded-xl border-border bg-white shadow-none border-dashed">
                                <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold">Additional Specs</CardTitle>
                                        <CardDescription className="text-xs font-medium">Custom fields for specific criteria</CardDescription>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddDetail} className="rounded-lg border-emerald-600/20 text-emerald-700 hover:bg-emerald-50">
                                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Field
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {formData.additionalDetails.map((detail, index) => (
                                        <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Label</Label>
                                                <Input 
                                                    placeholder="e.g. Notice Period"
                                                    value={detail.key}
                                                    onChange={(e) => handleDetailChange(index, 'key', e.target.value)}
                                                    className="h-10 rounded-lg border-border"
                                                />
                                            </div>
                                            <div className="flex-[1.5] space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Value</Label>
                                                <Input 
                                                    placeholder="e.g. 30 Days"
                                                    value={detail.value}
                                                    onChange={(e) => handleDetailChange(index, 'value', e.target.value)}
                                                    className="h-10 rounded-lg border-border"
                                                />
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                onClick={() => handleRemoveDetail(index)}
                                                className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {formData.additionalDetails.length === 0 && (
                                        <p className="text-center py-4 text-xs font-medium text-muted-foreground italic">No custom fields added</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="rounded-xl border-border bg-white shadow-none">
                                <CardHeader className="p-6 border-b border-border/50">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <MapPin className="text-emerald-600 w-5 h-5" /> Logistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground">Job Type</Label>
                                        <select 
                                            className="w-full h-10 px-3 rounded-lg border border-border text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                                            value={formData.jobType}
                                            onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                                        >
                                            {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground">Work Mode</Label>
                                        <select 
                                            className="w-full h-10 px-3 rounded-lg border border-border text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                                            value={formData.workMode}
                                            onChange={(e) => setFormData({...formData, workMode: e.target.value})}
                                        >
                                            {['On-site', 'Remote', 'Hybrid'].map(mode => (
                                                <option key={mode} value={mode}>{mode}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground">Location</Label>
                                        <Input 
                                            placeholder="e.g. Bengaluru, Karnataka"
                                            value={formData.location}
                                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            className="h-10 rounded-lg border-border focus-visible:ring-emerald-600 font-semibold"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border-border bg-emerald-50/50 shadow-none border-emerald-600/10">
                                <CardHeader className="p-6 border-b border-emerald-600/10">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <DollarSign className="text-emerald-600 w-5 h-5" /> Salary Range
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min (LPA)</Label>
                                            <Input 
                                                placeholder="e.g. 5"
                                                type="number"
                                                disabled={formData.salary.isRangeHidden}
                                                value={formData.salary.min}
                                                onChange={(e) => setFormData({...formData, salary: {...formData.salary, min: e.target.value}})}
                                                className="h-10 rounded-lg bg-white border-border font-semibold"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Max (LPA)</Label>
                                            <Input 
                                                placeholder="e.g. 10"
                                                type="number"
                                                disabled={formData.salary.isRangeHidden}
                                                value={formData.salary.max}
                                                onChange={(e) => setFormData({...formData, salary: {...formData.salary, max: e.target.value}})}
                                                className="h-10 rounded-lg bg-white border-border font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <input 
                                            type="checkbox" 
                                            id="hide-range"
                                            className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                                            checked={formData.salary.isRangeHidden}
                                            onChange={(e) => setFormData({...formData, salary: {...formData.salary, isRangeHidden: e.target.checked}})}
                                        />
                                        <Label htmlFor="hide-range" className="text-xs font-semibold cursor-pointer text-muted-foreground">As per Industry Standard</Label>
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
