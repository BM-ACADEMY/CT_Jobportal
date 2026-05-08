import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Plus, X, Upload, FileText, CheckCircle2, Loader2,
  Save, Trash2, LayoutGrid, Clock, Target, Eye, Globe, MapPinned, Settings2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const API_USER_URL = `${import.meta.env.VITE_API_BASE_URL}/user`;

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
    "Lakshadweep", "Puducherry"
];

const COMMON_CITIES = [
    "Mumbai", "Delhi", "Bengaluru", "Ahmedabad", "Hyderabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat", 
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", 
    "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", 
    "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", 
    "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", 
    "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubballi-Dharwad", "Bareilly", "Moradabad", "Mysore", 
    "Gurgaon", "Aligarh", "Jalandhar", "Tiruchirappalli", "Bhubaneswar", "Salem", "Mira-Bhayandar", "Warangal", 
    "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur", "Bikaner", "Amravati", "Noida", "Jamshedpur", "Bhilai", 
    "Cuttack", "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela", 
    "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi", 
    "Ulhasnagar", "Davangere", "Jammu", "Sangli-Miraj & Kupwad", "Belgaum", "Mangalore", "Ambattur", "Tirunelveli", 
    "Malegaon", "Gaya", "Jalgaon", "Udaipur", "Maheshtala"
].sort();

