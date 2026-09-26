import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Plus, X, Upload, FileText, CheckCircle2, Loader2,
  Save, Trash2, LayoutGrid, Clock, Target, Eye, EyeOff, Globe, MapPinned, Settings2, Download, BadgeCheck,
  XCircle, AlertCircle, Building2, Camera, Edit2, Star, ExternalLink, FileUp, Sparkles, FolderArchive, File, Check, Layers
} from 'lucide-react';
import { Button, Input, Tag as Badge, Card, Tabs as AntdTabs, Progress } from 'antd';

// Shadcn wrappers to minimize massive code rewrites
const Label = ({ className, children, ...props }) => <label className={`inline-block ${className}`} {...props}>{children}</label>;
const CardHeader = ({ className, children }) => <div className={className}>{children}</div>;
const CardContent = ({ className, children }) => <div className={className}>{children}</div>;
const CardTitle = ({ className, children }) => <h4 className={`!m-0 text-inherit ${className}`}>{children}</h4>;
const CardDescription = ({ className, children }) => <span className={className}>{children}</span>;

// --- Ant Design Tabs Migration Wrappers ---
const TabsList = () => null;
const TabsTrigger = () => null;
const TabsContent = () => null;

const Tabs = ({ defaultValue, children, className }) => {
  const childrenArray = React.Children.toArray(children);
  
  // Find the TabsList component
  const tabsList = childrenArray.find(c => c.type === TabsList || c.type?.name === 'TabsList');
  // Find all TabsContent components
  const tabContents = childrenArray.filter(c => c.type === TabsContent || c.type?.name === 'TabsContent');
  
  if (!tabsList) return <AntdTabs className={className} />;
  
  const triggers = React.Children.toArray(tabsList.props.children);
  
  const items = triggers.map(trigger => {
    const value = trigger.props.value;
    const content = tabContents.find(c => c.props.value === value);
    return {
      key: value,
      label: <div className="flex items-center gap-2">{trigger.props.children}</div>,
      children: content ? <div className={content.props.className}>{content.props.children}</div> : null,
    };
  });

  return (
    <AntdTabs 
      defaultActiveKey={defaultValue} 
      className={className} 
      items={items} 
    />
  );
};
// -------------------------------------------

import { toast } from "sonner";
import ImageCropperModal from "@/components/shared/ImageCropperModal";
import PhoneNumberInput from "@/components/shared/PhoneNumberInput";
import PageSOPBanner from '@/components/common/PageSOPBanner';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const API_USER_URL = `${import.meta.env.VITE_API_BASE_URL}/user`;
const API_COLLEGE_URL = `${import.meta.env.VITE_API_BASE_URL}/college`;
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

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
            <Label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1">{label}</Label>
            <div className="flex items-center gap-3 mt-1">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 group-hover:bg-emerald-50 transition-colors">
                    {Icon && <Icon size={16} className="text-slate-500" />}
                </div>
                <span className="text-[15px] font-bold text-slate-900 flex-1 flex items-center flex-wrap gap-2">
                    {value || <span className="text-slate-400 font-medium italic">Not specified</span>}
                </span>
            </div>
        </div>
    );
};

