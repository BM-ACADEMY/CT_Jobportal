import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  User, Mail, Phone, MapPin, Briefcase, Building2, 
  Plus, X, Upload, FileText, CheckCircle2, Loader2, Sparkles,
  Save, Trash2, LayoutGrid, Clock, Target, Globe, Factory,
  GraduationCap, Award, BookOpen
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const API_RECRUITER_URL = `${import.meta.env.VITE_API_BASE_URL}/recruiter`;

const RecruiterSettings = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newSkill, setNewSkill] = useState('');

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
            website: user?.company?.website || '',
            location: user?.company?.location || '',
            industry: user?.company?.industry || '',
            description: user?.company?.description || '',
            employeeCount: user?.company?.employeeCount || '',
            foundedYear: user?.company?.foundedYear || ''
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${API_RECRUITER_URL}/profile`);
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
                        website: data.company?.website || '',
                        location: data.company?.location || '',
                        industry: data.company?.industry || '',
                        description: data.company?.description || '',
                        employeeCount: data.company?.employeeCount || '',
                        foundedYear: data.company?.foundedYear || ''
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
            const res = await axios.put(`${API_RECRUITER_URL}/profile`, formData);
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
        // Reset to user data
        window.location.reload(); // Simple way to reset state from server
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
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        Recruiter Settings <Sparkles className="text-emerald-600 w-8 h-8" />
                    </h1>
                    <p className="text-muted-foreground font-bold mt-2">Manage your professional profile and organization identity</p>
                </div>
                <div className="flex gap-4">
                    {isEditing ? (
                        <Button 
                            variant="outline" 
                            onClick={handleCancel}
                            className="rounded-xl font-black text-xs uppercase tracking-widest px-6 h-12 border-border"
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => setIsEditing(true)}
                            className="rounded-xl font-black text-xs uppercase tracking-widest px-8 h-12 bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
                        >
                            <Save className="w-4 h-4 mr-2" /> Edit Settings
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="bg-muted/30 p-1.5 rounded-2xl h-auto flex-wrap justify-start gap-1">
                    <TabsTrigger value="personal" className="rounded-xl px-6 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">
                        <User className="w-4 h-4 mr-2 text-emerald-600" /> Personal Profile
                    </TabsTrigger>
                    <TabsTrigger value="company" className="rounded-xl px-6 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">
                        <Building2 className="w-4 h-4 mr-2 text-emerald-600" /> Organization Details
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-6 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">
                        <Briefcase className="w-4 h-4 mr-2 text-emerald-600" /> Professional History
                    </TabsTrigger>
                    <TabsTrigger value="academic" className="rounded-xl px-6 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">
                        <GraduationCap className="w-4 h-4 mr-2 text-emerald-600" /> Academic & Credentials
                    </TabsTrigger>
                </TabsList>

                {/* ── TAB: PERSONAL PROFILE ── */}
                <TabsContent value="personal" className="mt-8 space-y-8">
                    <Card className="rounded-[32px] border-border shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-4 border-b border-border bg-emerald-50/10">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <LayoutGrid className="text-emerald-600 w-5 h-5" /> Work Experience & Role
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input 
                                            value={formData.name} 
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className={`pl-11 h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Direct Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input 
                                            placeholder="+91 999 000 1122" 
                                            value={formData.recruiterProfile.phone}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                recruiterProfile: {...formData.recruiterProfile, phone: e.target.value}
                                            })}
                                            className={`pl-11 h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Current Position</Label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input 
                                            placeholder="e.g. Talent Acquisition Manager"
                                            value={formData.recruiterProfile.jobTitle} 
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                recruiterProfile: {...formData.recruiterProfile, jobTitle: e.target.value}
                                            })}
                                            className={`pl-11 h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Recruiter Location</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input 
                                            placeholder="e.g. Bangalore, KA"
                                            value={formData.recruiterProfile.location} 
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                recruiterProfile: {...formData.recruiterProfile, location: e.target.value}
                                            })}
                                            className={`pl-11 h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Years in Current Company</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input 
                                            type="number"
                                            value={formData.recruiterProfile.currentExp} 
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                recruiterProfile: {...formData.recruiterProfile, currentExp: e.target.value}
                                            })}
                                            className={`pl-11 h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Previous Experience (Years)</Label>
                                    <div className="relative">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input 
                                            type="number"
                                            value={formData.recruiterProfile.previousExp} 
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                recruiterProfile: {...formData.recruiterProfile, previousExp: e.target.value}
                                            })}
                                            className={`pl-11 h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Total Experience (Auto-calculated)</Label>
                                    <div className="relative">
                                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
                                        <Input 
                                            value={`${formData.recruiterProfile.totalExp} Years`} 
                                            disabled={true}
                                            className="pl-11 h-12 rounded-xl bg-emerald-500/5 border-emerald-500/10 font-black text-emerald-700" 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Professional Bio</Label>
                                <textarea 
                                    className={`w-full min-h-[120px] p-4 rounded-xl bg-muted/20 border border-border font-bold transition-all focus:outline-none focus:ring-1 focus:ring-emerald-600 text-sm ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`}
                                    placeholder="Tell candidates about yourself..."
                                    value={formData.recruiterProfile.bio}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        recruiterProfile: {...formData.recruiterProfile, bio: e.target.value}
                                    })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[32px] border-border shadow-sm">
                        <CardHeader className="p-8 pb-4 border-b border-border bg-emerald-50/10">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <Target className="text-emerald-600 w-5 h-5" /> Recruitment Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {isEditing && (
                                <div className="flex gap-4">
                                    <Input 
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                        placeholder="Add skill (e.g. Technical Sourcing, Headhunting)" 
                                        className="flex-1 h-12 rounded-xl bg-muted/20 border-border font-bold" 
                                    />
                                    <Button onClick={addSkill} className="rounded-xl px-8 h-12 font-black bg-emerald-600">Add</Button>
                                </div>
                            )}
                             <div className="flex flex-wrap gap-3">
                                {formData.recruiterProfile.skills.map((skill) => (
                                    <Badge key={skill} className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 py-2.5 px-5 rounded-xl flex items-center gap-2 font-black transition-all">
                                        {skill}
                                        {isEditing && <X size={14} className="cursor-pointer" onClick={() => removeSkill(skill)} />}
                                    </Badge>
                                ))}
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: PROFESSIONAL HISTORY ── */}
                <TabsContent value="history" className="mt-8 space-y-8">
                    <Card className="rounded-[32px] border-border shadow-sm">
                        <CardHeader className="p-8 pb-4 border-b border-border bg-emerald-50/10 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <Briefcase className="text-emerald-600 w-5 h-5" /> Work Experience History
                            </CardTitle>
                            {isEditing && (
                                <Button onClick={addExperience} variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-emerald-600/20 hover:bg-emerald-50 text-emerald-700">
                                    <Plus className="w-4 h-4 mr-2" /> Add Previous Company
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {formData.recruiterProfile.experience.map((item, idx) => (
                                <div key={idx} className="relative p-8 rounded-[28px] border border-border bg-muted/10 group animate-in slide-in-from-right-4 duration-300">
                                    {isEditing && (
                                        <Button 
                                            onClick={() => {
                                                const newExp = [...formData.recruiterProfile.experience];
                                                newExp.splice(idx, 1);
                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                            }}
                                            variant="ghost" size="icon" className="absolute top-6 right-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                        >
                                            <X size={18} />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Company Name</Label>
                                                <Input 
                                                    value={item.company}
                                                    disabled={!isEditing}
                                                    onChange={(e) => {
                                                        const newExp = [...formData.recruiterProfile.experience];
                                                        newExp[idx].company = e.target.value;
                                                        setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                    }}
                                                    placeholder="e.g. Google India" className={`h-12 rounded-xl bg-background font-bold border-border ${!isEditing && 'border-transparent bg-transparent pl-0 opacity-80'}`} 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Role</Label>
                                                <Input 
                                                    value={item.role}
                                                    disabled={!isEditing}
                                                    onChange={(e) => {
                                                        const newExp = [...formData.recruiterProfile.experience];
                                                        newExp[idx].role = e.target.value;
                                                        setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                    }}
                                                    placeholder="e.g. SDE-II (Recruitment Systems)" className={`h-12 rounded-xl bg-background font-bold border-border ${!isEditing && 'border-transparent bg-transparent pl-0 opacity-80'}`} 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Duration</Label>
                                                <Input 
                                                    value={item.duration}
                                                    disabled={!isEditing}
                                                    onChange={(e) => {
                                                        const newExp = [...formData.recruiterProfile.experience];
                                                        newExp[idx].duration = e.target.value;
                                                        setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                    }}
                                                    placeholder="e.g. Jan 2018 - Dec 2021" className={`h-12 rounded-xl bg-background font-bold border-border ${!isEditing && 'border-transparent bg-transparent pl-0 opacity-80'}`} 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Role Description</Label>
                                            <textarea 
                                                className={`w-full h-full min-h-[160px] p-4 rounded-xl bg-background border border-border transition-all focus:outline-none focus:ring-1 focus:ring-emerald-600 text-sm font-bold ${!isEditing ? 'border-transparent bg-transparent pl-0 opacity-70' : ''}`}
                                                placeholder="Key contributions and achievements..."
                                                value={item.description}
                                                disabled={!isEditing}
                                                onChange={(e) => {
                                                    const newExp = [...formData.recruiterProfile.experience];
                                                    newExp[idx].description = e.target.value;
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, experience: newExp}});
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {formData.recruiterProfile.experience.length === 0 && (
                                <div className="text-center py-16 text-muted-foreground font-bold italic border-2 border-dashed border-border rounded-[32px] opacity-40">
                                    No professional history documented yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: ACADEMIC & CREDENTIALS ── */}
                <TabsContent value="academic" className="mt-8 space-y-10">
                    {/* Education */}
                    <Card className="rounded-[32px] border-border shadow-sm">
                        <CardHeader className="p-8 pb-4 border-b border-border bg-emerald-50/10 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <GraduationCap className="text-emerald-600 w-5 h-5" /> Academic Background
                            </CardTitle>
                            {isEditing && (
                                <Button onClick={addQualification} variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-emerald-600/20 hover:bg-emerald-50 text-emerald-700">
                                    <Plus className="w-4 h-4 mr-2" /> Add Qualification
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {formData.recruiterProfile.qualification.map((item, idx) => (
                                <div key={idx} className="relative p-8 rounded-[28px] border border-border bg-muted/10 group animate-in slide-in-from-right-4 duration-300">
                                    {isEditing && (
                                        <Button 
                                            onClick={() => {
                                                const newQual = [...formData.recruiterProfile.qualification];
                                                newQual.splice(idx, 1);
                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                            }}
                                            variant="ghost" size="icon" className="absolute top-6 right-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                        >
                                            <X size={18} />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Degree / Major</Label>
                                            <Input 
                                                value={item.degree}
                                                disabled={!isEditing}
                                                onChange={(e) => {
                                                    const newQual = [...formData.recruiterProfile.qualification];
                                                    newQual[idx].degree = e.target.value;
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                }}
                                                placeholder="e.g. MBA in HR" className={`h-12 rounded-xl bg-background font-bold border-border ${!isEditing && 'border-transparent bg-transparent pl-0 opacity-80'}`} 
                                            />
                                        </div>
                                        <div className="space-y-2 text-center md:text-left">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Institution</Label>
                                            <Input 
                                                value={item.institution}
                                                disabled={!isEditing}
                                                onChange={(e) => {
                                                    const newQual = [...formData.recruiterProfile.qualification];
                                                    newQual[idx].institution = e.target.value;
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                }}
                                                placeholder="e.g. IIM Lucknow" className={`h-12 rounded-xl bg-background font-bold border-border text-center md:text-left ${!isEditing && 'border-transparent bg-transparent pl-0 opacity-80'}`} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Batch / Year</Label>
                                            <Input 
                                                value={item.year}
                                                disabled={!isEditing}
                                                onChange={(e) => {
                                                    const newQual = [...formData.recruiterProfile.qualification];
                                                    newQual[idx].year = e.target.value;
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, qualification: newQual}});
                                                }}
                                                placeholder="e.g. 2017" className={`h-12 rounded-xl bg-background font-bold border-border text-right ${!isEditing && 'border-transparent bg-transparent pr-0 opacity-80'}`} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Certifications */}
                    <Card className="rounded-[32px] border-border shadow-sm">
                        <CardHeader className="p-8 pb-4 border-b border-border bg-emerald-50/10 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <Award className="text-emerald-600 w-5 h-5" /> Certifications
                            </CardTitle>
                            {isEditing && (
                                <Button onClick={addCertification} variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-emerald-600/20 hover:bg-emerald-50 text-emerald-700">
                                    <Plus className="w-4 h-4 mr-2" /> Add Certification
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {formData.recruiterProfile.certifications.map((item, idx) => (
                                <div key={idx} className="relative p-8 rounded-[28px] border border-border bg-muted/10 group animate-in slide-in-from-right-4 duration-300">
                                    {isEditing && (
                                        <Button 
                                            onClick={() => {
                                                const newCert = [...formData.recruiterProfile.certifications];
                                                newCert.splice(idx, 1);
                                                setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                            }}
                                            variant="ghost" size="icon" className="absolute top-6 right-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                        >
                                            <X size={18} />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Certification Name</Label>
                                            <Input 
                                                value={item.name}
                                                disabled={!isEditing}
                                                onChange={(e) => {
                                                    const newCert = [...formData.recruiterProfile.certifications];
                                                    newCert[idx].name = e.target.value;
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                }}
                                                placeholder="e.g. SHRM-CP" className={`h-12 rounded-xl bg-background font-bold border-border ${!isEditing && 'border-transparent bg-transparent pl-0 opacity-80'}`} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Issuing Organization</Label>
                                            <Input 
                                                value={item.organization}
                                                disabled={!isEditing}
                                                onChange={(e) => {
                                                    const newCert = [...formData.recruiterProfile.certifications];
                                                    newCert[idx].organization = e.target.value;
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                }}
                                                placeholder="e.g. SHRM" className={`h-12 rounded-xl bg-background font-bold border-border ${!isEditing && 'border-transparent bg-transparent pl-0 opacity-80'}`} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Year</Label>
                                            <Input 
                                                value={item.year}
                                                disabled={!isEditing}
                                                onChange={(e) => {
                                                    const newCert = [...formData.recruiterProfile.certifications];
                                                    newCert[idx].year = e.target.value;
                                                    setFormData({...formData, recruiterProfile: {...formData.recruiterProfile, certifications: newCert}});
                                                }}
                                                placeholder="e.g. 2021" className={`h-12 rounded-xl bg-background font-bold border-border ${!isEditing && 'border-transparent bg-transparent pl-0 opacity-80'}`} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: ORGANIZATION DETAILS ── */}
                <TabsContent value="company" className="mt-8 space-y-8">
                    <Card className="rounded-[32px] border-border shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-4 border-b border-border bg-emerald-50/10">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <Building2 className="text-emerald-600 w-5 h-5" /> Company Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Organization Name</Label>
                                    <Input 
                                        placeholder="e.g. Acme Corp"
                                        value={formData.companyData.name} 
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            companyData: {...formData.companyData, name: e.target.value}
                                        })}
                                        className={`h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Website URL</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input 
                                            placeholder="https://company.com"
                                            value={formData.companyData.website} 
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                companyData: {...formData.companyData, website: e.target.value}
                                            })}
                                            className={`pl-11 h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Industry / Sector</Label>
                                    <div className="relative">
                                        <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input 
                                            placeholder="e.g. Fintech, SaaS"
                                            value={formData.companyData.industry} 
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                companyData: {...formData.companyData, industry: e.target.value}
                                            })}
                                            className={`pl-11 h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Employee Count</Label>
                                    <Input 
                                        placeholder="e.g. 50-200 Employees"
                                        value={formData.companyData.employeeCount} 
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            companyData: {...formData.companyData, employeeCount: e.target.value}
                                        })}
                                        className={`h-12 rounded-xl bg-muted/20 border-border font-bold transition-all ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`} 
                                    />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Company Overview</Label>
                                <textarea 
                                    className={`w-full min-h-[120px] p-4 rounded-xl bg-muted/20 border border-border font-bold transition-all focus:outline-none focus:ring-1 focus:ring-emerald-600 text-sm ${!isEditing ? 'opacity-70 border-transparent bg-muted/5' : 'focus:bg-background'}`}
                                    placeholder="Describe the company mission and culture..."
                                    value={formData.companyData.description}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        companyData: {...formData.companyData, description: e.target.value}
                                    })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Footer Save Button */}
            {isEditing && (
                <div className="sticky bottom-8 z-20 flex justify-end p-2 bg-background/80 backdrop-blur-md rounded-3xl border border-border shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                    <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="h-14 px-12 rounded-2xl bg-emerald-600 text-white font-black text-base shadow-xl shadow-emerald-600/30 hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-3"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Recruiter Profile
                    </Button>
                </div>
            )}
        </div>
    );
};

export default RecruiterSettings;
