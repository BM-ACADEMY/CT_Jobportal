import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  User, Mail, Phone, MapPin, Briefcase, Building2, 
  Plus, X, Upload, FileText, CheckCircle2, Loader2, Sparkles,
  Save, Trash2, LayoutGrid, Clock, Target, Globe, Factory,
  GraduationCap, Award, BookOpen, ShieldCheck, Calendar, Users, Settings2, ShieldAlert
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const getApiUrl = (role) => {
    if (role === 'company') return `${import.meta.env.VITE_API_BASE_URL}/company`;
    return `${import.meta.env.VITE_API_BASE_URL}/recruiter`;
};

const INDUSTRIES = [
    "Information Technology", "Finance / Banking", "Healthcare / Pharma", 
    "E-commerce / Retail", "Education / EdTech", "Manufacturing", 
    "Automotive", "Real Estate / Construction", "Media / Entertainment", 
    "Telecommunications", "Energy / Utilities", "Hospitality / Tourism", 
    "Logistics / Supply Chain", "Agriculture", "Aerospace / Defense", 
    "Legal / Law", "Marketing / Advertising", "Human Resources", 
    "Non-Profit / NGO", "Cybersecurity"
];

const RecruiterSettings = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newSkill, setNewSkill] = useState('');

    // Modal State for prompt replacement
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        description: '',
        placeholder: '',
        value: '',
        onConfirm: () => {}
    });

    // Form states
    const [formData, setFormData] = useState({
        name: user?.name || '',
        recruiterProfile: {
            jobTitle: user?.recruiterProfile?.jobTitle || '',
            phone: user?.recruiterProfile?.phone || '',
            location: user?.recruiterProfile?.location || '',
            bio: user?.recruiterProfile?.bio || '',
            currentExp: user?.recruiterProfile?.currentExp || 0,
            previousExp: user?.recruiterProfile?.previousExp || 0,
            totalExp: user?.recruiterProfile?.totalExp || 0,
            skills: user?.recruiterProfile?.skills || [],
            experience: user?.recruiterProfile?.experience || [],
            qualification: user?.recruiterProfile?.qualification || [],
            certifications: user?.recruiterProfile?.certifications || [],
        },
        companyData: {
            name: user?.company?.name || '',
            legal_name: user?.company?.legal_name || '',
            display_name: user?.company?.display_name || '',
            slug: user?.company?.slug || '',
            website: user?.company?.website || '',
            website_url: user?.company?.website_url || '',
            location: user?.company?.location || '',
            headquarters_address: user?.company?.headquarters_address || '',
            industry: user?.company?.industry || '',
            industry_tag: user?.company?.industry_tag || '',
            description: user?.company?.description || '',
            about_us: user?.company?.about_us || '',
            tagline: user?.company?.tagline || '',
            employeeCount: user?.company?.employeeCount || '',
            company_size_range: user?.company?.company_size_range || '',
            foundedYear: user?.company?.foundedYear || '',
            founded_year: user?.company?.founded_year || '',
            mission_statement: user?.company?.mission_statement || '',
            culture_values: user?.company?.culture_values || [],
            video_intro_url: user?.company?.video_intro_url || '',
            social_links: {
                linkedin: user?.company?.social_links?.linkedin || '',
                twitter: user?.company?.social_links?.twitter || '',
                glassdoor: user?.company?.social_links?.glassdoor || '',
                facebook: user?.company?.social_links?.facebook || '',
                instagram: user?.company?.social_links?.instagram || ''
            },
            work_model: user?.company?.work_model || ['Hybrid'],
            office_locations: user?.company?.office_locations || [],
            perks: {
                health_insurance: user?.company?.perks?.health_insurance || false,
                unlimited_pto: user?.company?.perks?.unlimited_pto || false,
                equity_package: user?.company?.perks?.equity_package || false,
                learning_stipend: user?.company?.perks?.learning_stipend || 0,
                remote_stipend: user?.company?.perks?.remote_stipend || 0,
                gym_membership: user?.company?.perks?.gym_membership || false,
                free_meals: user?.company?.perks?.free_meals || false
            },
            tech_stack: user?.company?.tech_stack || [],
            is_verified: user?.company?.is_verified || false,
            tax_id_ein: user?.company?.tax_id_ein || '',
            admin_email: user?.company?.admin_email || '',
            subscription_tier: user?.company?.subscription_tier || 'Free',
            account_status: user?.company?.account_status || 'Pending',
            gallery_images: user?.company?.gallery_images || [],
            norms_conditions: user?.company?.norms_conditions || ''
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${getApiUrl(user?.role)}/profile`);
                const data = res.data;
                setFormData({
                    name: data.name || '',
                    recruiterProfile: {
                        jobTitle: data.recruiterProfile?.jobTitle || '',
                        phone: data.recruiterProfile?.phone || '',
                        location: data.recruiterProfile?.location || '',
                        bio: data.recruiterProfile?.bio || '',
                        currentExp: data.recruiterProfile?.currentExp || 0,
                        previousExp: data.recruiterProfile?.previousExp || 0,
                        totalExp: data.recruiterProfile?.totalExp || 0,
                        skills: data.recruiterProfile?.skills || [],
                        experience: data.recruiterProfile?.experience || [],
                        qualification: data.recruiterProfile?.qualification || [],
                        certifications: data.recruiterProfile?.certifications || [],
                    },
                    companyData: {
                        name: data.company?.name || '',
                        legal_name: data.company?.legal_name || '',
                        display_name: data.company?.display_name || '',
                        slug: data.company?.slug || '',
                        website: data.company?.website || '',
                        website_url: data.company?.website_url || '',
                        location: data.company?.location || '',
                        headquarters_address: data.company?.headquarters_address || '',
                        industry: data.company?.industry || '',
                        industry_tag: data.company?.industry_tag || '',
                        description: data.company?.description || '',
                        about_us: data.company?.about_us || '',
                        tagline: data.company?.tagline || '',
                        employeeCount: data.company?.employeeCount || '',
                        company_size_range: data.company?.company_size_range || '',
                        foundedYear: data.company?.foundedYear || '',
                        founded_year: data.company?.founded_year || '',
                        mission_statement: data.company?.mission_statement || '',
                        culture_values: data.company?.culture_values || [],
                        video_intro_url: data.company?.video_intro_url || '',
                        social_links: {
                            linkedin: data.company?.social_links?.linkedin || '',
                            twitter: data.company?.social_links?.twitter || '',
                            glassdoor: data.company?.social_links?.glassdoor || '',
                            facebook: data.company?.social_links?.facebook || '',
                            instagram: data.company?.social_links?.instagram || ''
                        },
                        work_model: data.company?.work_model || ['Hybrid'],
                        office_locations: data.company?.office_locations || [],
                        perks: {
                            health_insurance: data.company?.perks?.health_insurance || false,
                            unlimited_pto: data.company?.perks?.unlimited_pto || false,
                            equity_package: data.company?.perks?.equity_package || false,
                            learning_stipend: data.company?.perks?.learning_stipend || 0,
                            remote_stipend: data.company?.perks?.remote_stipend || 0,
                            gym_membership: data.company?.perks?.gym_membership || false,
                            free_meals: data.company?.perks?.free_meals || false
                        },
                        tech_stack: data.company?.tech_stack || [],
                        is_verified: data.company?.is_verified || false,
                        tax_id_ein: data.company?.tax_id_ein || '',
                        admin_email: data.company?.admin_email || '',
                        subscription_tier: data.company?.subscription_tier || 'Free',
                        account_status: data.company?.account_status || 'Pending',
                        gallery_images: data.company?.gallery_images || [],
                        norms_conditions: data.company?.norms_conditions || ''
                    }
                });
            } catch (err) {
                console.error(err);
                toast.error("Asset synchronization failed");
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    // Auto-calculate Total Experience
    useEffect(() => {
        const current = Number(formData.recruiterProfile.currentExp) || 0;
        const previous = Number(formData.recruiterProfile.previousExp) || 0;
        if (formData.recruiterProfile.totalExp !== current + previous) {
            setFormData(prev => ({
                ...prev,
                recruiterProfile: {
                    ...prev.recruiterProfile,
                    totalExp: current + previous
                }
            }));
        }
    }, [formData.recruiterProfile.currentExp, formData.recruiterProfile.previousExp]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await axios.put(`${getApiUrl(user?.role)}/profile`, formData);
            updateUser(res.data.user);
            toast.success("Account infrastructure updated successfully");
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Infrastructural update failed");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const addSkill = () => {
        if (!newSkill.trim()) return;
        if (formData.recruiterProfile.skills.includes(newSkill.trim())) return;
        
        setFormData({
            ...formData,
            recruiterProfile: {
                ...formData.recruiterProfile,
                skills: [...formData.recruiterProfile.skills, newSkill.trim()]
            }
        });
        setNewSkill('');
    };

    const removeSkill = (skill) => {
        setFormData({
            ...formData,
            recruiterProfile: {
                ...formData.recruiterProfile,
                skills: formData.recruiterProfile.skills.filter(s => s !== skill)
            }
        });
    };

    const addExperience = () => {
        setFormData({
            ...formData,
            recruiterProfile: {
                ...formData.recruiterProfile,
                experience: [...formData.recruiterProfile.experience, { company: '', role: '', duration: '', description: '' }]
            }
        });
    };

    const addQualification = () => {
        setFormData({
            ...formData,
            recruiterProfile: {
                ...formData.recruiterProfile,
                qualification: [...formData.recruiterProfile.qualification, { degree: '', institution: '', year: '' }]
            }
        });
    };

    const addCertification = () => {
        setFormData({
            ...formData,
            recruiterProfile: {
                ...formData.recruiterProfile,
                certifications: [...formData.recruiterProfile.certifications, { name: '', organization: '', year: '' }]
            }
        });
    };

    if (fetching) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    const DisplayField = ({ label, value, icon: Icon }) => (
        <div className="space-y-1.5 group">
            <p className="text-[9px] uppercase font-bold tracking-[0.15em] text-slate-400 flex items-center gap-2 ml-0.5">
                {Icon && <Icon className="w-3 h-3 text-emerald-600/70" />}
                {label}
            </p>
            <p className="text-sm font-bold text-slate-900 px-0.5">{value || <span className="text-slate-300 font-medium italic">Not specified</span>}</p>
        </div>
    );

    const openAddItemModal = (type) => {
        const configs = {
            culture: {
                title: "Add Culture Value",
                description: "Enter a value that represents your company culture (e.g., Radical Candor, User-First).",
                placeholder: "e.g. Transparency",
                onConfirm: (val) => {
                    setFormData(prev => ({
                        ...prev, 
                        companyData: {
                            ...prev.companyData, 
                            culture_values: [...(prev.companyData.culture_values || []), val]
                        }
                    }));
                }
            },
            tech: {
                title: "Add Tech Stack",
                description: "Add a technology or tool your company uses.",
                placeholder: "e.g. React, Node.js",
                onConfirm: (val) => {
                    setFormData(prev => ({
                        ...prev, 
                        companyData: {
                            ...prev.companyData, 
                            tech_stack: [...(prev.companyData.tech_stack || []), val]
                        }
                    }));
                }
            },
            office: {
                title: "Add Office Location",
                description: "Add a city or country where your company has an office.",
                placeholder: "e.g. San Francisco, CA",
                onConfirm: (val) => {
                    setFormData(prev => ({
                        ...prev, 
                        companyData: {
                            ...prev.companyData, 
                            office_locations: [...(prev.companyData.office_locations || []), val]
                        }
                    }));
                }
            }
        };

        const config = configs[type];
        setModalConfig({
            ...config,
            value: '',
        });
        setIsModalOpen(true);
    };

    const handleModalConfirm = () => {
        if (modalConfig.value.trim()) {
            modalConfig.onConfirm(modalConfig.value.trim());
            setIsModalOpen(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
                        Account <span className="text-emerald-600">Infrastructure</span>
                    </h1>
                    <p className="text-base text-slate-500 font-medium">Manage your professional profile and organizational identity</p>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <Button 
                                variant="ghost" 
                                onClick={handleCancel}
                                className="h-11 text-xs font-bold uppercase tracking-widest text-slate-500 px-6"
                            >
                                Discard
                            </Button>
                            <Button 
                                onClick={handleSave}
                                disabled={loading}
                                className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest shadow-sm transition-all"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Commit Changes
                            </Button>
                        </>
                    ) : (
                        <Button 
                            onClick={() => setIsEditing(true)}
                            className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest shadow-sm transition-all"
                        >
                            <Settings2 className="w-4 h-4 mr-2" /> Modify Profile
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 h-auto flex-wrap justify-start overflow-x-auto shadow-sm gap-1 mb-10">
                    <TabsTrigger value="personal" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        Personal
                    </TabsTrigger>
                    <TabsTrigger value="company" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        Organization
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        Detailed
                    </TabsTrigger>
                    <TabsTrigger value="culture" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        Culture
                    </TabsTrigger>
                    <TabsTrigger value="tech" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        Tech
                    </TabsTrigger>
                    <TabsTrigger value="legal" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        Legal
                    </TabsTrigger>
                    {user?.role !== 'company' && (
                        <>
                            <TabsTrigger value="history" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                                Experience
                            </TabsTrigger>
                            <TabsTrigger value="academic" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                                Credentials
                            </TabsTrigger>
                        </>
                    )}
                    <TabsTrigger value="branding" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        Branding
                    </TabsTrigger>
                </TabsList>

                {/* ── TAB: PERSONAL PROFILE ── */}
                <TabsContent value="personal" className="space-y-8 outline-none mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-2 rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <User className="w-5 h-5" />
                                    </div>
                                    Identity Foundation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    {!isEditing ? (
                                        <>
                                            <DisplayField label="Full Name" value={formData.name} icon={User} />
                                            <DisplayField label="Direct Phone" value={formData.recruiterProfile.phone} icon={Phone} />
                                            <DisplayField label="Current Position" value={formData.recruiterProfile.jobTitle} icon={Briefcase} />
                                            <DisplayField label="Location" value={formData.recruiterProfile.location} icon={MapPin} />
                                            {user?.role !== 'company' && (
                                                <>
                                                    <DisplayField label="Current Company Exp" value={`${formData.recruiterProfile.currentExp} Years`} icon={Clock} />
                                                    <DisplayField label="Previous Exp" value={`${formData.recruiterProfile.previousExp} Years`} icon={Target} />
                                                    <div className="md:col-span-2">
                                                        <DisplayField label="Total Experience" value={`${formData.recruiterProfile.totalExp} Years`} icon={CheckCircle2} />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <DisplayField label="Professional Bio" value={formData.recruiterProfile.bio} icon={FileText} />
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                    <Input 
                                                        value={formData.name} 
                                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                        className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                    <Input 
                                                        value={formData.recruiterProfile.phone}
                                                        onChange={(e) => setFormData({
                                                            ...formData, 
                                                            recruiterProfile: {...formData.recruiterProfile, phone: e.target.value}
                                                        })}
                                                        className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Job Title</Label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                    <Input 
                                                        value={formData.recruiterProfile.jobTitle} 
                                                        onChange={(e) => setFormData({
                                                            ...formData, 
                                                            recruiterProfile: {...formData.recruiterProfile, jobTitle: e.target.value}
                                                        })}
                                                        className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</Label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                    <Input 
                                                        value={formData.recruiterProfile.location} 
                                                        onChange={(e) => setFormData({
                                                            ...formData, 
                                                            recruiterProfile: {...formData.recruiterProfile, location: e.target.value}
                                                        })}
                                                        className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                                    />
                                                </div>
                                            </div>
                                            {user?.role !== 'company' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Exp (Years)</Label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                            <Input 
                                                                type="number"
                                                                value={formData.recruiterProfile.currentExp} 
                                                                onChange={(e) => setFormData({
                                                                    ...formData, 
                                                                    recruiterProfile: {...formData.recruiterProfile, currentExp: e.target.value}
                                                                })}
                                                                className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Previous Exp (Years)</Label>
                                                        <div className="relative">
                                                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                            <Input 
                                                                type="number"
                                                                value={formData.recruiterProfile.previousExp} 
                                                                onChange={(e) => setFormData({
                                                                    ...formData, 
                                                                    recruiterProfile: {...formData.recruiterProfile, previousExp: e.target.value}
                                                                })}
                                                                className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bio</Label>
                                                        <textarea 
                                                            className="w-full min-h-[120px] p-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-medium transition-all"
                                                            value={formData.recruiterProfile.bio}
                                                            onChange={(e) => setFormData({
                                                                ...formData, 
                                                                recruiterProfile: {...formData.recruiterProfile, bio: e.target.value}
                                                            })}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    Strategic Expertise
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                {isEditing && (
                                    <div className="flex gap-3">
                                        <Input 
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                            placeholder="Append skill..." 
                                            className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                        />
                                        <Button onClick={addSkill} size="sm" className="bg-slate-900 hover:bg-emerald-600 h-11 px-5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all">Inject</Button>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2.5">
                                    {formData.recruiterProfile.skills.length > 0 ? (
                                        formData.recruiterProfile.skills.map((skill) => (
                                            <Badge key={skill} variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 py-2 px-4 rounded-xl flex items-center gap-2 font-bold text-[11px] shadow-sm transition-all">
                                                {skill}
                                                {isEditing && <X size={14} className="cursor-pointer text-emerald-400 hover:text-emerald-600" onClick={() => removeSkill(skill)} />}
                                            </Badge>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full py-8 text-slate-300">
                                            <Sparkles className="w-8 h-8 mb-2 opacity-20" />
                                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">No skills defined</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── TAB: PROFESSIONAL HISTORY ── */}
                <TabsContent value="history" className="space-y-8 outline-none mt-4">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-white/50">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                Professional Dossier
                            </CardTitle>
                            {isEditing && (
                                <Button onClick={addExperience} variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-widest transition-all">
                                    <Plus className="w-4 h-4 mr-2" /> Add Experience
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            {formData.recruiterProfile.experience.map((item, idx) => (
                                <div key={idx} className={`relative p-8 rounded-2xl border transition-all ${isEditing ? 'bg-slate-50/50 border-slate-100' : 'bg-white border-slate-100/50 shadow-sm'}`}>
                                    {isEditing && (
                                        <Button 
                                            onClick={() => {
                                                const newExp = [...formData.recruiterProfile.experience];
                                                newExp.splice(idx, 1);
                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                            }}
                                            variant="ghost" size="icon" className="absolute top-6 right-6 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-9 w-9 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {!isEditing ? (
                                            <>
                                                <div className="space-y-6">
                                                    <DisplayField label="Organization" value={item.company} icon={Building2} />
                                                    <DisplayField label="Professional Role" value={item.role} icon={Target} />
                                                    <DisplayField label="Tenure Duration" value={item.duration} icon={Clock} />
                                                </div>
                                                <DisplayField label="Operational Focus" value={item.description} icon={FileText} />
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company</Label>
                                                        <Input 
                                                            value={item.company}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.recruiterProfile.experience];
                                                                newExp[idx].company = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</Label>
                                                        <Input 
                                                            value={item.role}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.recruiterProfile.experience];
                                                                newExp[idx].role = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duration</Label>
                                                        <Input 
                                                            value={item.duration}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.recruiterProfile.experience];
                                                                newExp[idx].duration = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</Label>
                                                    <textarea 
                                                        className="w-full h-full min-h-[160px] p-4 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-medium transition-all"
                                                        value={item.description}
                                                        onChange={(e) => {
                                                            const newExp = [...formData.recruiterProfile.experience];
                                                            newExp[idx].description = e.target.value;
                                                            setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {formData.recruiterProfile.experience.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30 text-slate-300">
                                    <Briefcase className="w-12 h-12 mb-4 opacity-10" />
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">No professional history documented</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: CREDENTIALS ── */}
                <TabsContent value="academic" className="space-y-8 outline-none mt-4">
                    <div className="grid grid-cols-1 gap-10">
                        {/* Education */}
                        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    Academic Foundation
                                </CardTitle>
                                {isEditing && (
                                    <Button onClick={addQualification} variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-widest transition-all">
                                        <Plus className="w-4 h-4 mr-2" /> Add Qualification
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                {formData.recruiterProfile.qualification.map((item, idx) => (
                                    <div key={idx} className={`relative p-6 rounded-2xl border transition-all ${isEditing ? 'bg-slate-50/50 border-slate-100' : 'bg-white border-slate-100/50 shadow-sm'}`}>
                                        {isEditing && (
                                            <Button 
                                                onClick={() => {
                                                    const newQual = [...formData.recruiterProfile.qualification];
                                                    newQual.splice(idx, 1);
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                }}
                                                variant="ghost" size="icon" className="absolute top-5 right-5 text-slate-300 hover:text-rose-600 rounded-xl h-8 w-8 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {!isEditing ? (
                                                <>
                                                    <DisplayField label="Degree / Diploma" value={item.degree} icon={Award} />
                                                    <DisplayField label="Academic Institution" value={item.institution} icon={Building2} />
                                                    <DisplayField label="Completion Year" value={item.year} icon={Calendar} />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Degree</Label>
                                                        <Input 
                                                            value={item.degree}
                                                            onChange={(e) => {
                                                                const newQual = [...formData.recruiterProfile.qualification];
                                                                newQual[idx].degree = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institution</Label>
                                                        <Input 
                                                            value={item.institution}
                                                            onChange={(e) => {
                                                                const newQual = [...formData.recruiterProfile.qualification];
                                                                newQual[idx].institution = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Year</Label>
                                                        <Input 
                                                            value={item.year}
                                                            onChange={(e) => {
                                                                const newQual = [...formData.recruiterProfile.qualification];
                                                                newQual[idx].year = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Certifications */}
                        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    Professional Credentials
                                </CardTitle>
                                {isEditing && (
                                    <Button onClick={addCertification} variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-widest transition-all">
                                        <Plus className="w-4 h-4 mr-2" /> Add Certification
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                {formData.recruiterProfile.certifications.map((item, idx) => (
                                    <div key={idx} className={`relative p-6 rounded-2xl border transition-all ${isEditing ? 'bg-slate-50/50 border-slate-100' : 'bg-white border-slate-100/50 shadow-sm'}`}>
                                        {isEditing && (
                                            <Button 
                                                onClick={() => {
                                                    const newCert = [...formData.recruiterProfile.certifications];
                                                    newCert.splice(idx, 1);
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                }}
                                                variant="ghost" size="icon" className="absolute top-5 right-5 text-slate-300 hover:text-rose-600 rounded-xl h-8 w-8 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {!isEditing ? (
                                                <>
                                                    <DisplayField label="Credential Name" value={item.name} icon={FileText} />
                                                    <DisplayField label="Issuing Authority" value={item.organization} icon={ShieldCheck} />
                                                    <DisplayField label="Validation Year" value={item.year} icon={Calendar} />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Certification Name</Label>
                                                        <Input 
                                                            value={item.name}
                                                            onChange={(e) => {
                                                                const newCert = [...formData.recruiterProfile.certifications];
                                                                newCert[idx].name = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Issuing Org</Label>
                                                        <Input 
                                                            value={item.organization}
                                                            onChange={(e) => {
                                                                const newCert = [...formData.recruiterProfile.certifications];
                                                                newCert[idx].organization = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Year</Label>
                                                        <Input 
                                                            value={item.year}
                                                            onChange={(e) => {
                                                                const newCert = [...formData.recruiterProfile.certifications];
                                                                newCert[idx].year = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── TAB: ORGANIZATION DETAILS ── */}
                <TabsContent value="company" className="space-y-8 outline-none mt-4">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                Organizational Blueprint
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {!isEditing ? (
                                    <>
                                        <DisplayField label="Organization Name" value={formData.companyData.name} icon={Building2} />
                                        <DisplayField label="Legal Entity Name" value={formData.companyData.legal_name} icon={ShieldCheck} />
                                        <DisplayField label="Public Identifier" value={formData.companyData.display_name} icon={Sparkles} />
                                        <DisplayField label="Digital Key (Slug)" value={formData.companyData.slug} icon={Globe} />
                                        <DisplayField label="Digital Headquarters" value={formData.companyData.website} icon={Globe} />
                                        <DisplayField label="Official Asset URL" value={formData.companyData.website_url} icon={Globe} />
                                        <DisplayField label="Physical Headquarters" value={formData.companyData.headquarters_address} icon={MapPin} />
                                        <div className="md:col-span-2 space-y-3">
                                            <p className="text-[9px] uppercase font-bold tracking-[0.15em] text-slate-400 flex items-center gap-2 ml-0.5">
                                                <Factory className="w-3 h-3 text-emerald-600/70" />
                                                Strategic Industry Sectors
                                            </p>
                                            <div className="flex flex-wrap gap-2.5 pt-1">
                                                {formData.companyData.industry_tag?.length > 0 ? (
                                                    formData.companyData.industry_tag.map((ind, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-2 rounded-xl font-bold text-[10px] shadow-sm">
                                                            {ind}
                                                        </Badge>
                                                    ))
                                                ) : <p className="text-sm font-bold text-slate-900 px-0.5 italic text-slate-300">Undetermined</p>}
                                            </div>
                                        </div>
                                        <DisplayField label="Scale Classification" value={formData.companyData.company_size_range} icon={Users} />
                                        <DisplayField label="Human Capital Count" value={formData.companyData.employeeCount} icon={Users} />
                                        <DisplayField label="Foundational Year" value={formData.companyData.founded_year || formData.companyData.foundedYear} icon={Calendar} />
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Organization Name</Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <Input 
                                                    value={formData.companyData.name} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, name: e.target.value}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Legal Name</Label>
                                            <div className="relative">
                                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <Input 
                                                    value={formData.companyData.legal_name} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, legal_name: e.target.value}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Display Name</Label>
                                            <div className="relative">
                                                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <Input 
                                                    value={formData.companyData.display_name} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, display_name: e.target.value}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Slug (URL Key)</Label>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <Input 
                                                    value={formData.companyData.slug} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, slug: e.target.value}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Headquarters Address</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <Input 
                                                    value={formData.companyData.headquarters_address} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, headquarters_address: e.target.value}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-50">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Strategic Industry Sectors (Select Multiple)</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 shadow-inner">
                                                {INDUSTRIES.map((ind) => {
                                                    const isSelected = formData.companyData.industry_tag?.includes(ind);
                                                    return (
                                                        <button
                                                            key={ind}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = formData.companyData.industry_tag || [];
                                                                const next = isSelected 
                                                                    ? current.filter(i => i !== ind)
                                                                    : [...current, ind];
                                                                setFormData({...formData, companyData: {...formData.companyData, industry_tag: next}});
                                                            }}
                                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold transition-all border
                                                                ${isSelected 
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10 scale-[1.02]' 
                                                                    : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200'}`}
                                                        >
                                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0
                                                                ${isSelected ? 'bg-white/20 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                                                                {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                                            </div>
                                                            <span className="truncate">{ind}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company Size Range</Label>
                                            <div className="relative">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <Input 
                                                    value={formData.companyData.company_size_range} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, company_size_range: e.target.value}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Founded Year</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <Input 
                                                    type="number"
                                                    value={formData.companyData.founded_year || formData.companyData.foundedYear} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, founded_year: e.target.value, foundedYear: e.target.value}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: DETAILED PROFILE ── */}
                <TabsContent value="profile" className="space-y-8 outline-none mt-4">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                    <FileText className="w-5 h-5" />
                                </div>
                                Brand Narrative
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="grid grid-cols-1 gap-10">
                                {!isEditing ? (
                                    <>
                                        <DisplayField label="Strategic Tagline" value={formData.companyData.tagline} icon={Sparkles} />
                                        <DisplayField label="Mission Objectives" value={formData.companyData.mission_statement} icon={Target} />
                                        <DisplayField label="Corporate Overview" value={formData.companyData.about_us || formData.companyData.description} icon={BookOpen} />
                                        <DisplayField label="Visual Identity URL" value={formData.companyData.video_intro_url} icon={Globe} />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-slate-50">
                                            <DisplayField label="LinkedIn Professional" value={formData.companyData.social_links?.linkedin} icon={Globe} />
                                            <DisplayField label="Twitter / X Network" value={formData.companyData.social_links?.twitter} icon={Globe} />
                                            <DisplayField label="Glassdoor Insights" value={formData.companyData.social_links?.glassdoor} icon={Globe} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Corporate Tagline</Label>
                                            <div className="relative">
                                                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <Input 
                                                    value={formData.companyData.tagline} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, tagline: e.target.value}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mission Statement</Label>
                                            <textarea 
                                                className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-medium transition-all"
                                                value={formData.companyData.mission_statement}
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, mission_statement: e.target.value}})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Corporate Overview (Detailed)</Label>
                                            <textarea 
                                                className="w-full min-h-[180px] p-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-medium transition-all"
                                                value={formData.companyData.about_us}
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, about_us: e.target.value, description: e.target.value}})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">LinkedIn URL</Label>
                                                <Input 
                                                    value={formData.companyData.social_links?.linkedin} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, social_links: {...formData.companyData.social_links, linkedin: e.target.value}}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Twitter URL</Label>
                                                <Input 
                                                    value={formData.companyData.social_links?.twitter} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, social_links: {...formData.companyData.social_links, twitter: e.target.value}}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Glassdoor URL</Label>
                                                <Input 
                                                    value={formData.companyData.social_links?.glassdoor} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, social_links: {...formData.companyData.social_links, glassdoor: e.target.value}}})}
                                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: CULTURE & PERKS ── */}
                <TabsContent value="culture" className="space-y-8 outline-none mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    Corporate Ethos & Values
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="space-y-6">
                                    {!isEditing ? (
                                        <div className="flex flex-wrap gap-3">
                                            {formData.companyData.work_model?.map((model, i) => (
                                                <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-2 rounded-xl font-bold text-[10px] shadow-sm">
                                                    {model}
                                                </Badge>
                                            ))}
                                            {(!formData.companyData.work_model || formData.companyData.work_model.length === 0) && <p className="text-sm font-bold text-slate-300 italic">No model defined</p>}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Operational Modality</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {['On-site', 'Remote', 'Hybrid'].map((option) => {
                                                    const isSelected = formData.companyData.work_model?.includes(option);
                                                    return (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = formData.companyData.work_model || [];
                                                                const next = isSelected 
                                                                    ? current.filter(m => m !== option)
                                                                    : [...current, option];
                                                                setFormData({...formData, companyData: {...formData.companyData, work_model: next}});
                                                            }}
                                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all border
                                                                ${isSelected 
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10' 
                                                                    : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200'}`}
                                                        >
                                                            {option}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Core Culture Values</Label>
                                        <div className="flex flex-wrap gap-3">
                                            {formData.companyData.culture_values?.map((val, i) => (
                                                <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-[10px] shadow-sm">
                                                    {val}
                                                    {isEditing && <X size={14} className="cursor-pointer text-slate-300 hover:text-rose-500 transition-colors" onClick={() => {
                                                        const newVals = [...formData.companyData.culture_values];
                                                        newVals.splice(i, 1);
                                                        setFormData({...formData, companyData: {...formData.companyData, culture_values: newVals}});
                                                    }} />}
                                                </Badge>
                                            ))}
                                            {isEditing && (
                                                <Button 
                                                    size="sm" variant="ghost" className="h-9 rounded-xl border border-dashed border-slate-200 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-widest transition-all"
                                                    onClick={() => openAddItemModal('culture')}
                                                >
                                                    <Plus className="w-3.5 h-3.5 mr-2" /> Add Value
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    Incentives & Provisions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { key: 'health_insurance', label: 'Premium Health Coverage', type: 'boolean', icon: ShieldCheck },
                                    { key: 'unlimited_pto', label: 'Autonomous PTO Policy', type: 'boolean', icon: Clock },
                                    { key: 'equity_package', label: 'Strategic Equity Program', type: 'boolean', icon: Target },
                                    { key: 'learning_stipend', label: 'Annual L&D Fund ($)', type: 'number', icon: BookOpen },
                                    { key: 'remote_stipend', label: 'Infrastructure Grant ($)', type: 'number', icon: Globe },
                                ].map(perk => (
                                    <div key={perk.key} className="flex flex-col gap-3 p-6 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:shadow-slate-200/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <perk.icon className="w-3.5 h-3.5 text-emerald-600/70" />
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{perk.label}</Label>
                                        </div>
                                        {!isEditing ? (
                                            <p className="text-sm font-bold text-slate-900">
                                                {perk.type === 'boolean' 
                                                    ? (formData.companyData.perks?.[perk.key] ? 'Active Provision' : 'Not Included')
                                                    : `$${formData.companyData.perks?.[perk.key] || 0} / Annual`}
                                            </p>
                                        ) : (
                                            perk.type === 'boolean' ? (
                                                <div className="flex items-center h-11">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 rounded-md border-slate-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        checked={formData.companyData.perks?.[perk.key] || false}
                                                        onChange={(e) => setFormData({
                                                            ...formData, 
                                                            companyData: {
                                                                ...formData.companyData, 
                                                                perks: {...formData.companyData.perks, [perk.key]: e.target.checked}
                                                            }
                                                        })}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                                    <Input 
                                                        type="number" 
                                                        className="h-11 rounded-xl bg-white border-slate-100 pl-8 focus:border-emerald-300 transition-all font-medium text-sm"
                                                        value={formData.companyData.perks?.[perk.key] || 0}
                                                        onChange={(e) => setFormData({
                                                            ...formData, 
                                                            companyData: {
                                                                ...formData.companyData, 
                                                                perks: {...formData.companyData.perks, [perk.key]: e.target.value}
                                                            }
                                                        })}
                                                    />
                                                </div>
                                            )
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── TAB: TECH & TEAM ── */}
                <TabsContent value="tech" className="space-y-8 outline-none mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <LayoutGrid className="w-5 h-5" />
                                    </div>
                                    Technological Ecosystem
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="flex flex-wrap gap-3">
                                    {formData.companyData.tech_stack?.map((tech, i) => (
                                        <Badge key={i} variant="secondary" className="bg-slate-900 text-white border-slate-900 px-4 py-2 rounded-xl flex items-center gap-3 font-bold text-[10px] shadow-md shadow-slate-900/10">
                                            {tech}
                                            {isEditing && <X size={14} className="cursor-pointer text-white/50 hover:text-white transition-colors" onClick={() => {
                                                const newStack = [...formData.companyData.tech_stack];
                                                newStack.splice(i, 1);
                                                setFormData({...formData, companyData: {...formData.companyData, tech_stack: newStack}});
                                            }} />}
                                        </Badge>
                                    ))}
                                    {isEditing && (
                                        <Button 
                                            size="sm" variant="ghost" className="h-9 rounded-xl border border-dashed border-slate-200 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-widest transition-all"
                                            onClick={() => openAddItemModal('tech')}
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-2" /> Add Tech Asset
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    Global Infrastructure
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="flex flex-wrap gap-3">
                                    {formData.companyData.office_locations?.map((loc, i) => (
                                        <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 px-4 py-2 rounded-xl flex items-center gap-3 font-bold text-[10px] shadow-sm">
                                            {loc}
                                            {isEditing && <X size={14} className="cursor-pointer text-slate-300 hover:text-rose-500 transition-colors" onClick={() => {
                                                const newLocs = [...formData.companyData.office_locations];
                                                newLocs.splice(i, 1);
                                                setFormData({...formData, companyData: {...formData.companyData, office_locations: newLocs}});
                                            }} />}
                                        </Badge>
                                    ))}
                                    {isEditing && (
                                        <Button 
                                            size="sm" variant="ghost" className="h-9 rounded-xl border border-dashed border-slate-200 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-widest transition-all"
                                            onClick={() => openAddItemModal('office')}
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-2" /> Add Office Hub
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── TAB: LEGAL & ADMIN ── */}
                <TabsContent value="legal" className="space-y-8 outline-none mt-4">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden max-w-4xl mx-auto">
                        <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                Governance & Compliance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                <div className="space-y-10">
                                    <DisplayField label="Verification Status" value={formData.companyData.is_verified ? 'Verified Entity' : 'Pending Verification'} icon={CheckCircle2} />
                                    <DisplayField label="Tax Identification (EIN)" value={formData.companyData.tax_id_ein} icon={FileText} />
                                    <DisplayField label="Primary Admin Point" value={formData.companyData.admin_email} icon={Mail} />
                                </div>
                                <div className="space-y-10">
                                    <DisplayField label="Subscription Framework" value={formData.companyData.subscription_tier} icon={Award} />
                                    <DisplayField label="Account Lifecycle Status" value={formData.companyData.account_status} icon={ShieldCheck} />
                                </div>

                                {isEditing && (
                                    <div className="md:col-span-2 p-8 rounded-[24px] bg-emerald-50/30 border border-emerald-100/50 space-y-6 mt-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-emerald-600" />
                                            <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-[0.1em]">Administrative Control Interface</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tax ID / EIN</Label>
                                                <Input 
                                                    value={formData.companyData.tax_id_ein} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, tax_id_ein: e.target.value}})}
                                                    className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Administrative Email</Label>
                                                <Input 
                                                    value={formData.companyData.admin_email} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, admin_email: e.target.value}})}
                                                    className="h-11 rounded-xl bg-white border-slate-200 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: BRANDING & MULTIMEDIA ── */}
                <TabsContent value="branding" className="space-y-8 outline-none mt-4">
                    <div className="grid grid-cols-1 gap-8">
                        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    Company Gallery & Media
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gallery Images (URLs)</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {(formData.companyData.gallery_images || []).map((img, idx) => (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-100 bg-slate-50">
                                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                                {isEditing && (
                                                    <button 
                                                        onClick={() => {
                                                            const next = [...formData.companyData.gallery_images];
                                                            next.splice(idx, 1);
                                                            setFormData({...formData, companyData: {...formData.companyData, gallery_images: next}});
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {isEditing && (
                                            <button 
                                                onClick={() => {
                                                    const url = prompt('Enter Image URL');
                                                    if (url) {
                                                        setFormData({
                                                            ...formData, 
                                                            companyData: {
                                                                ...formData.companyData, 
                                                                gallery_images: [...(formData.companyData.gallery_images || []), url]
                                                            }
                                                        });
                                                    }
                                                }}
                                                className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-slate-400 hover:text-emerald-600"
                                            >
                                                <Plus size={24} className="mb-2" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Add Image</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company Video (YouTube/Vimeo URL)</Label>
                                    {!isEditing ? (
                                        <DisplayField label="Video URL" value={formData.companyData.video_intro_url} icon={Globe} />
                                    ) : (
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <Input 
                                                value={formData.companyData.video_intro_url} 
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, video_intro_url: e.target.value}})}
                                                className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 focus:border-emerald-300 transition-all font-medium text-sm" 
                                                placeholder="https://youtube.com/watch?v=..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50 bg-white/50">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    Norms & Conditions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-4">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company Policies & Norms</Label>
                                    {!isEditing ? (
                                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 min-h-[150px] whitespace-pre-wrap text-sm text-slate-600 font-medium">
                                            {formData.companyData.norms_conditions || 'No norms specified.'}
                                        </div>
                                    ) : (
                                        <textarea 
                                            className="w-full min-h-[200px] p-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-medium transition-all"
                                            value={formData.companyData.norms_conditions}
                                            onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, norms_conditions: e.target.value}})}
                                            placeholder="Specify your company norms, work culture rules, or conditions..."
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Add Item Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
                    <div className="h-2 w-full bg-emerald-600" />
                    <div className="p-10 space-y-8">
                        <DialogHeader className="space-y-4">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 mx-auto lg:mx-0">
                                <Plus className="text-emerald-600 w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                                    {modalConfig.title}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-400 font-medium">
                                    {modalConfig.description}
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asset Value</Label>
                                <Input 
                                    autoFocus
                                    placeholder={modalConfig.placeholder}
                                    value={modalConfig.value}
                                    onChange={(e) => setModalConfig({ ...modalConfig, value: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleModalConfirm()}
                                    className="h-12 rounded-xl bg-slate-50 border-slate-100 px-5 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-base"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-4">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-400 hover:bg-slate-50">
                                Discard
                            </Button>
                            <Button onClick={handleModalConfirm} className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95">
                                Finalize Entry
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RecruiterSettings;
