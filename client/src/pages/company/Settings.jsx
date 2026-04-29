import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  User, Mail, Phone, MapPin, Briefcase, Building2, 
  Plus, X, Upload, FileText, CheckCircle2, Loader2, Sparkles,
  Save, Trash2, LayoutGrid, Clock, Target, Globe, Factory,
  GraduationCap, Award, BookOpen, ShieldCheck, Calendar, Users
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
            account_status: user?.company?.account_status || 'Pending'
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
                        account_status: data.company?.account_status || 'Pending'
                    }
                });
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch profile details");
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
            toast.success("Recruiter profile updated successfully!");
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // In a real app, we might want to revert formData to original state instead of reload
        // But for now, keeping it simple as requested or as per existing logic
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
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3 text-emerald-600/70" />}
                {label}
            </p>
            <p className="text-sm font-semibold text-foreground px-0.5">{value || '—'}</p>
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
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {user?.role === 'company' ? 'Company' : 'Recruiter'} <span className="text-emerald-600">Settings</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your professional profile and organization identity</p>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <Button 
                                variant="outline" 
                                onClick={handleCancel}
                                className="rounded-lg font-semibold px-6 border-border hover:bg-muted"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSave}
                                disabled={loading}
                                className="rounded-lg font-semibold px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button 
                            onClick={() => setIsEditing(true)}
                            className="rounded-lg font-semibold px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                        >
                            Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-8 mb-8 overflow-x-auto whitespace-nowrap">
                    <TabsTrigger value="personal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-4 font-semibold text-sm transition-all">
                        Personal
                    </TabsTrigger>
                    <TabsTrigger value="company" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-4 font-semibold text-sm transition-all">
                        Organization
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-4 font-semibold text-sm transition-all">
                        Detailed Profile
                    </TabsTrigger>
                    <TabsTrigger value="culture" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-4 font-semibold text-sm transition-all">
                        Culture & Perks
                    </TabsTrigger>
                    <TabsTrigger value="tech" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-4 font-semibold text-sm transition-all">
                        Tech & Team
                    </TabsTrigger>
                    <TabsTrigger value="legal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-4 font-semibold text-sm transition-all">
                        Legal & Admin
                    </TabsTrigger>
                    {user?.role !== 'company' && (
                        <>
                            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-4 font-semibold text-sm transition-all">
                                Experience
                            </TabsTrigger>
                            <TabsTrigger value="academic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-4 font-semibold text-sm transition-all">
                                Credentials
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                {/* ── TAB: PERSONAL PROFILE ── */}
                <TabsContent value="personal" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 rounded-xl border-border shadow-none bg-white">
                            <CardHeader className="p-6 border-b border-border/50">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <User className="text-emerald-600 w-5 h-5" /> Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
                                                <Label className="text-xs font-semibold text-muted-foreground">Full Name</Label>
                                                <Input 
                                                    value={formData.name} 
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                    className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">Phone Number</Label>
                                                <Input 
                                                    value={formData.recruiterProfile.phone}
                                                    onChange={(e) => setFormData({
                                                        ...formData, 
                                                        recruiterProfile: {...formData.recruiterProfile, phone: e.target.value}
                                                    })}
                                                    className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">Job Title</Label>
                                                <Input 
                                                    value={formData.recruiterProfile.jobTitle} 
                                                    onChange={(e) => setFormData({
                                                        ...formData, 
                                                        recruiterProfile: {...formData.recruiterProfile, jobTitle: e.target.value}
                                                    })}
                                                    className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">Location</Label>
                                                <Input 
                                                    value={formData.recruiterProfile.location} 
                                                    onChange={(e) => setFormData({
                                                        ...formData, 
                                                        recruiterProfile: {...formData.recruiterProfile, location: e.target.value}
                                                    })}
                                                    className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                                />
                                            </div>
                                            {user?.role !== 'company' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Current Exp (Years)</Label>
                                                        <Input 
                                                            type="number"
                                                            value={formData.recruiterProfile.currentExp} 
                                                            onChange={(e) => setFormData({
                                                                ...formData, 
                                                                recruiterProfile: {...formData.recruiterProfile, currentExp: e.target.value}
                                                            })}
                                                            className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Previous Exp (Years)</Label>
                                                        <Input 
                                                            type="number"
                                                            value={formData.recruiterProfile.previousExp} 
                                                            onChange={(e) => setFormData({
                                                                ...formData, 
                                                                recruiterProfile: {...formData.recruiterProfile, previousExp: e.target.value}
                                                            })}
                                                            className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Bio</Label>
                                                        <textarea 
                                                            className="w-full min-h-[100px] p-3 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-emerald-600 text-sm"
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

                        <Card className="rounded-xl border-border shadow-none bg-white">
                            <CardHeader className="p-6 border-b border-border/50">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Target className="text-emerald-600 w-5 h-5" /> Expertise
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {isEditing && (
                                    <div className="flex gap-2">
                                        <Input 
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                            placeholder="Add skill..." 
                                            className="h-10 rounded-lg border-border" 
                                        />
                                        <Button onClick={addSkill} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-10">Add</Button>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {formData.recruiterProfile.skills.length > 0 ? (
                                        formData.recruiterProfile.skills.map((skill) => (
                                            <Badge key={skill} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 py-1.5 px-3 rounded-md flex items-center gap-2 font-semibold">
                                                {skill}
                                                {isEditing && <X size={14} className="cursor-pointer" onClick={() => removeSkill(skill)} />}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No skills listed</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── TAB: PROFESSIONAL HISTORY ── */}
                <TabsContent value="history" className="space-y-6 outline-none">
                    <Card className="rounded-xl border-border shadow-none bg-white">
                        <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Briefcase className="text-emerald-600 w-5 h-5" /> Work History
                            </CardTitle>
                            {isEditing && (
                                <Button onClick={addExperience} variant="outline" size="sm" className="rounded-lg border-emerald-600/20 text-emerald-700 hover:bg-emerald-50">
                                    <Plus className="w-4 h-4 mr-1" /> Add Company
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {formData.recruiterProfile.experience.map((item, idx) => (
                                <div key={idx} className="relative p-6 rounded-xl border border-border/60 bg-muted/5 group">
                                    {isEditing && (
                                        <Button 
                                            onClick={() => {
                                                const newExp = [...formData.recruiterProfile.experience];
                                                newExp.splice(idx, 1);
                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                            }}
                                            variant="ghost" size="icon" className="absolute top-4 right-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8"
                                        >
                                            <X size={16} />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {!isEditing ? (
                                            <>
                                                <div className="space-y-4">
                                                    <DisplayField label="Company" value={item.company} />
                                                    <DisplayField label="Role" value={item.role} />
                                                    <DisplayField label="Duration" value={item.duration} />
                                                </div>
                                                <DisplayField label="Description" value={item.description} />
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Company</Label>
                                                        <Input 
                                                            value={item.company}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.recruiterProfile.experience];
                                                                newExp[idx].company = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                            }}
                                                            className="h-10 rounded-lg" 
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Role</Label>
                                                        <Input 
                                                            value={item.role}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.recruiterProfile.experience];
                                                                newExp[idx].role = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                            }}
                                                            className="h-10 rounded-lg" 
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Duration</Label>
                                                        <Input 
                                                            value={item.duration}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.recruiterProfile.experience];
                                                                newExp[idx].duration = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                            }}
                                                            className="h-10 rounded-lg" 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold text-muted-foreground">Description</Label>
                                                    <textarea 
                                                        className="w-full h-full min-h-[120px] p-3 rounded-lg border border-border focus:ring-1 focus:ring-emerald-600 text-sm"
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
                                <div className="text-center py-12 text-muted-foreground text-sm italic border border-dashed border-border rounded-xl">
                                    No professional history documented yet.
                                </div >
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: CREDENTIALS ── */}
                <TabsContent value="academic" className="space-y-8 outline-none">
                    <div className="grid grid-cols-1 gap-8">
                        {/* Education */}
                        <Card className="rounded-xl border-border shadow-none bg-white">
                            <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <GraduationCap className="text-emerald-600 w-5 h-5" /> Education
                                </CardTitle>
                                {isEditing && (
                                    <Button onClick={addQualification} variant="outline" size="sm" className="rounded-lg border-emerald-600/20 text-emerald-700 hover:bg-emerald-50">
                                        <Plus className="w-4 h-4 mr-1" /> Add Education
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {formData.recruiterProfile.qualification.map((item, idx) => (
                                    <div key={idx} className="relative p-5 rounded-xl border border-border/60 bg-muted/5 group">
                                        {isEditing && (
                                            <Button 
                                                onClick={() => {
                                                    const newQual = [...formData.recruiterProfile.qualification];
                                                    newQual.splice(idx, 1);
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                }}
                                                variant="ghost" size="icon" className="absolute top-3 right-3 text-muted-foreground hover:text-destructive h-8 w-8"
                                            >
                                                <X size={16} />
                                            </Button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {!isEditing ? (
                                                <>
                                                    <DisplayField label="Degree" value={item.degree} />
                                                    <DisplayField label="Institution" value={item.institution} />
                                                    <DisplayField label="Year" value={item.year} />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Degree</Label>
                                                        <Input 
                                                            value={item.degree}
                                                            onChange={(e) => {
                                                                const newQual = [...formData.recruiterProfile.qualification];
                                                                newQual[idx].degree = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                            }}
                                                            className="h-10 rounded-lg" 
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Institution</Label>
                                                        <Input 
                                                            value={item.institution}
                                                            onChange={(e) => {
                                                                const newQual = [...formData.recruiterProfile.qualification];
                                                                newQual[idx].institution = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                            }}
                                                            className="h-10 rounded-lg" 
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Year</Label>
                                                        <Input 
                                                            value={item.year}
                                                            onChange={(e) => {
                                                                const newQual = [...formData.recruiterProfile.qualification];
                                                                newQual[idx].year = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                            }}
                                                            className="h-10 rounded-lg" 
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
                        <Card className="rounded-xl border-border shadow-none bg-white">
                            <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Award className="text-emerald-600 w-5 h-5" /> Certifications
                                </CardTitle>
                                {isEditing && (
                                    <Button onClick={addCertification} variant="outline" size="sm" className="rounded-lg border-emerald-600/20 text-emerald-700 hover:bg-emerald-50">
                                        <Plus className="w-4 h-4 mr-1" /> Add Certification
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {formData.recruiterProfile.certifications.map((item, idx) => (
                                    <div key={idx} className="relative p-5 rounded-xl border border-border/60 bg-muted/5 group">
                                        {isEditing && (
                                            <Button 
                                                onClick={() => {
                                                    const newCert = [...formData.recruiterProfile.certifications];
                                                    newCert.splice(idx, 1);
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                }}
                                                variant="ghost" size="icon" className="absolute top-3 right-3 text-muted-foreground hover:text-destructive h-8 w-8"
                                            >
                                                <X size={16} />
                                            </Button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {!isEditing ? (
                                                <>
                                                    <DisplayField label="Certification" value={item.name} />
                                                    <DisplayField label="Organization" value={item.organization} />
                                                    <DisplayField label="Year" value={item.year} />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Certification Name</Label>
                                                        <Input 
                                                            value={item.name}
                                                            onChange={(e) => {
                                                                const newCert = [...formData.recruiterProfile.certifications];
                                                                newCert[idx].name = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                            }}
                                                            className="h-10 rounded-lg" 
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Issuing Org</Label>
                                                        <Input 
                                                            value={item.organization}
                                                            onChange={(e) => {
                                                                const newCert = [...formData.recruiterProfile.certifications];
                                                                newCert[idx].organization = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                            }}
                                                            className="h-10 rounded-lg" 
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-muted-foreground">Year</Label>
                                                        <Input 
                                                            value={item.year}
                                                            onChange={(e) => {
                                                                const newCert = [...formData.recruiterProfile.certifications];
                                                                newCert[idx].year = e.target.value;
                                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                            }}
                                                            className="h-10 rounded-lg" 
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
                <TabsContent value="company" className="space-y-6 outline-none">
                    <Card className="rounded-xl border-border shadow-none bg-white">
                        <CardHeader className="p-6 border-b border-border/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Building2 className="text-emerald-600 w-5 h-5" /> Basic Company Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {!isEditing ? (
                                    <>
                                        <DisplayField label="Organization Name" value={formData.companyData.name} icon={Building2} />
                                        <DisplayField label="Legal Name" value={formData.companyData.legal_name} icon={ShieldCheck} />
                                        <DisplayField label="Display Name" value={formData.companyData.display_name} icon={Sparkles} />
                                        <DisplayField label="Slug / URL Key" value={formData.companyData.slug} icon={Globe} />
                                        <DisplayField label="Website" value={formData.companyData.website} icon={Globe} />
                                        <DisplayField label="Official URL" value={formData.companyData.website_url} icon={Globe} />
                                        <DisplayField label="Headquarters" value={formData.companyData.headquarters_address} icon={MapPin} />
                                        <div className="md:col-span-2 space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Factory className="w-3 h-3 text-emerald-600/70" />
                                                Industry Sectors
                                            </p>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {formData.companyData.industry_tag?.length > 0 ? (
                                                    formData.companyData.industry_tag.map((ind, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1.5 rounded-lg font-bold text-[10px]">
                                                            {ind}
                                                        </Badge>
                                                    ))
                                                ) : <p className="text-sm font-semibold text-foreground px-0.5">—</p>}
                                            </div>
                                        </div>
                                        <DisplayField label="Size Range" value={formData.companyData.company_size_range} icon={Users} />
                                        <DisplayField label="Employee Count" value={formData.companyData.employeeCount} icon={Users} />
                                        <DisplayField label="Founded Year" value={formData.companyData.founded_year || formData.companyData.foundedYear} icon={Calendar} />
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Organization Name</Label>
                                            <Input 
                                                value={formData.companyData.name} 
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, name: e.target.value}})}
                                                className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Legal Name</Label>
                                            <Input 
                                                value={formData.companyData.legal_name} 
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, legal_name: e.target.value}})}
                                                className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Display Name</Label>
                                            <Input 
                                                value={formData.companyData.display_name} 
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, display_name: e.target.value}})}
                                                className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Slug (URL Key)</Label>
                                            <Input 
                                                value={formData.companyData.slug} 
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, slug: e.target.value}})}
                                                className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Headquarters Address</Label>
                                            <Input 
                                                value={formData.companyData.headquarters_address} 
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, headquarters_address: e.target.value}})}
                                                className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-3 pt-2 border-t border-slate-100">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Select Industry Sectors (Multiple)</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
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
                                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border-2
                                                                ${isSelected 
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10' 
                                                                    : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-200'}`}
                                                        >
                                                            <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0
                                                                ${isSelected ? 'bg-white border-white' : 'bg-slate-50 border-slate-200'}`}>
                                                                {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                                                            </div>
                                                            <span className="truncate">{ind}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Company Size Range</Label>
                                            <Input 
                                                value={formData.companyData.company_size_range} 
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, company_size_range: e.target.value}})}
                                                className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Founded Year</Label>
                                            <Input 
                                                type="number"
                                                value={formData.companyData.founded_year || formData.companyData.foundedYear} 
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, founded_year: e.target.value, foundedYear: e.target.value}})}
                                                className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: DETAILED PROFILE ── */}
                <TabsContent value="profile" className="space-y-6 outline-none">
                    <Card className="rounded-xl border-border shadow-none bg-white">
                        <CardHeader className="p-6 border-b border-border/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <FileText className="text-emerald-600 w-5 h-5" /> Brand Presence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="grid grid-cols-1 gap-6">
                                {!isEditing ? (
                                    <>
                                        <DisplayField label="Company Tagline" value={formData.companyData.tagline} icon={Sparkles} />
                                        <DisplayField label="Mission Statement" value={formData.companyData.mission_statement} icon={Target} />
                                        <DisplayField label="About Company" value={formData.companyData.about_us || formData.companyData.description} icon={BookOpen} />
                                        <DisplayField label="Video Intro URL" value={formData.companyData.video_intro_url} icon={Globe} />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <DisplayField label="LinkedIn" value={formData.companyData.social_links?.linkedin} icon={Globe} />
                                            <DisplayField label="Twitter" value={formData.companyData.social_links?.twitter} icon={Globe} />
                                            <DisplayField label="Glassdoor" value={formData.companyData.social_links?.glassdoor} icon={Globe} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Tagline</Label>
                                            <Input 
                                                value={formData.companyData.tagline} 
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, tagline: e.target.value}})}
                                                className="h-10 rounded-lg border-border focus-visible:ring-emerald-600" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Mission Statement</Label>
                                            <textarea 
                                                className="w-full min-h-[80px] p-3 rounded-lg border border-border focus:ring-1 focus:ring-emerald-600 text-sm"
                                                value={formData.companyData.mission_statement}
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, mission_statement: e.target.value}})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">About Us (History & Goals)</Label>
                                            <textarea 
                                                className="w-full min-h-[150px] p-3 rounded-lg border border-border focus:ring-1 focus:ring-emerald-600 text-sm"
                                                value={formData.companyData.about_us}
                                                onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, about_us: e.target.value, description: e.target.value}})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">LinkedIn URL</Label>
                                                <Input 
                                                    value={formData.companyData.social_links?.linkedin} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, social_links: {...formData.companyData.social_links, linkedin: e.target.value}}})}
                                                    className="h-10 rounded-lg border-border" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">Twitter URL</Label>
                                                <Input 
                                                    value={formData.companyData.social_links?.twitter} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, social_links: {...formData.companyData.social_links, twitter: e.target.value}}})}
                                                    className="h-10 rounded-lg border-border" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">Glassdoor URL</Label>
                                                <Input 
                                                    value={formData.companyData.social_links?.glassdoor} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, social_links: {...formData.companyData.social_links, glassdoor: e.target.value}}})}
                                                    className="h-10 rounded-lg border-border" 
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
                <TabsContent value="culture" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="rounded-xl border-border shadow-none bg-white">
                            <CardHeader className="p-6 border-b border-border/50">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Sparkles className="text-emerald-600 w-5 h-5" /> Work Culture & Values
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    {!isEditing ? (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.companyData.work_model?.map((model, i) => (
                                                <Badge key={i} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1.5 rounded-lg font-semibold">
                                                    {model}
                                                </Badge>
                                            ))}
                                            {(!formData.companyData.work_model || formData.companyData.work_model.length === 0) && <p className="text-sm text-muted-foreground">—</p>}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Select Work Models</Label>
                                            <div className="flex flex-wrap gap-2">
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
                                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2
                                                                ${isSelected 
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' 
                                                                    : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-200'}`}
                                                        >
                                                            {option}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Culture Values</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.companyData.culture_values?.map((val, i) => (
                                                <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-2 font-semibold">
                                                    {val}
                                                    {isEditing && <X size={14} className="cursor-pointer" onClick={() => {
                                                        const newVals = [...formData.companyData.culture_values];
                                                        newVals.splice(i, 1);
                                                        setFormData({...formData, companyData: {...formData.companyData, culture_values: newVals}});
                                                    }} />}
                                                </Badge>
                                            ))}
                                            {isEditing && (
                                                <Button 
                                                    size="sm" variant="outline" className="h-8 rounded-lg border-dashed"
                                                    onClick={() => openAddItemModal('culture')}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Add Value
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-xl border-border shadow-none bg-white">
                            <CardHeader className="p-6 border-b border-border/50">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Award className="text-emerald-600 w-5 h-5" /> Benefits & Perks
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { key: 'health_insurance', label: 'Health Insurance', type: 'boolean' },
                                    { key: 'unlimited_pto', label: 'Unlimited PTO', type: 'boolean' },
                                    { key: 'equity_package', label: 'Equity Package', type: 'boolean' },
                                    { key: 'learning_stipend', label: 'Learning Stipend ($)', type: 'number' },
                                    { key: 'remote_stipend', label: 'Remote Stipend ($)', type: 'number' },
                                ].map(perk => (
                                    <div key={perk.key} className="flex flex-col gap-2 p-4 rounded-xl bg-muted/5 border border-border/40">
                                        <Label className="text-xs font-semibold text-muted-foreground">{perk.label}</Label>
                                        {!isEditing ? (
                                            <p className="text-sm font-bold text-foreground">
                                                {perk.type === 'boolean' 
                                                    ? (formData.companyData.perks?.[perk.key] ? 'Yes' : 'No')
                                                    : `$${formData.companyData.perks?.[perk.key] || 0}`}
                                            </p>
                                        ) : (
                                            perk.type === 'boolean' ? (
                                                <input 
                                                    type="checkbox" 
                                                    className="w-5 h-5 accent-emerald-600"
                                                    checked={formData.companyData.perks?.[perk.key] || false}
                                                    onChange={(e) => setFormData({
                                                        ...formData, 
                                                        companyData: {
                                                            ...formData.companyData, 
                                                            perks: {...formData.companyData.perks, [perk.key]: e.target.checked}
                                                        }
                                                    })}
                                                />
                                            ) : (
                                                <Input 
                                                    type="number" 
                                                    className="h-9 rounded-lg"
                                                    value={formData.companyData.perks?.[perk.key] || 0}
                                                    onChange={(e) => setFormData({
                                                        ...formData, 
                                                        companyData: {
                                                            ...formData.companyData, 
                                                            perks: {...formData.companyData.perks, [perk.key]: e.target.value}
                                                        }
                                                    })}
                                                />
                                            )
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── TAB: TECH & TEAM ── */}
                <TabsContent value="tech" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="rounded-xl border-border shadow-none bg-white">
                            <CardHeader className="p-6 border-b border-border/50">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <LayoutGrid className="text-emerald-600 w-5 h-5" /> Tech Stack
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {formData.companyData.tech_stack?.map((tech, i) => (
                                        <Badge key={i} variant="outline" className="bg-slate-900 text-white border-slate-900 px-3 py-1.5 rounded-lg flex items-center gap-2 font-semibold">
                                            {tech}
                                            {isEditing && <X size={14} className="cursor-pointer" onClick={() => {
                                                const newStack = [...formData.companyData.tech_stack];
                                                newStack.splice(i, 1);
                                                setFormData({...formData, companyData: {...formData.companyData, tech_stack: newStack}});
                                            }} />}
                                        </Badge>
                                    ))}
                                    {isEditing && (
                                        <Button 
                                            size="sm" variant="outline" className="h-8 rounded-lg border-dashed"
                                            onClick={() => openAddItemModal('tech')}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Tech
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-xl border-border shadow-none bg-white">
                            <CardHeader className="p-6 border-b border-border/50">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <MapPin className="text-emerald-600 w-5 h-5" /> Office Locations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {formData.companyData.office_locations?.map((loc, i) => (
                                        <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 font-semibold">
                                            {loc}
                                            {isEditing && <X size={14} className="cursor-pointer" onClick={() => {
                                                const newLocs = [...formData.companyData.office_locations];
                                                newLocs.splice(i, 1);
                                                setFormData({...formData, companyData: {...formData.companyData, office_locations: newLocs}});
                                            }} />}
                                        </Badge>
                                    ))}
                                    {isEditing && (
                                        <Button 
                                            size="sm" variant="outline" className="h-8 rounded-lg border-dashed"
                                            onClick={() => openAddItemModal('office')}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Office
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── TAB: LEGAL & ADMIN ── */}
                <TabsContent value="legal" className="space-y-6 outline-none">
                    <Card className="rounded-xl border-border shadow-none bg-white max-w-2xl mx-auto">
                        <CardHeader className="p-6 border-b border-border/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <ShieldCheck className="text-emerald-600 w-5 h-5" /> Verification & Administration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <DisplayField label="Verification Status" value={formData.companyData.is_verified ? 'Verified' : 'Unverified'} icon={CheckCircle2} />
                                    <DisplayField label="Tax ID / EIN" value={formData.companyData.tax_id_ein} icon={FileText} />
                                    <DisplayField label="Admin Contact" value={formData.companyData.admin_email} icon={Mail} />
                                </div>
                                <div className="space-y-6">
                                    <DisplayField label="Subscription Tier" value={formData.companyData.subscription_tier} icon={Award} />
                                    <DisplayField label="Account Status" value={formData.companyData.account_status} icon={ShieldCheck} />
                                </div>

                                {isEditing && (
                                    <div className="md:col-span-2 p-6 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-4">
                                        <p className="text-sm font-semibold text-emerald-800">Admin Only Fields</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">Tax ID / EIN</Label>
                                                <Input 
                                                    value={formData.companyData.tax_id_ein} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, tax_id_ein: e.target.value}})}
                                                    className="h-10 rounded-lg bg-white" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">Admin Email</Label>
                                                <Input 
                                                    value={formData.companyData.admin_email} 
                                                    onChange={(e) => setFormData({...formData, companyData: {...formData.companyData, admin_email: e.target.value}})}
                                                    className="h-10 rounded-lg bg-white" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add Item Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <DialogHeader className="space-y-3">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-2">
                            <Plus className="text-emerald-600 w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                            {modalConfig.title}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium leading-relaxed">
                            {modalConfig.description}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            autoFocus
                            placeholder={modalConfig.placeholder}
                            value={modalConfig.value}
                            onChange={(e) => setModalConfig({ ...modalConfig, value: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleModalConfirm()}
                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-emerald-600 font-medium"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-12 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleModalConfirm}
                            disabled={!modalConfig.value.trim()}
                            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
                        >
                            Add to List
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RecruiterSettings;
