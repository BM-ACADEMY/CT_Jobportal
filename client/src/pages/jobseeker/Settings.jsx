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
        <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">{label}</Label>
            <div className="flex items-center gap-2 min-h-[2.5rem] py-1">
                {Icon && <Icon size={14} className="text-muted-foreground shrink-0" />}
                <span className="text-sm font-bold text-foreground">
                    {value || <span className="opacity-30 font-normal">-</span>}
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
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to update profile");
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
            toast.success("Resume uploaded successfully!");
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
        <div className="max-w-4xl mx-auto space-y-8 py-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        Profile Settings
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your professional identity and job seeker preferences</p>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button 
                            variant="outline" 
                            onClick={handleCancel}
                            className="text-xs uppercase tracking-wider h-10 px-6"
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => setIsEditing(true)}
                            className="text-xs uppercase tracking-wider shadow-sm h-10 px-6"
                        >
                            <Save className="w-4 h-4 mr-2" /> Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="bg-muted p-1 rounded-lg h-auto flex-wrap justify-start border overflow-x-auto">
                    <TabsTrigger value="basic" className="px-4 py-2 text-xs uppercase tracking-wide">
                        <User className="w-4 h-4 mr-2" /> Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="academic" className="px-4 py-2 text-xs uppercase tracking-wide">
                        <GraduationCap className="w-4 h-4 mr-2" /> Academic
                    </TabsTrigger>
                    <TabsTrigger value="professional" className="px-4 py-2 text-xs uppercase tracking-wide">
                        <Briefcase className="w-4 h-4 mr-2" /> Professional
                    </TabsTrigger>
                    <TabsTrigger value="resume" className="px-4 py-2 text-xs uppercase tracking-wide">
                        <FileText className="w-4 h-4 mr-2" /> Resume
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="px-4 py-2 text-xs uppercase tracking-wide">
                        <Settings2 className="w-4 h-4 mr-2" /> Preferences
                    </TabsTrigger>
                </TabsList>

                {/* ── TAB: BASIC INFO ── */}
                <TabsContent value="basic" className="mt-6 space-y-6">
                    <Card className="rounded-lg border shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4 text-muted-foreground" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                <DataDisplay label="Full Name" value={formData.name} icon={User} isEditing={isEditing}>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input 
                                                value={formData.name} 
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="pl-10 text-sm h-10" 
                                            />
                                        </div>
                                    </div>
                                </DataDisplay>

                                <DataDisplay label="Email Address" value={user?.email} icon={Mail} isEditing={false}>
                                    <div className="space-y-2 opacity-80">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input value={user?.email} disabled className="pl-10 text-sm bg-muted/30 h-10" />
                                        </div>
                                    </div>
                                </DataDisplay>

                                <DataDisplay label="Professional Headline" value={formData.profile.headline} icon={Target} isEditing={isEditing}>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Professional Headline</Label>
                                        <div className="relative">
                                            <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input 
                                                placeholder="e.g. Senior Software Engineer" 
                                                value={formData.profile.headline}
                                                onChange={(e) => setFormData({...formData, profile: {...formData.profile, headline: e.target.value}})}
                                                className="pl-10 text-sm h-10" 
                                            />
                                        </div>
                                    </div>
                                </DataDisplay>

                                <DataDisplay label="Phone Number" value={formData.profile.phone} icon={Phone} isEditing={isEditing}>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input 
                                                placeholder="+91 00000 00000" 
                                                value={formData.profile.phone}
                                                onChange={(e) => setFormData({...formData, profile: {...formData.profile, phone: e.target.value}})}
                                                className="pl-10 text-sm h-10" 
                                            />
                                        </div>
                                    </div>
                                </DataDisplay>
                            </div>
                            
                            <DataDisplay label="Bio" value={formData.profile.bio} isEditing={isEditing}>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bio</Label>
                                    <textarea 
                                        className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Brief professional overview..."
                                        value={formData.profile.bio}
                                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, bio: e.target.value}})}
                                    />
                                </div>
                            </DataDisplay>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: ACADEMIC ── */}
                <TabsContent value="academic" className="mt-6">
                     <Card className="rounded-lg border shadow-sm">
                        <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-muted-foreground" /> Education
                            </CardTitle>
                            {isEditing && (
                                <Button onClick={addQualification} variant="outline" size="sm" className="text-xs h-8">
                                    <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {formData.profile.qualification.map((item, idx) => (
                                <div key={idx} className={`p-4 rounded-md border bg-muted/5 relative ${!isEditing && 'bg-background border-none px-0 py-2'}`}>
                                    {isEditing && (
                                        <Button 
                                            onClick={() => {
                                                const newQual = [...formData.profile.qualification];
                                                newQual.splice(idx, 1);
                                                setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                            }}
                                            variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-7 w-7"
                                        >
                                            <X size={14} />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <DataDisplay label="Degree" value={item.degree} isEditing={isEditing}>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase text-muted-foreground tracking-tighter">Degree</Label>
                                                <Input 
                                                    value={item.degree}
                                                    onChange={(e) => {
                                                        const newQual = [...formData.profile.qualification];
                                                        newQual[idx].degree = e.target.value;
                                                        setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                                    }}
                                                    className="h-9 text-xs" 
                                                />
                                            </div>
                                        </DataDisplay>
                                        <DataDisplay label="Institution" value={item.institution} isEditing={isEditing}>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase text-muted-foreground tracking-tighter">Institution</Label>
                                                <Input 
                                                    value={item.institution}
                                                    onChange={(e) => {
                                                        const newQual = [...formData.profile.qualification];
                                                        newQual[idx].institution = e.target.value;
                                                        setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                                    }}
                                                    className="h-9 text-xs" 
                                                />
                                            </div>
                                        </DataDisplay>
                                        <DataDisplay label="Year" value={item.year} isEditing={isEditing}>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase text-muted-foreground tracking-tighter">Year</Label>
                                                <Input 
                                                    value={item.year}
                                                    onChange={(e) => {
                                                        const newQual = [...formData.profile.qualification];
                                                        newQual[idx].year = e.target.value;
                                                        setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                                    }}
                                                    className="h-9 text-xs" 
                                                />
                                            </div>
                                        </DataDisplay>
                                    </div>
                                    {!isEditing && idx < formData.profile.qualification.length - 1 && <div className="border-b border-border/50 my-4" />}
                                </div>
                            ))}
                            {formData.profile.qualification.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground text-sm italic">
                                    No education information added yet.
                                </div>
                            )}
                        </CardContent>
                     </Card>
                </TabsContent>

                {/* ── TAB: PROFESSIONAL ── */}
                <TabsContent value="professional" className="mt-6 space-y-6">
                    <Card className="rounded-lg border shadow-sm">
                        <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-muted-foreground" /> Work Experience
                            </CardTitle>
                            {isEditing && (
                                <Button onClick={addExperience} variant="outline" size="sm" className="text-xs h-8">
                                    <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {formData.profile.experience.map((item, idx) => (
                                <div key={idx} className={`p-4 rounded-md border bg-muted/5 relative ${!isEditing && 'bg-background border-none px-0 py-2'}`}>
                                    {isEditing && (
                                        <Button 
                                            onClick={() => {
                                                const newExp = [...formData.profile.experience];
                                                newExp.splice(idx, 1);
                                                setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                            }}
                                            variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-7 w-7"
                                        >
                                            <X size={14} />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <DataDisplay label="Company" value={item.company} isEditing={isEditing}>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground tracking-tighter">Company</Label>
                                                    <Input 
                                                        value={item.company}
                                                        onChange={(e) => {
                                                            const newExp = [...formData.profile.experience];
                                                            newExp[idx].company = e.target.value;
                                                            setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                                        }}
                                                        className="h-9 text-xs" 
                                                    />
                                                </div>
                                            </DataDisplay>
                                            <DataDisplay label="Role" value={item.role} isEditing={isEditing}>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground tracking-tighter">Role</Label>
                                                    <Input 
                                                        value={item.role}
                                                        onChange={(e) => {
                                                            const newExp = [...formData.profile.experience];
                                                            newExp[idx].role = e.target.value;
                                                            setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                                        }}
                                                        className="h-9 text-xs" 
                                                    />
                                                </div>
                                            </DataDisplay>
                                            <DataDisplay label="Duration" value={item.duration} isEditing={isEditing}>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground tracking-tighter">Duration</Label>
                                                    <Input 
                                                        value={item.duration}
                                                        onChange={(e) => {
                                                            const newExp = [...formData.profile.experience];
                                                            newExp[idx].duration = e.target.value;
                                                            setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                                        }}
                                                        className="h-9 text-xs" 
                                                    />
                                                </div>
                                            </DataDisplay>
                                        </div>
                                        <DataDisplay label="Description" value={item.description} isEditing={isEditing}>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase text-muted-foreground tracking-tighter">Description</Label>
                                                <textarea 
                                                    className="w-full h-full min-h-[100px] p-3 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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
                                    {!isEditing && idx < formData.profile.experience.length - 1 && <div className="border-b border-border/50 my-4" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg border shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Target className="w-4 h-4 text-muted-foreground" /> Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Input 
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                        placeholder="Add skill..." 
                                        className="h-9 text-sm" 
                                    />
                                    <Button onClick={addSkill} size="sm" className="h-9">Add</Button>
                                </div>
                            )}
                             <div className="flex flex-wrap gap-2">
                                {formData.profile.skills.map((skill) => (
                                    <Badge key={skill} variant="secondary" className="px-3 py-1 text-xs rounded-full flex items-center gap-1 font-bold">
                                        {skill}
                                        {isEditing && <X size={12} className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => removeSkill(skill)} />}
                                    </Badge>
                                ))}
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: RESUME ── */}
                <TabsContent value="resume" className="mt-6">
                    <Card className="rounded-lg border shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" /> Resume
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            {user?.profile?.resumeUrl ? (
                                <div className="p-4 rounded-lg border bg-muted/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold">{user.profile.resumeName || 'Resume.pdf'}</h4>
                                            <p className="text-[10px] text-emerald-600 uppercase tracking-wider flex items-center gap-1 mt-0.5 font-bold">
                                                <CheckCircle2 size={10} /> Active
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                         <Button variant="outline" size="sm" className="text-[10px] font-bold" asChild>
                                            <a href={`${import.meta.env.VITE_API_DOMAIN}${user.profile.resumeUrl}`} target="_blank" rel="noreferrer">Download</a>
                                         </Button>
                                         {isEditing && (
                                            <label className="cursor-pointer">
                                                <Input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                                                <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
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
                                        <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center gap-3 hover:bg-muted/50 transition-colors">
                                            <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                                                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-sm font-medium">Upload Resume</h3>
                                                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX up to 5MB</p>
                                            </div>
                                        </div>
                                    </label>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                        <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-30" />
                                        <p className="text-muted-foreground text-xs italic">No resume uploaded.</p>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: JOB PREFERENCES ── */}
                <TabsContent value="preferences" className="mt-6 space-y-6">
                    <Card className="rounded-lg border shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-muted-foreground" /> Job Search Requirements
                            </CardTitle>
                            <CardDescription className="text-xs">Specify your ideal career role and conditions</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">
                            
                            {/* Job Titles */}
                            <div className="space-y-3">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Preferred Job Titles</Label>
                                {isEditing && (
                                    <div className="flex gap-2">
                                        <Input 
                                            value={newJobTitle}
                                            onChange={(e) => setNewJobTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addJobTitle()}
                                            placeholder="Add job title..." 
                                            className="h-9 text-sm" 
                                        />
                                        <Button onClick={addJobTitle} size="sm" className="h-9">Add</Button>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {formData.profile.jobPreferences.jobTitles.map((title) => (
                                        <Badge key={title} variant="outline" className="px-3 py-1 text-xs rounded-full flex items-center gap-1 bg-muted/20 font-bold">
                                            {title}
                                            {isEditing && <X size={12} className="cursor-pointer text-muted-foreground" onClick={() => removeJobTitle(title)} />}
                                        </Badge>
                                    ))}
                                    {formData.profile.jobPreferences.jobTitles.length === 0 && !isEditing && <span className="text-sm font-bold opacity-30">-</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Location Types */}
                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Location Types</Label>
                                    <div className="flex flex-wrap gap-2">
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
                                                className={`px-4 py-2 rounded-md border text-xs cursor-pointer transition-all font-bold ${
                                                    formData.profile.jobPreferences.locationTypes.includes(type)
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-border bg-muted/30 text-muted-foreground'
                                                } ${!isEditing && 'cursor-default'}`}
                                            >
                                                {type}
                                            </div>
                                        ))}
                                        {formData.profile.jobPreferences.locationTypes.length === 0 && !isEditing && <span className="text-sm font-bold opacity-30">-</span>}
                                    </div>
                                </div>

                                {/* Employment Types */}
                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Employment Types</Label>
                                    <div className="flex flex-wrap gap-2">
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
                                                className={`px-4 py-2 rounded-md border text-xs cursor-pointer transition-all font-bold ${
                                                    formData.profile.jobPreferences.employmentTypes.includes(type)
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-border bg-muted/30 text-muted-foreground'
                                                } ${!isEditing && 'cursor-default'}`}
                                            >
                                                {type}
                                            </div>
                                        ))}
                                        {formData.profile.jobPreferences.employmentTypes.length === 0 && !isEditing && <span className="text-sm font-bold opacity-30">-</span>}
                                    </div>
                                </div>
                            </div>

                            {/* On-Site Locations */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Preferred Locations</Label>
                                    {isEditing && (
                                        <Button onClick={addOnSiteLocation} variant="ghost" size="sm" className="text-[10px] h-6 font-bold">
                                            <Plus className="w-3 h-3 mr-1" /> Add Location
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {formData.profile.jobPreferences.onSiteLocations.map((loc, idx) => (
                                        <div key={idx} className={`flex gap-2 items-center p-2 rounded-md border bg-muted/5 ${!isEditing && 'bg-transparent border-none p-0'}`}>
                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                {isEditing ? (
                                                    <>
                                                        <select 
                                                            value={loc.state}
                                                            onChange={(e) => {
                                                                const next = [...formData.profile.jobPreferences.onSiteLocations];
                                                                next[idx].state = e.target.value;
                                                                setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, onSiteLocations: next}}});
                                                            }}
                                                            className="h-8 px-2 rounded-md bg-background border border-border text-[10px] focus:ring-1 focus:ring-primary outline-none"
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
                                                            className="h-8 px-2 rounded-md bg-background border border-border text-[10px] focus:ring-1 focus:ring-primary outline-none"
                                                        >
                                                            <option value="">City</option>
                                                            {COMMON_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </>
                                                ) : (
                                                    <div className="flex gap-1 items-center font-bold text-sm col-span-2">
                                                        <MapPin size={12} className="text-muted-foreground" />
                                                        {loc.city}, {loc.state}
                                                    </div>
                                                )}
                                            </div>
                                            {isEditing && (
                                                <Button onClick={() => removeOnSiteLocation(idx)} variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                                    <Trash2 size={12} />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {formData.profile.jobPreferences.onSiteLocations.length === 0 && !isEditing && <span className="text-sm font-bold opacity-30 font-bold">-</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <DataDisplay label="Notice Period" value={formData.profile.jobPreferences.noticePeriod} isEditing={isEditing}>
                                    <div className="space-y-3">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notice Period</Label>
                                        <select 
                                            value={formData.profile.jobPreferences.noticePeriod}
                                            onChange={(e) => setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, noticePeriod: e.target.value}}})}
                                            className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:ring-1 focus:ring-primary outline-none"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Immediately available">Immediately available</option>
                                            <option value="15 Days or less">15 Days or less</option>
                                            <option value="30 Days">30 Days</option>
                                            <option value="45 Days">45 Days</option>
                                            <option value="2 Months">2 Months</option>
                                            <option value="3 Months">3 Months</option>
                                        </select>
                                    </div>
                                </DataDisplay>

                                <DataDisplay label="Expected Annual Salary" value={formData.profile.jobPreferences.expectedSalary} isEditing={isEditing}>
                                    <div className="space-y-3">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Expected Annual Salary</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">₹</span>
                                            <Input 
                                                placeholder="e.g. 6.5 Lakhs" 
                                                value={formData.profile.jobPreferences.expectedSalary}
                                                onChange={(e) => setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, expectedSalary: e.target.value}}})}
                                                className="pl-7 h-10 text-sm" 
                                            />
                                        </div>
                                    </div>
                                </DataDisplay>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Preferred Remote Locations</Label>
                                    {isEditing && (
                                        <div className="flex gap-2">
                                            <Input 
                                                value={newRemoteLocation}
                                                onChange={(e) => setNewRemoteLocation(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addRemoteLocation()}
                                                placeholder="Add country/region..." 
                                                className="h-9 text-sm" 
                                            />
                                            <Button onClick={addRemoteLocation} size="sm" className="h-9">Add</Button>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {formData.profile.jobPreferences.remoteLocations.map((loc) => (
                                            <Badge key={loc} variant="outline" className="px-3 py-1 text-[10px] rounded-full flex items-center gap-1 font-bold">
                                                <Globe size={10} />
                                                {loc}
                                                {isEditing && <X size={10} className="cursor-pointer" onClick={() => removeRemoteLocation(loc)} />}
                                            </Badge>
                                        ))}
                                        {formData.profile.jobPreferences.remoteLocations.length === 0 && !isEditing && <span className="text-sm font-bold opacity-30">-</span>}
                                    </div>
                                </div>

                                <DataDisplay label="Application Status" value={formData.profile.jobPreferences.startDate} isEditing={isEditing}>
                                    <div className="space-y-3">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Application Status</Label>
                                        <select 
                                            value={formData.profile.jobPreferences.startDate}
                                            onChange={(e) => setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, startDate: e.target.value}}})}
                                            className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:ring-1 focus:ring-primary outline-none"
                                        >
                                            <option value="">Select status...</option>
                                            <option value="Immediately, I am actively applying">Immediately, Active</option>
                                            <option value="Flexible, I am just browsing">Flexible, Passive</option>
                                            <option value="Looking for the right opportunity">Looking for right fit</option>
                                        </select>
                                    </div>
                                </DataDisplay>
                            </div>

                            {/* Visibility */}
                            <div className="p-6 rounded-lg bg-muted/20 border space-y-4">
                                <div className="flex items-center gap-3">
                                    <Eye className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <h4 className="text-sm font-bold">Profile Visibility</h4>
                                        <p className="text-xs text-muted-foreground">Choose who can see your preferences</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { id: 'Everyone', label: 'Everyone', sub: 'Public platform view' },
                                        { id: 'Recruiters', label: 'Recruiters Only', sub: 'Verified hiring agents' }
                                    ].map((opt) => (
                                        <div 
                                            key={opt.id}
                                            onClick={() => {
                                                if (!isEditing) return;
                                                setFormData({...formData, profile: {...formData.profile, jobPreferences: {...formData.profile.jobPreferences, visibility: opt.id}}});
                                            }}
                                            className={`p-4 rounded-md border cursor-pointer transition-all ${
                                                formData.profile.jobPreferences.visibility === opt.id
                                                    ? 'border-primary bg-background shadow-sm'
                                                    : 'border-border bg-muted/5 opacity-70'
                                            } ${!isEditing && 'opacity-100 cursor-default'}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${formData.profile.jobPreferences.visibility === opt.id ? 'border-primary' : 'border-muted-foreground'}`}>
                                                    {formData.profile.jobPreferences.visibility === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                </div>
                                                <span className="font-bold text-xs">{opt.label}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground ml-5">{opt.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Button */}
            {isEditing && (
                <div className="fixed bottom-6 right-6 md:right-12 z-50">
                    <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="h-12 px-8 rounded-full shadow-lg font-bold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Settings;