const DataDisplay = ({ label, value, icon: Icon, isEditing, children }) => {
    if (isEditing) return children;
    return (
        <div className="space-y-1.5">
            <Label className="text-[9px] text-slate-400 uppercase tracking-[0.15em] font-bold leading-none ml-0.5">{label}</Label>
            <div className="flex items-center gap-3 min-h-[2.5rem] py-1">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100/50 shrink-0">
                    {Icon && <Icon size={14} className="text-slate-400" />}
                </div>
                <span className="text-sm font-bold text-slate-900">
                    {value || <span className="text-slate-300 font-medium">Not specified</span>}
                </span>
            </div>
        </div>
    );
};

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: user?.name || '',
        profile: {
            headline: user?.profile?.headline || '',
            phone: user?.profile?.phone || '',
            location: user?.profile?.location || '',
            bio: user?.profile?.bio || '',
            skills: user?.profile?.skills || [],
            qualification: user?.profile?.qualification || [],
            experience: user?.profile?.experience || [],
            interestedDomain: user?.profile?.interestedDomain || [],
            shifts: user?.profile?.shifts || [],
            preferredRole: user?.profile?.preferredRole || '',
            jobPreferences: user?.profile?.jobPreferences || {
                jobTitles: [],
                locationTypes: [],
                onSiteLocations: [],
                noticePeriod: '',
                expectedSalary: '',
                remoteLocations: [],
                startDate: '',
                employmentTypes: [],
                visibility: 'Everyone'
            }
        }
    });

    const [newSkill, setNewSkill] = useState('');
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newRemoteLocation, setNewRemoteLocation] = useState('');

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await axios.put(`${API_USER_URL}/profile`, formData);
            updateUser(res.data.user);
            toast.success("Profile synchronized successfully");
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Synchronization failed");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            profile: {
                headline: user?.profile?.headline || '',
                phone: user?.profile?.phone || '',
                location: user?.profile?.location || '',
                bio: user?.profile?.bio || '',
                skills: user?.profile?.skills || [],
                qualification: user?.profile?.qualification || [],
                experience: user?.profile?.experience || [],
                interestedDomain: user?.profile?.interestedDomain || [],
                shifts: user?.profile?.shifts || [],
                preferredRole: user?.profile?.preferredRole || '',
                jobPreferences: user?.profile?.jobPreferences || {
                    jobTitles: [],
                    locationTypes: [],
                    onSiteLocations: [],
                    noticePeriod: '',
                    expectedSalary: '',
                    remoteLocations: [],
                    startDate: '',
                    employmentTypes: [],
                    visibility: 'Everyone'
                }
            }
        });
        setIsEditing(false);
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('resume', file);

        setUploading(true);
        try {
            const res = await axios.post(`${API_USER_URL}/resume`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser({ 
                profile: { 
                    ...user.profile, 
                    resumeUrl: res.data.resumeUrl, 
                    resumeName: res.data.resumeName,
                    profileCompletion: res.data.profileCompletion
                } 
            });
            toast.success("Asset repository updated");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const addSkill = () => {
        if (!newSkill.trim()) return;
        if (formData.profile.skills.includes(newSkill.trim())) return;
        
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                skills: [...formData.profile.skills, newSkill.trim()]
            }
        });
        setNewSkill('');
    };

    const removeSkill = (skill) => {
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                skills: formData.profile.skills.filter(s => s !== skill)
            }
        });
    };

    const addExperience = () => {
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                experience: [...formData.profile.experience, { company: '', role: '', duration: '', description: '' }]
            }
        });
    };

    const addQualification = () => {
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                qualification: [...formData.profile.qualification, { degree: '', institution: '', year: '' }]
            }
        });
    };

    const addJobTitle = () => {
        if (!newJobTitle.trim()) return;
        if (formData.profile.jobPreferences.jobTitles.includes(newJobTitle.trim())) return;
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                jobPreferences: {
                    ...formData.profile.jobPreferences,
                    jobTitles: [...formData.profile.jobPreferences.jobTitles, newJobTitle.trim()]
                }
            }
        });
        setNewJobTitle('');
    };

    const removeJobTitle = (title) => {
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                jobPreferences: {
                    ...formData.profile.jobPreferences,
                    jobTitles: formData.profile.jobPreferences.jobTitles.filter(t => t !== title)
                }
            }
        });
    };

    const addOnSiteLocation = () => {
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                jobPreferences: {
                    ...formData.profile.jobPreferences,
                    onSiteLocations: [...formData.profile.jobPreferences.onSiteLocations, { city: '', state: '' }]
                }
            }
        });
    };

    const removeOnSiteLocation = (idx) => {
        const newLocs = [...formData.profile.jobPreferences.onSiteLocations];
        newLocs.splice(idx, 1);
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                jobPreferences: {
                    ...formData.profile.jobPreferences,
                    onSiteLocations: newLocs
                }
            }
        });
    };

    const addRemoteLocation = () => {
        if (!newRemoteLocation.trim()) return;
        if (formData.profile.jobPreferences.remoteLocations.includes(newRemoteLocation.trim())) return;
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                jobPreferences: {
                    ...formData.profile.jobPreferences,
                    remoteLocations: [...formData.profile.jobPreferences.remoteLocations, newRemoteLocation.trim()]
                }
            }
        });
        setNewRemoteLocation('');
    };

    const removeRemoteLocation = (loc) => {
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                jobPreferences: {
                    ...formData.profile.jobPreferences,
                    remoteLocations: formData.profile.jobPreferences.remoteLocations.filter(l => l !== loc)
                }
            }
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 py-8 px-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">
                        Profile Intelligence
                    </h1>
                    <p className="text-base text-slate-500 font-medium">Manage your professional identity and career roadmap</p>
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

            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 h-auto flex-wrap justify-start overflow-x-auto shadow-sm">
                    <TabsTrigger value="basic" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        <User className="w-3.5 h-3.5 mr-2" /> Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="academic" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        <GraduationCap className="w-3.5 h-3.5 mr-2" /> Academic
                    </TabsTrigger>
                    <TabsTrigger value="professional" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        <Briefcase className="w-3.5 h-3.5 mr-2" /> Professional
                    </TabsTrigger>
                    <TabsTrigger value="resume" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        <FileText className="w-3.5 h-3.5 mr-2" /> Asset Repository
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent">
                        <Settings2 className="w-3.5 h-3.5 mr-2" /> Preferences
                    </TabsTrigger>
                </TabsList>

                {/* ── TAB: BASIC INFO ── */}
                <TabsContent value="basic" className="mt-8 space-y-6">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-50">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4 text-emerald-600" /> Identity Foundation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <DataDisplay label="Full Legal Name" value={formData.name} icon={User} isEditing={isEditing}>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                            <Input 
                                                value={formData.name} 
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="pl-11 h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                            />
                                        </div>
                                    </div>
                                </DataDisplay>

                                <DataDisplay label="Primary Correspondence" value={user?.email} icon={Mail} isEditing={false}>
                                    <div className="space-y-1.5 opacity-60">
                                        <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                            <Input value={user?.email} disabled className="pl-11 h-11 rounded-xl bg-slate-100 border-slate-200 font-medium text-sm" />
                                        </div>
                                    </div>
                                </DataDisplay>

                                <DataDisplay label="Professional Brand" value={formData.profile.headline} icon={Target} isEditing={isEditing}>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Professional Headline</Label>
                                        <div className="relative">
                                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                            <Input 
                                                placeholder="e.g. Lead Systems Architect" 
                                                value={formData.profile.headline}
                                                onChange={(e) => setFormData({...formData, profile: {...formData.profile, headline: e.target.value}})}
                                                className="pl-11 h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                            />
                                        </div>
                                    </div>
                                </DataDisplay>

                                <DataDisplay label="Contact Vector" value={formData.profile.phone} icon={Phone} isEditing={isEditing}>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                            <Input 
                                                placeholder="+91 00000 00000" 
                                                value={formData.profile.phone}
                                                onChange={(e) => setFormData({...formData, profile: {...formData.profile, phone: e.target.value}})}
                                                className="pl-11 h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                            />
                                        </div>
                                    </div>
                                </DataDisplay>
                            </div>
                            
                            <DataDisplay label="Professional Summary" value={formData.profile.bio} isEditing={isEditing}>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Bio</Label>
                                    <textarea 
                                        className="w-full min-h-[120px] p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                        placeholder="Articulate your professional journey and value proposition..."
                                        value={formData.profile.bio}
                                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, bio: e.target.value}})}
                                    />
                                </div>
                            </DataDisplay>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: ACADEMIC ── */}
                <TabsContent value="academic" className="mt-8">
                     <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-50 flex flex-row items-center justify-between p-6">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-emerald-600" /> Academic Credentials
                            </CardTitle>
                            {isEditing && (
                                <Button onClick={addQualification} variant="ghost" size="sm" className="h-9 rounded-lg text-emerald-600 font-bold hover:bg-emerald-50 text-[10px] uppercase tracking-widest px-4">
                                    <Plus className="w-3.5 h-3.5 mr-2" /> Insert Record
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {formData.profile.qualification.map((item, idx) => (
                                <div key={idx} className={`group relative ${isEditing ? 'p-6 rounded-2xl border border-slate-100 bg-slate-50/30' : 'bg-white'}`}>
                                    {isEditing && (
                                        <Button 
                                            onClick={() => {
                                                const newQual = [...formData.profile.qualification];
                                                newQual.splice(idx, 1);
                                                setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                            }}
                                            variant="ghost" size="icon" className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 h-8 w-8 rounded-lg"
                                        >
                                            <X size={16} />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <DataDisplay label="Qualification Degree" value={item.degree} isEditing={isEditing}>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Degree</Label>
                                                <Input 
                                                    value={item.degree}
                                                    onChange={(e) => {
                                                        const newQual = [...formData.profile.qualification];
                                                        newQual[idx].degree = e.target.value;
                                                        setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                                    }}
                                                    className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm focus:border-emerald-300 focus:ring-emerald-100 transition-all" 
                                                />
                                            </div>
                                        </DataDisplay>
                                        <DataDisplay label="Academic Institution" value={item.institution} isEditing={isEditing}>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Institution</Label>
                                                <Input 
                                                    value={item.institution}
                                                    onChange={(e) => {
                                                        const newQual = [...formData.profile.qualification];
                                                        newQual[idx].institution = e.target.value;
                                                        setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                                    }}
                                                    className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm focus:border-emerald-300 focus:ring-emerald-100 transition-all" 
                                                />
                                            </div>
                                        </DataDisplay>
                                        <DataDisplay label="Completion Year" value={item.year} isEditing={isEditing}>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Year</Label>
                                                <Input 
                                                    value={item.year}
                                                    onChange={(e) => {
                                                        const newQual = [...formData.profile.qualification];
                                                        newQual[idx].year = e.target.value;
                                                        setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                                    }}
                                                    className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm focus:border-emerald-300 focus:ring-emerald-100 transition-all" 
                                                />
                                            </div>
                                        </DataDisplay>
                                    </div>
                                    {idx < formData.profile.qualification.length - 1 && <div className="h-px bg-slate-50 my-6" />}
                                </div>
                            ))}
                            {formData.profile.qualification.length === 0 && (
                                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <GraduationCap className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No academic records documented.</p>
                                </div>
                            )}
                        </CardContent>
                     </Card>
                </TabsContent>

                {/* ── TAB: PROFESSIONAL ── */}
                <TabsContent value="professional" className="mt-8 space-y-6">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-50 flex flex-row items-center justify-between p-6">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-emerald-600" /> Professional Dossier
                            </CardTitle>
                            {isEditing && (
                                <Button onClick={addExperience} variant="ghost" size="sm" className="h-9 rounded-lg text-emerald-600 font-bold hover:bg-emerald-50 text-[10px] uppercase tracking-widest px-4">
                                    <Plus className="w-3.5 h-3.5 mr-2" /> Append Role
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            {formData.profile.experience.map((item, idx) => (
                                <div key={idx} className={`group relative ${isEditing ? 'p-6 rounded-2xl border border-slate-100 bg-slate-50/30' : 'bg-white'}`}>
                                    {isEditing && (
                                        <Button 
                                            onClick={() => {
                                                const newExp = [...formData.profile.experience];
                                                newExp.splice(idx, 1);
                                                setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                            }}
                                            variant="ghost" size="icon" className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 h-8 w-8 rounded-lg"
                                        >
                                            <X size={16} />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <DataDisplay label="Organization Name" value={item.company} isEditing={isEditing}>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Company</Label>
                                                    <Input 
                                                        value={item.company}
                                                        onChange={(e) => {
                                                            const newExp = [...formData.profile.experience];
                                                            newExp[idx].company = e.target.value;
                                                            setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                                        }}
                                                        className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm focus:border-emerald-300 focus:ring-emerald-100 transition-all" 
                                                    />
                                                </div>
                                            </DataDisplay>
                                            <DataDisplay label="Designation" value={item.role} isEditing={isEditing}>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Role</Label>
                                                    <Input 
                                                        value={item.role}
                                                        onChange={(e) => {
                                                            const newExp = [...formData.profile.experience];
                                                            newExp[idx].role = e.target.value;
                                                            setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                                        }}
                                                        className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm focus:border-emerald-300 focus:ring-emerald-100 transition-all" 
                                                    />
                                                </div>
                                            </DataDisplay>
                                            <DataDisplay label="Tenure Period" value={item.duration} isEditing={isEditing}>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Duration</Label>
                                                    <Input 
                                                        value={item.duration}
                                                        onChange={(e) => {
                                                            const newExp = [...formData.profile.experience];
                                                            newExp[idx].duration = e.target.value;
                                                            setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                                        }}
                                                        className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm focus:border-emerald-300 focus:ring-emerald-100 transition-all" 
                                                    />
                                                </div>
                                            </DataDisplay>
                                        </div>
                                        <DataDisplay label="Role responsibilities" value={item.description} isEditing={isEditing}>
                                            <div className="space-y-1.5 h-full">
                                                <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Description</Label>
                                                <textarea 
                                                    className="w-full h-[180px] p-4 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                                    placeholder="Detail your accomplishments and key contributions..."
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const newExp = [...formData.profile.experience];
                                                        newExp[idx].description = e.target.value;
                                                        setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                                    }}
                                                />
                                            </div>
                                        </DataDisplay>
                                    </div>
                                    {idx < formData.profile.experience.length - 1 && <div className="h-px bg-slate-50 my-8" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-50 p-6">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Target className="w-4 h-4 text-emerald-600" /> Specialized Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {isEditing && (
                                <div className="flex gap-3">
                                    <Input 
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                        placeholder="Add specialized competency..." 
                                        className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                    />
                                    <Button onClick={addSkill} className="h-11 rounded-xl bg-slate-900 text-white font-bold text-xs px-6 uppercase tracking-widest">Inject</Button>
                                </div>
                            )}
                             <div className="flex flex-wrap gap-2.5">
                                {formData.profile.skills.map((skill) => (
                                    <Badge key={skill} variant="secondary" className="px-4 py-1.5 text-[11px] rounded-lg flex items-center gap-2 font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                        {skill}
                                        {isEditing && <X size={12} className="cursor-pointer text-emerald-400 hover:text-emerald-600" onClick={() => removeSkill(skill)} />}
                                    </Badge>
                                ))}
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: RESUME ── */}
                <TabsContent value="resume" className="mt-8">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-50 p-6">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-600" /> Asset Repository
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10">
                            {user?.profile?.resumeUrl ? (
                                <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-white border border-slate-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                                            <FileText size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-slate-900">{user.profile.resumeName || 'Resume.pdf'}</h4>
                                            <p className="text-[9px] text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                                                <CheckCircle2 size={12} /> Verified Deployment
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                         <Button variant="outline" size="sm" className="h-10 px-5 rounded-lg text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-white hover:text-emerald-600 transition-all" asChild>
                                            <a href={`${import.meta.env.VITE_API_DOMAIN}${user.profile.resumeUrl}`} target="_blank" rel="noreferrer">Review</a>
                                         </Button>
                                         {isEditing && (
                                            <label className="cursor-pointer">
                                                <Input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                                                <div className="h-10 px-5 rounded-lg bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm">
                                                    Replace
                                                </div>
                                            </label>
                                         )}
                                    </div>
                                </div>
                            ) : (
                                isEditing ? (
                                    <label className="cursor-pointer">
                                        <Input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                                        <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-20 flex flex-col items-center gap-4 hover:bg-slate-50 hover:border-emerald-200 transition-all group">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:text-emerald-500 transition-all">
                                                {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                                            </div>
                                            <div className="text-center space-y-1">
                                                <h3 className="text-base font-bold text-slate-900">Transmit Resume</h3>
                                                <p className="text-xs text-slate-400 font-medium">Standard PDF or DOCX architecture (Max 5MB)</p>
                                            </div>
                                        </div>
                                    </label>
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px]">
                                        <FileText className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 text-sm font-medium italic">No assets detected in repository.</p>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: JOB PREFERENCES ── */}
                <TabsContent value="preferences" className="mt-8 space-y-6">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-50 p-6">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-emerald-600" /> Strategic Career Vector
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-400">Define your ideal operational conditions and professional requirements</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            
                            {/* Job Titles */}
                            <div className="space-y-4">
                                <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Preferred Professional Designations</Label>
                                {isEditing && (
                                    <div className="flex gap-3">
                                        <Input 
                                            value={newJobTitle}
                                            onChange={(e) => setNewJobTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addJobTitle()}
                                            placeholder="Append target role title..." 
                                            className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                        />
                                        <Button onClick={addJobTitle} className="h-11 rounded-xl bg-slate-900 text-white font-bold text-xs px-6 uppercase tracking-widest">Inject</Button>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2.5">
                                    {formData.profile.jobPreferences.jobTitles.map((title) => (
                                        <Badge key={title} variant="outline" className="px-4 py-1.5 text-[11px] rounded-lg flex items-center gap-2 font-bold bg-white text-slate-600 border-slate-200 shadow-sm">
                                            {title}
                                            {isEditing && <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => removeJobTitle(title)} />}
                                        </Badge>
                                    ))}
                                    {formData.profile.jobPreferences.jobTitles.length === 0 && !isEditing && <span className="text-sm font-bold text-slate-300 ml-1">Not specified</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Location Types */}
                                <div className="space-y-4">
                                    <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Operational Modality</Label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {['On-site', 'Hybrid', 'Remote'].map((type) => (
                                            <div 
                                                key={type}
                                                onClick={() => {
                                                    if (!isEditing) return;
                                                    const current = formData.profile.jobPreferences.locationTypes;
                                                    const next = current.includes(type) 
                                                        ? current.filter(t => t !== type) 
                                                        : [...current, type];
                                                    setFormData({
                                                        ...formData,
                                                        profile: {
                                                            ...formData.profile,
                                                            jobPreferences: { ...formData.profile.jobPreferences, locationTypes: next }
                                                        }
                                                    });
                                                }}
                                                className={`px-5 py-2.5 rounded-xl border text-[11px] cursor-pointer transition-all font-bold tracking-tight ${
                                                    formData.profile.jobPreferences.locationTypes.includes(type)
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm'
                                                        : 'border-slate-100 bg-slate-50 text-slate-400'
                                                } ${!isEditing && 'cursor-default'}`}
                                            >
                                                {type}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Employment Types */}
                                <div className="space-y-4">
                                    <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Contract Architecture</Label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {['Full-time', 'Contract', 'Freelance', 'Internship'].map((type) => (
                                            <div 
                                                key={type}
                                                onClick={() => {
                                                    if (!isEditing) return;
                                                    const current = formData.profile.jobPreferences.employmentTypes;
                                                    const next = current.includes(type) 
                                                        ? current.filter(t => t !== type) 
                                                        : [...current, type];
                                                    setFormData({
                                                        ...formData,
                                                        profile: {
                                                            ...formData.profile,
                                                            jobPreferences: { ...formData.profile.jobPreferences, employmentTypes: next }
                                                        }
                                                    });
                                                }}
                                                className={`px-5 py-2.5 rounded-xl border text-[11px] cursor-pointer transition-all font-bold tracking-tight ${
                                                    formData.profile.jobPreferences.employmentTypes.includes(type)
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm'
                                                        : 'border-slate-100 bg-slate-50 text-slate-400'
                                                } ${!isEditing && 'cursor-default'}`}
                                            >
                                                {type}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* On-Site Locations */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pr-2">
                                    <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Geographic Targets</Label>
                                    {isEditing && (
                                        <Button onClick={addOnSiteLocation} variant="ghost" size="sm" className="text-[10px] h-8 font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg uppercase tracking-widest px-3">
                                            <Plus className="w-3.5 h-3.5 mr-2" /> Add Location
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.profile.jobPreferences.onSiteLocations.map((loc, idx) => (
                                        <div key={idx} className={`flex gap-3 items-center p-4 rounded-2xl border bg-slate-50/50 ${!isEditing && 'bg-white border-slate-100'}`}>
                                            <div className="grid grid-cols-2 gap-3 flex-1">
                                                {isEditing ? (
                                                    <>
                                                        <select 
                                                            value={loc.state}
                                                            onChange={(e) => {
                                                                const next = [...formData.profile.jobPreferences.onSiteLocations];
                                                                next[idx].state = e.target.value;
                                                                setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, onSiteLocations: next}}});
                                                            }}
                                                            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-emerald-300 transition-all"
                                                        >
                                                            <option value="">State</option>
                                                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                        <select 
                                                            value={loc.city}
                                                            onChange={(e) => {
                                                                const next = [...formData.profile.jobPreferences.onSiteLocations];
                                                                next[idx].city = e.target.value;
                                                                setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, onSiteLocations: next}}});
                                                            }}
                                                            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-emerald-300 transition-all"
                                                        >
                                                            <option value="">City</option>
                                                            {COMMON_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </>
                                                ) : (
                                                    <div className="flex gap-2 items-center font-bold text-sm col-span-2 text-slate-900">
                                                        <MapPin size={14} className="text-slate-300" />
                                                        {loc.city}, {loc.state}
                                                    </div>
                                                )}
                                            </div>
                                            {isEditing && (
                                                <Button onClick={() => removeOnSiteLocation(idx)} variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-600 rounded-lg">
                                                    <Trash2 size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {formData.profile.jobPreferences.onSiteLocations.length === 0 && !isEditing && <span className="text-sm font-bold text-slate-300 ml-1">Not specified</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <DataDisplay label="Operational Availability" value={formData.profile.jobPreferences.noticePeriod} isEditing={isEditing}>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Notice Period</Label>
                                        <select 
                                            value={formData.profile.jobPreferences.noticePeriod}
                                            onChange={(e) => setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, noticePeriod: e.target.value}}})}
                                            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-900 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                                        >
                                            <option value="">Select threshold...</option>
                                            <option value="Immediately available">Immediately available</option>
                                            <option value="15 Days or less">15 Days or less</option>
                                            <option value="30 Days">30 Days</option>
                                            <option value="45 Days">45 Days</option>
                                            <option value="2 Months">2 Months</option>
                                            <option value="3 Months">3 Months</option>
                                        </select>
                                    </div>
                                </DataDisplay>

                                <DataDisplay label="Compensation Baseline" value={formData.profile.jobPreferences.expectedSalary} isEditing={isEditing}>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Expected Annual Salary</Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm font-bold">₹</span>
                                            <Input 
                                                placeholder="e.g. 12.5 LPA" 
                                                value={formData.profile.jobPreferences.expectedSalary}
                                                onChange={(e) => setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, expectedSalary: e.target.value}}})}
                                                className="pl-8 h-11 rounded-xl bg-slate-50 border border-slate-100 font-medium text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all" 
                                            />
                                        </div>
                                    </div>
                                </DataDisplay>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Remote Geographic Expansion</Label>
                                    {isEditing && (
                                        <div className="flex gap-3">
                                            <Input 
                                                value={newRemoteLocation}
                                                onChange={(e) => setNewRemoteLocation(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addRemoteLocation()}
                                                placeholder="Add territory/region..." 
                                                className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm" 
                                            />
                                            <Button onClick={addRemoteLocation} className="h-11 rounded-xl bg-slate-900 text-white font-bold text-xs px-6 uppercase tracking-widest">Inject</Button>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2.5">
                                        {formData.profile.jobPreferences.remoteLocations.map((loc) => (
                                            <Badge key={loc} variant="outline" className="px-4 py-1.5 text-[10px] rounded-lg flex items-center gap-2 font-bold bg-slate-50 text-slate-600 border-slate-200">
                                                <Globe size={12} className="text-slate-300" />
                                                {loc}
                                                {isEditing && <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => removeRemoteLocation(loc)} />}
                                            </Badge>
                                        ))}
                                        {formData.profile.jobPreferences.remoteLocations.length === 0 && !isEditing && <span className="text-sm font-bold text-slate-300 ml-1">Not specified</span>}
                                    </div>
                                </div>

                                <DataDisplay label="Engagement Readiness" value={formData.profile.jobPreferences.startDate} isEditing={isEditing}>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Application Status</Label>
                                        <select 
                                            value={formData.profile.jobPreferences.startDate}
                                            onChange={(e) => setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, startDate: e.target.value}}})}
                                            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-900 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                                        >
                                            <option value="">Select engagement level...</option>
                                            <option value="Immediately, I am actively applying">High Intensity (Active)</option>
                                            <option value="Flexible, I am just browsing">Low Intensity (Passive)</option>
                                            <option value="Looking for the right opportunity">Strategic Fit Search</option>
                                        </select>
                                    </div>
                                </DataDisplay>
                            </div>

                            {/* Visibility */}
                            <div className="p-8 rounded-[24px] bg-slate-50 border border-slate-100 space-y-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                                        <Eye className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-base font-bold text-slate-900">Information Privacy Matrix</h4>
                                        <p className="text-xs text-slate-400 font-medium">Control the exposure of your professional preferences</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {[
                                        { id: 'Everyone', label: 'Universal Access', sub: 'Standard platform visibility' },
                                        { id: 'Recruiters', label: 'Restricted Access', sub: 'Verified strategic partners only' }
                                    ].map((opt) => (
                                        <div 
                                            key={opt.id}
                                            onClick={() => {
                                                if (!isEditing) return;
                                                setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, visibility: opt.id}}});
                                            }}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                                                formData.profile.jobPreferences.visibility === opt.id
                                                    ? 'border-emerald-600 bg-white shadow-md'
                                                    : 'border-slate-100 bg-white/50 opacity-60'
                                            } ${!isEditing && 'opacity-100 cursor-default shadow-none'}`}
                                        >
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.profile.jobPreferences.visibility === opt.id ? 'border-emerald-600' : 'border-slate-200'}`}>
                                                    {formData.profile.jobPreferences.visibility === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                                                </div>
                                                <span className={`font-bold text-sm ${formData.profile.jobPreferences.visibility === opt.id ? 'text-slate-900' : 'text-slate-400'}`}>{opt.label}</span>
                                            </div>
                                            <p className={`text-[10px] uppercase tracking-widest font-bold ml-8 ${formData.profile.jobPreferences.visibility === opt.id ? 'text-emerald-500' : 'text-slate-300'}`}>{opt.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Settings;