const Settings = () => {
    const { user, updateUser, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, type: null, aspectRatio: 1 });

    // Asset Repository states
    const [isAddDocsModalOpen, setIsAddDocsModalOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [uploadingDocs, setUploadingDocs] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [renameModal, setRenameModal] = useState({ isOpen: false, docId: null, currentName: '', newName: '' });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, doc: null });
    const [isDragging, setIsDragging] = useState(false);

    let isPriority = false;
    const plan = user?.subscription;
    if (plan && plan.hasPriorityBadge) {
        isPriority = true;
    } else if (plan && Array.isArray(plan.features)) {
        if (plan.features.some(f => f.isActive && (f.name?.toLowerCase() === 'priority badge' || f.name?.toLowerCase() === 'priority application badge'))) {
            isPriority = true;
        }
    }
    if (!isPriority && Array.isArray(user?.purchasedFeatures)) {
        if (user.purchasedFeatures.some(f => f.isActive && f.featureKey === 'hasPriorityBadge' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date()))) {
            isPriority = true;
        }
    }

    // Form states
    const [formData, setFormData] = useState({
        name: user?.name || '',
        avatar: user?.avatar || '',
        coverPic: user?.coverPic || '',
        isPhoneVisible: user?.isPhoneVisible ?? true,
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
            resumeUrl: user?.profile?.resumeUrl || '',
            resumeName: user?.profile?.resumeName || '',
            documents: user?.profile?.documents || [],
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

    // Location Dropdown States
    const [locCountry, setLocCountry] = useState('IN');
    const [locState, setLocState] = useState('');
    const [locCity, setLocCity] = useState('');
    const [geoData, setGeoData] = useState(null);

    // The location dataset is several megabytes; fetch it only when the user
    // actually edits their profile instead of delaying every Settings visit.
    useEffect(() => {
        if (isEditing && !geoData) {
            import('country-state-city').then(setGeoData);
        }
    }, [isEditing, geoData]);

    useEffect(() => {
        if (!isEditing || !geoData) return;
        const { Country, State, City } = geoData;
        
        // When editing starts, try to parse current location
        const currLoc = formData.profile.location || '';
        if (currLoc) {
            const parts = currLoc.split(',').map(s => s.trim());
            // Format expected: "City, State, Country"
            if (parts.length >= 3) {
                const cityName = parts[0];
                const stateName = parts[1];
                const countryName = parts.slice(2).join(', ');
                
                const ctry = Country.getAllCountries().find(c => c.name.toLowerCase() === countryName.toLowerCase());
                if (ctry) {
                    setLocCountry(ctry.isoCode);
                    const st = State.getStatesOfCountry(ctry.isoCode).find(s => s.name.toLowerCase() === stateName.toLowerCase());
                    if (st) {
                        setLocState(st.isoCode);
                        const ct = City.getCitiesOfState(ctry.isoCode, st.isoCode).find(c => c.name.toLowerCase() === cityName.toLowerCase());
                        if (ct) {
                            setLocCity(ct.name);
                        } else {
                            setLocCity(cityName);
                        }
                    }
                }
            } else if (parts.length === 1 && parts[0].toLowerCase() === 'chennai') { // legacy default handling
                setLocCountry('IN');
                const st = State.getStatesOfCountry('IN').find(s => s.name === 'Tamil Nadu');
                if (st) setLocState(st.isoCode);
                setLocCity('Chennai');
            }
        }
    }, [isEditing, geoData]);

    useEffect(() => {
        if (!isEditing || !geoData) return;
        const { Country, State } = geoData;
        let finalStr = '';
        if (locCountry) {
            const countryName = Country.getCountryByCode(locCountry)?.name || '';
            const stateName = locState ? (State.getStateByCodeAndCountry(locState, locCountry)?.name || '') : '';
            const cityName = locCity || '';
            
            const arr = [];
            if (cityName) arr.push(cityName);
            if (stateName) arr.push(stateName);
            if (countryName) arr.push(countryName);
            
            finalStr = arr.join(', ');
        }
        setFormData(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                location: finalStr
            }
        }));
    }, [locCountry, locState, locCity, isEditing, geoData]);

    // Campus / college link state
    const [campusStudent, setCampusStudent] = useState(null);
    const [campusLoading, setCampusLoading] = useState(true);
    const [joinForm, setJoinForm] = useState({ collegeCode: '', rollNumber: '', department: '', batchYear: '', phone: '' });
    const [joiningCollege, setJoiningCollege] = useState(false);
    const [reapplying, setReapplying] = useState(false);
    const [reapplyForm, setReapplyForm] = useState({ rollNumber: '', department: '', batchYear: '', phone: '' });

    // Hidden jobs state
    const [hiddenJobs, setHiddenJobs] = useState([]);
    const [hiddenJobsLoading, setHiddenJobsLoading] = useState(false);

    const fetchHiddenJobs = async () => {
        setHiddenJobsLoading(true);
        try {
            const res = await axios.get(`${API_USER_URL}/hidden-jobs`);
            setHiddenJobs(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setHiddenJobsLoading(false);
        }
    };

    const handleUnhideJob = async (jobId) => {
        try {
            await axios.post(`${API_USER_URL}/hide-job/${jobId}`);
            setHiddenJobs(prev => prev.filter(job => job._id !== jobId));
            toast.success('Job unhidden successfully');
        } catch (err) {
            toast.error('Failed to unhide job');
        }
    };

    useEffect(() => {
        fetchHiddenJobs();
    }, []);

    const fetchCampusStudent = async () => {
        setCampusLoading(true);
        try {
            const res = await axios.get(`${API_COLLEGE_URL}/me/student`);
            setCampusStudent(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setCampusLoading(false);
        }
    };

    useEffect(() => { fetchCampusStudent(); }, []);

    useEffect(() => {
        if (campusStudent?.idVerification?.status === 'rejected') {
            setReapplyForm({
                rollNumber: campusStudent.rollNumber || '',
                department: campusStudent.department || '',
                batchYear: campusStudent.batchYear || '',
                phone: campusStudent.phone || '',
            });
        }
    }, [campusStudent]);

    const handleJoinCollege = async (e) => {
        e.preventDefault();
        const { collegeCode, rollNumber, department, batchYear, phone } = joinForm;
        if (!collegeCode.trim() || !rollNumber.trim() || !department.trim() || !batchYear || !phone.trim()) {
            return toast.error('Please fill in college code, roll number, department, batch year, and phone number');
        }
        setJoiningCollege(true);
        try {
            const res = await axios.post(`${API_COLLEGE_URL}/me/join`, {
                collegeCode: collegeCode.trim(),
                rollNumber: rollNumber.trim(),
                department: department.trim(),
                batchYear: parseInt(batchYear),
                phone: phone.trim(),
            });
            toast.success(res.data.msg || 'Join request sent');
            setJoinForm({ collegeCode: '', rollNumber: '', department: '', batchYear: '', phone: '' });
            fetchCampusStudent();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to join college');
        } finally {
            setJoiningCollege(false);
        }
    };

    const handleReapply = async (e) => {
        e.preventDefault();
        if (!campusStudent?.college?.code) return toast.error('Missing college code');
        const { rollNumber, department, batchYear, phone } = reapplyForm;
        if (!rollNumber.trim() || !department.trim() || !batchYear || !phone.trim()) {
            return toast.error('Please fill in roll number, department, batch year, and phone number');
        }
        setReapplying(true);
        try {
            const res = await axios.post(`${API_COLLEGE_URL}/me/join`, {
                collegeCode: campusStudent.college.code,
                rollNumber: rollNumber.trim(),
                department: department.trim(),
                batchYear: parseInt(batchYear),
                phone: phone.trim(),
            });
            toast.success(res.data.msg || 'Re-submitted your join request');
            fetchCampusStudent();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to re-apply');
        } finally {
            setReapplying(false);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData({
                name: user?.name || '',
                avatar: user?.avatar || '',
                coverPic: user?.coverPic || '',
                isPhoneVisible: user?.isPhoneVisible ?? true,
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
                    resumeUrl: user?.profile?.resumeUrl || '',
                    resumeName: user?.profile?.resumeName || '',
                    documents: user?.profile?.documents || [],
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
        }
    }, [user]);

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
            avatar: user?.avatar || '',
            coverPic: user?.coverPic || '',
            isPhoneVisible: user?.isPhoneVisible ?? true,
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
                resumeUrl: user?.profile?.resumeUrl || '',
                resumeName: user?.profile?.resumeName || '',
                documents: user?.profile?.documents || [],
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

    const handleImageSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            setCropModal({
                isOpen: true,
                imageSrc: reader.result,
                type: type,
                aspectRatio: type === 'coverPic' ? 21 / 9 : 1
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropComplete = async (croppedBlob) => {
        const { type } = cropModal;
        setCropModal({ isOpen: false, imageSrc: null, type: null, aspectRatio: 1 });
        
        const uploadData = new FormData();
        uploadData.append('image', croppedBlob, `${type}.jpg`);
        
        try {
            const res = await axios.post(`${API_USER_URL}/upload-image?type=${type === 'coverPic' ? 'cover' : 'profile'}`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const cacheBustedUrl = `${res.data.imageUrl}?t=${new Date().getTime()}`;
            setFormData(prev => ({
                ...prev,
                [type]: cacheBustedUrl
            }));
            await refreshUser();
            toast.success("Image updated successfully");
        } catch (err) {
            console.error(err);
            toast.error("Image upload failed");
        }
    };

    // Helper: format file sizes
    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return 'Unknown size';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Helper: clean document name from file name
    const cleanDocName = (filename) => {
        if (!filename) return '';
        const withoutExt = filename.replace(/\.[^/.]+$/, '');
        return withoutExt.replace(/[_-]+/g, ' ').trim();
    };

    // Helper: determine badge colors by file type
    const getDocBadgeInfo = (filename = '', fileType = '') => {
        const lower = (filename || fileType).toLowerCase();
        if (lower.endsWith('.pdf') || lower.includes('pdf')) {
            return { label: 'PDF', bg: 'bg-rose-50 text-rose-600 border-rose-200' };
        }
        if (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.includes('word') || lower.includes('document')) {
            return { label: 'DOC', bg: 'bg-blue-50 text-blue-600 border-blue-200' };
        }
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.includes('image')) {
            return { label: 'IMG', bg: 'bg-purple-50 text-purple-600 border-purple-200' };
        }
        return { label: 'DOC', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    };

    // Download any document
    const handleDownloadDoc = async (doc) => {
        const targetUrl = doc?.fileUrl || user?.profile?.resumeUrl;
        if (!targetUrl) {
            toast.error("Document link unavailable");
            return;
        }
        try {
            const url = targetUrl.startsWith('http')
                ? targetUrl
                : `${API_DOMAIN}${targetUrl}`;
            const ext = doc.fileName?.includes('.') ? '.' + doc.fileName.split('.').pop() : '.pdf';
            const baseTitle = doc.name || doc.fileName || 'Document';
            const downloadFilename = baseTitle.endsWith(ext) ? baseTitle : `${baseTitle}${ext}`;
            
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = downloadFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch {
            toast.error("Failed to download document");
        }
    };

    const handleResumeDownload = async () => {
        if (!user?.profile?.resumeUrl) return;
        handleDownloadDoc({
            fileUrl: user.profile.resumeUrl,
            name: user.profile.resumeName || 'Resume',
            fileName: user.profile.resumeName || 'Resume.pdf'
        });
    };

    // Add files to upload staging list
    const handleFilesSelected = (fileList) => {
        if (!fileList || fileList.length === 0) return;
        const newItems = Array.from(fileList).map(file => ({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            name: cleanDocName(file.name),
            isPrimary: false
        }));
        setPendingFiles(prev => [...prev, ...newItems]);
    };

    const updatePendingName = (id, newName) => {
        setPendingFiles(prev => prev.map(item => item.id === id ? { ...item, name: newName } : item));
    };

    const togglePendingPrimary = (id) => {
        setPendingFiles(prev => prev.map(item => ({
            ...item,
            isPrimary: item.id === id ? !item.isPrimary : false
        })));
    };

    const removePendingFile = (id) => {
        setPendingFiles(prev => prev.filter(item => item.id !== id));
    };

    // Upload all staged documents with their respective names
    const handleUploadAllDocuments = async () => {
        if (pendingFiles.length === 0) {
            toast.error("Please select at least one document");
            return;
        }

        const emptyNameItem = pendingFiles.find(item => !item.name || !item.name.trim());
        if (emptyNameItem) {
            toast.error("Please assign a name to each document");
            return;
        }

        setUploadingDocs(true);
        try {
            const uploadData = new FormData();
            const names = [];
            pendingFiles.forEach(item => {
                uploadData.append('documents', item.file);
                names.push(item.name.trim());
            });
            uploadData.append('names', JSON.stringify(names));

            const primaryIdx = pendingFiles.findIndex(item => item.isPrimary);
            if (primaryIdx !== -1) {
                uploadData.append('primaryIndex', primaryIdx);
            }

            const res = await axios.post(`${API_USER_URL}/documents`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            updateUser({
                profile: {
                    ...user.profile,
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl,
                    resumeName: res.data.resumeName,
                    profileCompletion: res.data.profileCompletion
                }
            });

            setFormData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl,
                    resumeName: res.data.resumeName
                }
            }));

            setPendingFiles([]);
            setIsAddDocsModalOpen(false);
            toast.success(res.data.msg || "Documents added to Asset Repository");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Document upload failed");
        } finally {
            setUploadingDocs(false);
        }
    };

    // Set document as primary resume
    const handleSetPrimaryDocument = async (doc) => {
        if (doc._id === 'primary-resume' || doc.isPrimary) return;
        setActionLoading(doc._id);
        try {
            const res = await axios.put(`${API_USER_URL}/documents/${doc._id}`, { isPrimary: true });
            updateUser({
                profile: {
                    ...user.profile,
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl,
                    resumeName: res.data.resumeName,
                    profileCompletion: res.data.profileCompletion
                }
            });
            setFormData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl,
                    resumeName: res.data.resumeName
                }
            }));
            toast.success(`"${doc.name}" marked as primary resume`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to update primary document");
        } finally {
            setActionLoading(null);
        }
    };

    // Rename a document
    const handleSaveRename = async () => {
        if (!renameModal.docId || !renameModal.newName.trim()) {
            toast.error("Please provide a valid document name");
            return;
        }
        setActionLoading(renameModal.docId);
        try {
            const res = await axios.put(`${API_USER_URL}/documents/${renameModal.docId}`, {
                name: renameModal.newName.trim()
            });
            updateUser({
                profile: {
                    ...user.profile,
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl,
                    resumeName: res.data.resumeName,
                    profileCompletion: res.data.profileCompletion
                }
            });
            setFormData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl,
                    resumeName: res.data.resumeName
                }
            }));
            setRenameModal({ isOpen: false, docId: null, currentName: '', newName: '' });
            toast.success("Document renamed successfully");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to rename document");
        } finally {
            setActionLoading(null);
        }
    };

    // Delete a document
    const handleConfirmDelete = async () => {
        const doc = deleteModal.doc;
        if (!doc) return;
        setDeleteModal({ isOpen: false, doc: null });

        if (doc._id === 'primary-resume') {
            try {
                const res = await axios.put(`${API_USER_URL}/profile`, {
                    profile: {
                        ...formData.profile,
                        resumeUrl: '',
                        resumeName: '',
                        documents: []
                    }
                });
                updateUser(res.data.user);
                setFormData(prev => ({
                    ...prev,
                    profile: {
                        ...prev.profile,
                        resumeUrl: '',
                        resumeName: '',
                        documents: []
                    }
                }));
                toast.success("Document removed from repository");
            } catch (err) {
                console.error(err);
                toast.error("Failed to delete document");
            }
            return;
        }

        setActionLoading(doc._id);
        try {
            const res = await axios.delete(`${API_USER_URL}/documents/${doc._id}`);
            updateUser({
                profile: {
                    ...user.profile,
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl,
                    resumeName: res.data.resumeName,
                    profileCompletion: res.data.profileCompletion
                }
            });
            setFormData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl,
                    resumeName: res.data.resumeName
                }
            }));
            toast.success(res.data.msg || "Document removed");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to delete document");
        } finally {
            setActionLoading(null);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('documents', file);
        uploadData.append('names', JSON.stringify([cleanDocName(file.name)]));

        setUploading(true);
        try {
            const res = await axios.post(`${API_USER_URL}/documents`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser({ 
                profile: { 
                    ...user.profile, 
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl, 
                    resumeName: res.data.resumeName,
                    profileCompletion: res.data.profileCompletion
                } 
            });
            setFormData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    documents: res.data.documents,
                    resumeUrl: res.data.resumeUrl,
                    resumeName: res.data.resumeName
                }
            }));
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
                experience: [...formData.profile.experience, { company: '', role: '', location: '', duration: '', description: '' }]
            }
        });
    };

    const addQualification = () => {
        setFormData({
            ...formData,
            profile: {
                ...formData.profile,
                qualification: [...formData.profile.qualification, { degree: '', institution: '', year: '', startYear: '', endYear: '', currentlyPursuing: false }]
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

    const repositoryDocuments = (formData?.profile?.documents && formData.profile.documents.length > 0)
        ? formData.profile.documents
        : (user?.profile?.documents && user.profile.documents.length > 0)
            ? user.profile.documents
            : (user?.profile?.resumeUrl ? [{
                _id: 'primary-resume',
                name: user.profile.resumeName || 'Primary Resume',
                fileName: user.profile.resumeName || 'Resume.pdf',
                fileUrl: user.profile.resumeUrl,
                fileSize: 0,
                uploadedAt: null,
                isPrimary: true
            }] : []);

    return (
        <div className="max-w-5xl mx-auto space-y-10 py-8 px-4 animate-in fade-in duration-500">
            <PageSOPBanner pageKey="jobseekerSettings" />
            {/* Header Section */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-6 md:p-8 shadow-sm mb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="space-y-2 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <BadgeCheck size={12} /> Candidate Portal
                    </div>
                    <h1 className="text-3xl font-medium text-slate-900 tracking-tight">
                        Profile Intelligence
                    </h1>
                    <p className="text-[15px] text-slate-500 font-medium max-w-xl">
                        Design and manage your professional identity, track your career roadmap, and fine-tune your visibility settings.
                    </p>
                </div>
                <div className="flex items-center gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
                    {isEditing ? (
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button 
                                onClick={handleCancel}
                                className="h-11 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest transition-all flex-1 md:flex-none"
                            >
                                Discard
                            </Button>
                            <Button 
                                type="primary"
                                onClick={handleSave}
                                disabled={loading}
                                className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all border-none flex-1 md:flex-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Commit Changes
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            type="primary"
                            onClick={() => setIsEditing(true)}
                            className="h-11 px-8 w-full md:w-auto rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all border-none"
                        >
                            <Settings2 className="w-4 h-4 mr-2" /> Modify Profile
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 h-auto flex justify-start overflow-x-auto shadow-sm flex-nowrap w-full [&::-webkit-scrollbar]:hidden gap-1">
                    <TabsTrigger value="basic" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent whitespace-nowrap flex-shrink-0">
                        <User className="w-3.5 h-3.5 mr-2" /> Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="academic" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent whitespace-nowrap flex-shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 mr-2" /> Academic
                    </TabsTrigger>
                    <TabsTrigger value="professional" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent whitespace-nowrap flex-shrink-0">
                        <Briefcase className="w-3.5 h-3.5 mr-2" /> Professional
                    </TabsTrigger>
                    <TabsTrigger value="resume" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent whitespace-nowrap flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 mr-2" /> Asset Repository
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent whitespace-nowrap flex-shrink-0">
                        <Settings2 className="w-3.5 h-3.5 mr-2" /> Preferences
                    </TabsTrigger>
                    <TabsTrigger value="campus" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent whitespace-nowrap flex-shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 mr-2" /> Campus
                    </TabsTrigger>
                    <TabsTrigger value="hidden-jobs" className="h-10 px-6 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 data-[state=active]:border-slate-100 border border-transparent whitespace-nowrap flex-shrink-0">
                        <EyeOff className="w-3.5 h-3.5 mr-2" /> Hidden Jobs
                    </TabsTrigger>
                </TabsList>

                {/* ── TAB: BASIC INFO ── */}
                <TabsContent value="basic" className="mt-8 flex flex-col gap-6">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <div className="relative h-48 sm:h-64 bg-slate-100 group">
                            {formData.coverPic ? (
                                !isEditing ? (
                                    <Zoom>
                                        <img 
                                            src={formData.coverPic.startsWith('http') ? formData.coverPic : `${API_DOMAIN}${formData.coverPic}`} 
                                            className="w-full h-48 sm:h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                            alt="Cover" 
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </Zoom>
                                ) : (
                                    <img 
                                        src={formData.coverPic.startsWith('http') ? formData.coverPic : `${API_DOMAIN}${formData.coverPic}`} 
                                        className="w-full h-full object-cover" 
                                        alt="Cover" 
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-emerald-100 to-teal-50" />
                            )}
                                {isEditing && (
                                <label className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 px-3 rounded-xl shadow-sm cursor-pointer hover:bg-white transition-all text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2 border border-slate-200/50 hover:border-emerald-200 hover:text-emerald-600">
                                    <Upload size={14} /> Update Cover
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'coverPic')} />
                                </label>
                            )}
                            <div className="absolute -bottom-12 left-8">
                                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-slate-50 shadow-md overflow-hidden flex items-center justify-center">
                                    {formData.avatar ? (
                                        <img 
                                            src={formData.avatar.startsWith('http') ? formData.avatar : `${API_DOMAIN}${formData.avatar}`} 
                                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover bg-emerald-50" 
                                            alt="Avatar" 
                                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=ecfdf5&color=059669&size=128`; }}
                                        />
                                    ) : (
                                        <User size={48} className="text-slate-300" />
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-slate-50 rounded-full flex items-center justify-center text-slate-600 shadow-md cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-colors z-10 hover:scale-105 active:scale-95">
                                        <Camera size={16} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'avatar')} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <CardHeader className="pt-16 pb-4 border-b border-slate-200">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4 text-emerald-600" /> Identity Foundation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                <DataDisplay 
                                    label="Full Legal Name" 
                                    value={
                                        <div className="flex items-center gap-2">
                                            {formData.name}
                                            {user?.profileVerificationStatus === 'Verified' && <BadgeCheck size={16} className="text-blue-500" title="Verified Profile" />}
                                            {isPriority && <BadgeCheck size={16} className="text-blue-500 fill-blue-50" title="Priority Candidate" />}
                                        </div>
                                    } 
                                    icon={User} 
                                    isEditing={isEditing}
                                >
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

                                <DataDisplay label="Candidate ID (Unique Identifier)" value={user?.display_id || 'Pending Generate'} icon={Target} isEditing={false}>
                                    <div className="space-y-1.5 opacity-60">
                                        <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Candidate ID</Label>
                                        <div className="relative">
                                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                            <Input value={user?.display_id || 'Pending Generate'} disabled className="pl-11 h-11 rounded-xl bg-slate-100 border-slate-200 font-medium text-sm" />
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

                                <DataDisplay 
                                    label="Contact Vector" 
                                    value={
                                        <div className="flex items-center gap-2">
                                            {formData.profile.phone}
                                            {formData.profile.phone && (
                                                <Badge variant="outline" className={`text-[9px] uppercase tracking-widest px-2 py-0 h-5 ${formData.isPhoneVisible ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                                                    {formData.isPhoneVisible ? 'Visible' : 'Hidden'}
                                                </Badge>
                                            )}
                                        </div>
                                    } 
                                    icon={Phone} 
                                    isEditing={isEditing}
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Phone Number</Label>
                                            <div 
                                                className="flex items-center gap-2 cursor-pointer group" 
                                                onClick={() => setFormData({...formData, isPhoneVisible: !formData.isPhoneVisible})}
                                            >
                                                <span className={`text-[9px] uppercase font-bold tracking-widest transition-colors ${formData.isPhoneVisible ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                    {formData.isPhoneVisible ? 'Visible to others' : 'Hidden'}
                                                </span>
                                                <div className={`w-8 h-4 rounded-full transition-colors relative ${formData.isPhoneVisible ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                    <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${formData.isPhoneVisible ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                            </div>
                                        </div>
                                        <PhoneNumberInput
                                            value={formData.profile.phone}
                                            onChange={(phone) => setFormData({...formData, profile: {...formData.profile, phone}})}
                                        />
                                    </div>
                                </DataDisplay>

                                <div className="md:col-span-2">
                                    <DataDisplay label="Current Location" value={formData.profile.location} icon={MapPin} isEditing={isEditing}>
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Current Location (Nationality, State, District)</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="relative">
                                                    <select 
                                                        value={locCountry}
                                                        onChange={(e) => { setLocCountry(e.target.value); setLocState(''); setLocCity(''); }}
                                                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm appearance-none"
                                                    >
                                                        <option value="">Select Nationality</option>
                                                        {geoData?.Country.getAllCountries().map(c => (
                                                            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <select 
                                                        value={locState}
                                                        onChange={(e) => { setLocState(e.target.value); setLocCity(''); }}
                                                        disabled={!locCountry}
                                                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm appearance-none disabled:opacity-50"
                                                    >
                                                        <option value="">Select State</option>
                                                        {locCountry && geoData?.State.getStatesOfCountry(locCountry).map(s => (
                                                            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <select 
                                                        value={locCity}
                                                        onChange={(e) => setLocCity(e.target.value)}
                                                        disabled={!locState}
                                                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm appearance-none disabled:opacity-50"
                                                    >
                                                        <option value="">Select District</option>
                                                        {locState && locCountry && geoData?.City.getCitiesOfState(locCountry, locState).map(c => (
                                                            <option key={c.name} value={c.name}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </DataDisplay>
                                </div>
                            </div>
                            
                            <DataDisplay label="Professional Summary" value={formData.profile.bio} icon={FileText} isEditing={isEditing}>
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
                        <CardHeader className="pb-4 border-b border-slate-200 flex flex-row items-center justify-between p-6">
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
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const newQual = [...formData.profile.qualification];
                                                newQual.splice(idx, 1);
                                                setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                            }}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-50"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <DataDisplay label="Qualification Degree" value={item.degree} isEditing={isEditing} icon={GraduationCap}>
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
                                        <DataDisplay label="Academic Institution" value={item.institution} isEditing={isEditing} icon={Building2}>
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
                                        <DataDisplay label="Start Year" value={item.startYear} isEditing={isEditing} icon={Clock}>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Start Year</Label>
                                                <Input 
                                                    value={item.startYear || ''}
                                                    onChange={(e) => {
                                                        const newQual = [...formData.profile.qualification];
                                                        newQual[idx].startYear = e.target.value;
                                                        setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                                    }}
                                                    className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm focus:border-emerald-300 focus:ring-emerald-100 transition-all" 
                                                />
                                            </div>
                                        </DataDisplay>
                                        <div className="space-y-4">
                                            {isEditing && (
                                                <div className="flex items-center gap-2 mt-1 mb-2">
                                                    <input 
                                                        type="checkbox"
                                                        id={`pursuing-${idx}`}
                                                        checked={item.currentlyPursuing || false}
                                                        onChange={(e) => {
                                                            const newQual = [...formData.profile.qualification];
                                                            newQual[idx].currentlyPursuing = e.target.checked;
                                                            if (e.target.checked) {
                                                                newQual[idx].year = '';
                                                                newQual[idx].endYear = '';
                                                            }
                                                            setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                                        }}
                                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                                                    />
                                                    <Label htmlFor={`pursuing-${idx}`} className="text-sm font-bold text-slate-700 cursor-pointer">Currently Pursuing</Label>
                                                </div>
                                            )}
                                            
                                            {(!item.currentlyPursuing) ? (
                                                <DataDisplay label="Passout Year" value={item.year || item.endYear} isEditing={isEditing} icon={CheckCircle2}>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Passout Year</Label>
                                                        <Input 
                                                            value={item.year || item.endYear || ''}
                                                            onChange={(e) => {
                                                                const newQual = [...formData.profile.qualification];
                                                                newQual[idx].year = e.target.value;
                                                                newQual[idx].endYear = e.target.value;
                                                                setFormData({...formData, profile: {...formData.profile, qualification: newQual}});
                                                            }}
                                                            className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm focus:border-emerald-300 focus:ring-emerald-100 transition-all" 
                                                        />
                                                    </div>
                                                </DataDisplay>
                                            ) : (
                                                !isEditing && (
                                                    <DataDisplay label="Passout Year" value="Currently Pursuing" isEditing={false} icon={Loader2} />
                                                )
                                            )}
                                        </div>
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
                <TabsContent value="professional" className="mt-8 flex flex-col gap-8">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-200 flex flex-row items-center justify-between p-6">
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
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const newExp = [...formData.profile.experience];
                                                newExp.splice(idx, 1);
                                                setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                            }}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-50"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <DataDisplay label="Organization Name" value={item.company} isEditing={isEditing} icon={Building2}>
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
                                            <DataDisplay label="Designation" value={item.role} isEditing={isEditing} icon={Briefcase}>
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
                                            <DataDisplay label="Location" value={item.location} isEditing={isEditing} icon={MapPin}>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Location</Label>
                                                    <Input 
                                                        value={item.location}
                                                        onChange={(e) => {
                                                            const newExp = [...formData.profile.experience];
                                                            newExp[idx].location = e.target.value;
                                                            setFormData({...formData, profile: {...formData.profile, experience: newExp}});
                                                        }}
                                                        className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm focus:border-emerald-300 focus:ring-emerald-100 transition-all" 
                                                    />
                                                </div>
                                            </DataDisplay>
                                            <DataDisplay label="Tenure Period" value={item.duration} isEditing={isEditing} icon={Clock}>
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
                                        <DataDisplay label="Role responsibilities" value={item.description} isEditing={isEditing} icon={FileText}>
                                            <div className="space-y-1.5 h-full">
                                                <Label className="text-[9px] uppercase text-slate-400 font-bold tracking-widest ml-1">Description</Label>
                                                <textarea 
                                                    className="w-full h-full min-h-[180px] p-4 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all resize-none"
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

                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden mt-8">
                        <CardHeader className="pb-4 border-b border-slate-200 p-6">
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
                             <div className="flex flex-wrap gap-2.5 justify-start mt-4">
                                {formData.profile.skills.map((skill) => (
                                    <Badge 
                                        key={skill} 
                                        color="success" 
                                        className="px-3 py-1 text-[12px] rounded-full font-bold m-0"
                                        closable={isEditing}
                                        onClose={(e) => { e.preventDefault(); removeSkill(skill); }}
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: RESUME / ASSET REPOSITORY ── */}
                <TabsContent value="resume" className="mt-8">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/50 via-white to-emerald-50/20">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">
                                            Asset Repository
                                        </CardTitle>
                                        <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">
                                            Manage your resumes, certifications, portfolios, and job application documents with custom titles.
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                    <Layers size={13} className="text-slate-500" />
                                    {repositoryDocuments.length} {repositoryDocuments.length === 1 ? 'Asset' : 'Assets'}
                                </span>
                                <Button 
                                    type="primary"
                                    onClick={() => {
                                        setPendingFiles([]);
                                        setIsAddDocsModalOpen(true);
                                    }}
                                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-sm border-none flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Documents
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 md:p-8">
                            {repositoryDocuments.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3.5">
                                        {repositoryDocuments.map((doc, idx) => {
                                            const badgeInfo = getDocBadgeInfo(doc.fileName || doc.name, doc.fileType);
                                            const isPrimary = Boolean(doc.isPrimary || (user?.profile?.resumeUrl && user.profile.resumeUrl === doc.fileUrl));
                                            const docDownloadUrl = doc.fileUrl?.startsWith('http')
                                                ? doc.fileUrl
                                                : `${API_DOMAIN}${doc.fileUrl}`;
                                            const isActionBusy = actionLoading === doc._id;

                                            return (
                                                <div 
                                                    key={doc._id || idx}
                                                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-emerald-200/80 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                                                >
                                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border ${badgeInfo.bg}`}>
                                                            {badgeInfo.label}
                                                        </div>
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <div className="flex items-center flex-wrap gap-2">
                                                                <h4 className="text-sm font-bold text-slate-900 truncate max-w-md group-hover:text-emerald-700 transition-colors">
                                                                    {doc.name}
                                                                </h4>
                                                                {isPrimary && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                        <Star size={11} className="fill-emerald-600 text-emerald-600" /> Primary Document
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 font-medium">
                                                                {doc.fileName && (
                                                                    <span className="truncate max-w-[220px]" title={doc.fileName}>
                                                                        {doc.fileName}
                                                                    </span>
                                                                )}
                                                                {doc.fileSize > 0 && (
                                                                    <>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span>{formatFileSize(doc.fileSize)}</span>
                                                                    </>
                                                                )}
                                                                {doc.uploadedAt && (
                                                                    <>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span>{new Date(doc.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-9 px-3.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center gap-1.5"
                                                            asChild
                                                        >
                                                            <a href={docDownloadUrl} target="_blank" rel="noreferrer">
                                                                <ExternalLink size={12} /> Review
                                                            </a>
                                                        </Button>

                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleDownloadDoc(doc)}
                                                            className="h-9 px-3.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center gap-1.5"
                                                        >
                                                            <Download size={12} /> Download
                                                        </Button>

                                                        {doc._id !== 'primary-resume' && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => setRenameModal({ isOpen: true, docId: doc._id, currentName: doc.name, newName: doc.name })}
                                                                className="h-9 px-3.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center gap-1.5"
                                                            >
                                                                <Edit2 size={12} /> Rename
                                                            </Button>
                                                        )}

                                                        {!isPrimary && doc._id !== 'primary-resume' && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                disabled={isActionBusy}
                                                                onClick={() => handleSetPrimaryDocument(doc)}
                                                                className="h-9 px-3.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                                                            >
                                                                {isActionBusy ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />} Make Primary
                                                            </Button>
                                                        )}

                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            disabled={isActionBusy}
                                                            onClick={() => setDeleteModal({ isOpen: true, doc })}
                                                            className="h-9 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center gap-1"
                                                            title="Delete document"
                                                        >
                                                            <Trash2 size={13} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Repository Footer Info */}
                                    <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                                            ✓
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                            <span className="font-bold text-slate-800">Application Dispatch Note:</span> The document marked as <strong className="text-emerald-700">Primary Document</strong> will be automatically attached when applying to jobs via Instant 1-Click apply. You can switch the primary document anytime.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-12 md:p-16 flex flex-col items-center justify-center text-center gap-4 hover:border-emerald-300 transition-all bg-slate-50/40">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-xs">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1.5 max-w-md">
                                        <h3 className="text-base font-bold text-slate-900">Your Asset Repository is Empty</h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Upload your resumes, certifications, cover letters, and transcripts. You can upload multiple documents and give a custom name to each.
                                        </p>
                                    </div>
                                    <Button 
                                        type="primary"
                                        onClick={() => {
                                            setPendingFiles([]);
                                            setIsAddDocsModalOpen(true);
                                        }}
                                        className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md border-none flex items-center gap-2 mt-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Documents Now
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: JOB PREFERENCES ── */}
                <TabsContent value="preferences" className="mt-8 flex flex-col gap-6">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-200 p-6">
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
                                        <Badge 
                                            key={title} 
                                            className="px-3 py-1 text-[11px] rounded-full font-bold bg-slate-50 border-slate-100 text-slate-700 m-0"
                                            closable={isEditing}
                                            onClose={(e) => { e.preventDefault(); removeJobTitle(title); }}
                                        >
                                            {title}
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
                                                <button type="button" onClick={() => removeOnSiteLocation(idx)} className="flex items-center justify-center h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {formData.profile.jobPreferences.onSiteLocations.length === 0 && !isEditing && <span className="text-sm font-bold text-slate-300 ml-1">Not specified</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <DataDisplay label="Operational Availability" value={formData.profile.jobPreferences.noticePeriod} icon={Clock} isEditing={isEditing}>
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

                                <DataDisplay label="Compensation Baseline" value={formData.profile.jobPreferences.expectedSalary} icon={Building2} isEditing={isEditing}>
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
                                    <div className="flex flex-wrap gap-2.5 mt-2">
                                        {formData.profile.jobPreferences.remoteLocations.map((loc) => (
                                            <Badge 
                                                key={loc} 
                                                className="px-3 py-1 text-[12px] rounded-full font-bold m-0"
                                                closable={isEditing}
                                                onClose={(e) => { e.preventDefault(); removeRemoteLocation(loc); }}
                                            >
                                                <Globe size={12} className="opacity-70 inline-block mr-1 align-middle mb-[2px]" />
                                                {loc}
                                            </Badge>
                                        ))}
                                        {formData.profile.jobPreferences.remoteLocations.length === 0 && !isEditing && <span className="text-sm font-bold text-slate-300 ml-1">Not specified</span>}
                                    </div>
                                </div>

                                <DataDisplay label="Engagement Readiness" value={formData.profile.jobPreferences.startDate} icon={Target} isEditing={isEditing}>
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

                {/* ── TAB: CAMPUS ── */}
                <TabsContent value="campus" className="mt-8">
                    <Card className="rounded-none border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-200 p-6">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-emerald-600" /> Campus / College Status
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-400">Link your account to multiple college placement portals</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            {campusLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
                            ) : (
                                <>
                                    {Array.isArray(campusStudent) && campusStudent.length > 0 ? (
                                        <div className="space-y-6">
                                            {campusStudent.map((student, idx) => (
                                                <div key={student._id || idx} className="p-6 rounded-none border border-slate-200 bg-slate-50 relative">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <DataDisplay label="College" value={student.college?.name} icon={GraduationCap} isEditing={false} />
                                                        <DataDisplay label="Placement Status" value={student.placementStatus} icon={CheckCircle2} isEditing={false} />
                                                        <DataDisplay label="Registration Source" value={student.registrationSource} icon={FileText} isEditing={false} />
                                                        <DataDisplay 
                                                            label="ID Verification" 
                                                            value={student.idVerification?.status === 'pending' ? 'Awaiting TPO approval' : student.idVerification?.status} 
                                                            icon={BadgeCheck} 
                                                            isEditing={false} 
                                                        />
                                                    </div>
                                                    {student.idVerification?.status === 'rejected' ? (
                                                        <div className="p-6 mt-4 rounded-none bg-red-50 border border-red-100 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <XCircle size={18} className="text-red-500" />
                                                                <h4 className="text-sm font-bold text-slate-900">Join request rejected</h4>
                                                            </div>
                                                            <p className="text-xs text-slate-500">
                                                                Your request to join {student.college?.name || 'this college'} was rejected by the TPO.
                                                                {student.idVerification?.rejectionReason ? ` Reason: "${student.idVerification.rejectionReason}"` : ''}
                                                            </p>
                                                        </div>
                                                    ) : student.idVerification?.status === 'pending' ? (
                                                        <div className="p-4 mt-4 rounded-none bg-amber-50 border border-amber-100 flex items-start gap-3">
                                                            <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                                                            <div>
                                                                <h4 className="text-sm font-bold text-slate-900">Awaiting TPO approval</h4>
                                                                <p className="text-xs text-slate-500 mt-1">Your join request to {student.college?.name} is under review.</p>
                                                            </div>
                                                        </div>
                                                    ) : !student.isActivated ? (
                                                        <div className="p-4 mt-4 rounded-none bg-amber-50 border border-amber-100 flex items-center gap-2 text-xs font-bold text-amber-700">
                                                            <AlertCircle size={16} /> Your profile is approved but not active for {student.college?.name}.
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 mt-4 rounded-none bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-xs font-bold text-emerald-600">
                                                            <CheckCircle2 size={16} /> Active and visible to {student.college?.name}.
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500 font-medium">You are not linked to any colleges yet.</div>
                                    )}

                                    <div className="pt-6 border-t border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Join Another College</h3>
                                        <form onSubmit={handleJoinCollege} className="max-w-md space-y-4">
                                            <p className="text-sm text-slate-500 font-medium">
                                                Enter your details below (ask your TPO for the college code) to send a join request.
                                            </p>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">College Code</Label>
                                                <Input
                                                    value={joinForm.collegeCode}
                                                    onChange={(e) => setJoinForm(p => ({ ...p, collegeCode: e.target.value }))}
                                                    placeholder="e.g. SKCT"
                                                    className="h-11 rounded-none bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Roll Number</Label>
                                                    <Input
                                                        value={joinForm.rollNumber}
                                                        onChange={(e) => setJoinForm(p => ({ ...p, rollNumber: e.target.value }))}
                                                        placeholder="e.g. 21CS045"
                                                        className="h-11 rounded-none bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Department</Label>
                                                    <Input
                                                        value={joinForm.department}
                                                        onChange={(e) => setJoinForm(p => ({ ...p, department: e.target.value }))}
                                                        placeholder="e.g. CSE"
                                                        className="h-11 rounded-none bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Year of Passing / Batch</Label>
                                                    <Input
                                                        type="number"
                                                        value={joinForm.batchYear}
                                                        onChange={(e) => setJoinForm(p => ({ ...p, batchYear: e.target.value }))}
                                                        placeholder="e.g. 2026"
                                                        className="h-11 rounded-none bg-slate-50 border-slate-100 focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold ml-1">Phone Number</Label>
                                                    <PhoneNumberInput value={joinForm.phone} onChange={(phone) => setJoinForm(p => ({ ...p, phone }))} />
                                                </div>
                                            </div>
                                            <Button type="submit" disabled={joiningCollege} className="h-11 px-6 rounded-none bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest">
                                                {joiningCollege ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Send Join Request
                                            </Button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB: HIDDEN JOBS ── */}
                <TabsContent value="hidden-jobs" className="mt-8">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-200 flex flex-row items-center justify-between p-6">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <EyeOff className="w-4 h-4 text-emerald-600" /> Hidden Jobs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {hiddenJobsLoading ? (
                                <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div>
                            ) : hiddenJobs.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 font-medium">No hidden jobs found.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {hiddenJobs.map(job => (
                                        <div key={job._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-3">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                                                    <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">{job.company?.name || 'Unknown Company'}</p>
                                                </div>
                                                <Button 
                                                    onClick={() => handleUnhideJob(job._id)} 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="shrink-0 h-8 text-[10px] uppercase tracking-widest font-bold"
                                                >
                                                    <Eye className="w-3 h-3 mr-1.5" /> Unhide
                                                </Button>
                                            </div>
                                            {job.status !== 'active' && (
                                                <Badge variant="destructive" className="w-fit text-[10px] uppercase">No longer available</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            {/* ── MODAL: ADD MULTIPLE DOCUMENTS WITH NAME FOR EACH ── */}
            {isAddDocsModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-[28px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 md:p-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                                    <FileUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Add Documents to Repository</h3>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5">Select multiple documents and assign a unique title to each</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => {
                                    if (!uploadingDocs) {
                                        setIsAddDocsModalOpen(false);
                                        setPendingFiles([]);
                                    }
                                }}
                                disabled={uploadingDocs}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 md:p-7 overflow-y-auto space-y-6 flex-1">
                            {/* Dropzone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
                                }}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                                    isDragging 
                                        ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60 bg-slate-50/30'
                                }`}
                                onClick={() => document.getElementById('repo-multi-file-input')?.click()}
                            >
                                <input 
                                    id="repo-multi-file-input"
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) handleFilesSelected(e.target.files);
                                        e.target.value = '';
                                    }}
                                />
                                <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shadow-xs mb-3">
                                    <Upload size={22} />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">
                                    Click to browse or drag and drop files here
                                </h4>
                                <p className="text-xs text-slate-400 font-medium mt-1">
                                    PDF, DOC, DOCX, JPG, PNG or WEBP (Max 10MB per file)
                                </p>
                            </div>

                            {/* Staged files with individual document name inputs */}
                            {pendingFiles.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                            <Layers size={13} className="text-emerald-600" />
                                            Selected Documents ({pendingFiles.length})
                                        </span>
                                        <label 
                                            htmlFor="repo-multi-file-input" 
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
                                        >
                                            <Plus size={13} /> Add more files
                                        </label>
                                    </div>

                                    <div className="space-y-3">
                                        {pendingFiles.map((item, idx) => {
                                            const badgeInfo = getDocBadgeInfo(item.file.name, item.file.type);
                                            return (
                                                <div 
                                                    key={item.id}
                                                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs space-y-3 transition-all"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeInfo.bg}`}>
                                                                {badgeInfo.label}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-medium text-slate-500 truncate max-w-xs" title={item.file.name}>
                                                                    {item.file.name}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400">
                                                                    {formatFileSize(item.file.size)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePendingPrimary(item.id)}
                                                                className={`h-7 px-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 transition-all ${
                                                                    item.isPrimary
                                                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                                }`}
                                                                title="Set this as primary resume for applications"
                                                            >
                                                                <Star size={11} className={item.isPrimary ? 'fill-emerald-600 text-emerald-600' : ''} />
                                                                {item.isPrimary ? 'Primary' : 'Make Primary'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => removePendingFile(item.id)}
                                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                title="Remove file"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Document Name input field */}
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                                            Document Title / Name <span className="text-rose-500">*</span>
                                                        </label>
                                                        <Input
                                                            value={item.name}
                                                            onChange={(e) => updatePendingName(item.id, e.target.value)}
                                                            placeholder="e.g. Senior Frontend Resume, Degree Certificate, Recommendation Letter"
                                                            className="h-10 rounded-lg text-xs font-semibold border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 md:p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                            <Button
                                onClick={() => {
                                    setIsAddDocsModalOpen(false);
                                    setPendingFiles([]);
                                }}
                                disabled={uploadingDocs}
                                className="h-10 px-5 rounded-xl border-slate-200 bg-white font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="primary"
                                onClick={handleUploadAllDocuments}
                                disabled={uploadingDocs || pendingFiles.length === 0}
                                className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md border-none flex items-center gap-2"
                            >
                                {uploadingDocs ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload {pendingFiles.length > 0 ? `(${pendingFiles.length}) ` : ''}{pendingFiles.length === 1 ? 'Document' : 'Documents'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: RENAME DOCUMENT ── */}
            {renameModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Edit2 size={15} />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Rename Document</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRenameModal({ isOpen: false, docId: null, currentName: '', newName: '' })}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Document Title
                            </label>
                            <Input
                                value={renameModal.newName}
                                onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                                placeholder="Enter document title..."
                                className="h-10 rounded-xl text-xs font-semibold"
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <Button
                                onClick={() => setRenameModal({ isOpen: false, docId: null, currentName: '', newName: '' })}
                                className="h-9 px-4 rounded-lg border-slate-200 font-bold text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleSaveRename}
                                disabled={actionLoading === renameModal.docId || !renameModal.newName.trim()}
                                className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border-none"
                            >
                                {actionLoading === renameModal.docId ? <Loader2 size={13} className="animate-spin" /> : 'Save Title'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: DELETE CONFIRMATION ── */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Remove Document</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to remove this asset from your repository?</p>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-xs font-bold text-slate-800 truncate">
                                {deleteModal.doc?.name}
                            </p>
                            {deleteModal.doc?.fileName && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                    {deleteModal.doc.fileName}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <Button
                                onClick={() => setDeleteModal({ isOpen: false, doc: null })}
                                className="h-9 px-4 rounded-lg border-slate-200 font-bold text-xs"
                            >
                                Keep Document
                            </Button>
                            <Button
                                onClick={handleConfirmDelete}
                                className="h-9 px-5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border-none"
                            >
                                Delete Asset
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {cropModal.isOpen && (
                <ImageCropperModal
                    imageSrc={cropModal.imageSrc}
                    aspectRatio={cropModal.aspectRatio}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropModal({ isOpen: false, imageSrc: null, type: null, aspectRatio: 1 })}
                />
            )}
        </div>
    );
};

export default Settings;
