import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Users, Plus, MessageCircle, FileText, StickyNote, Mic, 
  Calendar, Settings, Send, Paperclip, Smile, MoreVertical,
  Search, Hash, UserPlus, Clock, X, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─── Components ──────────────────────────────────────────────────────────────

const GroupSidebar = ({ groups, activeGroup, onSelectGroup, onCreateGroup }) => (
  <div className="w-72 border-r border-slate-100 flex flex-col h-full bg-slate-50/30">
    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
        <Users size={16} className="text-emerald-600" />
        Collaboration
      </h3>
      <button 
        onClick={onCreateGroup}
        className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
      >
        <Plus size={18} />
      </button>
    </div>
    
    <div className="p-4">
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search groups..." 
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-400 transition-all"
        />
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">My Groups</p>
        {groups.map(group => (
          <button
            key={group._id}
            onClick={() => onSelectGroup(group)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
              ${activeGroup?._id === group._id 
                ? 'bg-emerald-50 text-emerald-700 font-bold' 
                : 'text-slate-500 hover:bg-white hover:shadow-sm'
              }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
              ${activeGroup?._id === group._id ? 'bg-white shadow-sm' : 'bg-slate-100'}
            `}>
              {group.avatar ? (
                <img src={group.avatar} className="w-full h-full object-cover rounded-lg" alt="" />
              ) : (
                group.name[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs truncate">{group.name}</p>
              <p className="text-[10px] font-medium opacity-60 truncate">
                {group.lastMessage?.content || 'No messages yet'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const ChatHeader = ({ group, onShowMembers, onScheduleCall, onAction }) => (
  <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shadow-sm relative z-10">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
        <Hash size={20} className="text-emerald-600" />
      </div>
      <div>
        <h4 className="font-bold text-slate-900 text-sm">{group.name}</h4>
        <p className="text-[10px] text-slate-400 font-medium">
          {group.members?.length || 0} members · Active now
        </p>
      </div>
    </div>
    
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onScheduleCall}
        className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl gap-2 h-9"
      >
        <Calendar size={15} />
        <span className="text-[11px] font-bold uppercase tracking-wider">Schedule</span>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onShowMembers}
        className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl gap-2 h-9"
      >
        <UserPlus size={15} />
        <span className="text-[11px] font-bold uppercase tracking-wider">Members</span>
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors outline-none">
            <MoreVertical size={18} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-xl border-slate-100">
          <DropdownMenuItem onClick={() => onAction('clear')} className="rounded-xl text-xs font-bold text-slate-600 gap-2 cursor-pointer focus:bg-slate-50 focus:text-slate-900">
            <Clock size={14} /> Clear Messages
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('settings')} className="rounded-xl text-xs font-bold text-slate-600 gap-2 cursor-pointer focus:bg-slate-50 focus:text-slate-900">
            <Settings size={14} /> Group Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-50" />
          <DropdownMenuItem onClick={() => onAction('delete')} className="rounded-xl text-xs font-bold text-rose-600 gap-2 cursor-pointer focus:bg-rose-50 focus:text-rose-700">
            <Trash2 size={14} /> Delete Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

const MessageList = ({ messages, currentUser, onAction }) => {
  const scrollRef = useRef();
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((msg, i) => {
        const isMe = msg.sender?._id === currentUser?.id || msg.sender === currentUser?.id;
        const showAvatar = i === 0 || messages[i-1].sender?._id !== msg.sender?._id;
        
        return (
          <div key={msg._id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
            {!isMe && (
              <div className="w-8 h-8 shrink-0">
                {showAvatar && (
                  <Avatar className="w-8 h-8 rounded-lg">
                    <AvatarImage src={msg.sender?.avatar} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                      {msg.sender?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
            
            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : ''}`}>
              {showAvatar && !isMe && (
                <p className="text-[10px] font-bold text-slate-400 mb-1.5 ml-1">
                  {msg.sender?.name}
                </p>
              )}
              
              <div className={`p-3.5 rounded-2xl text-sm shadow-sm relative group/msg
                ${isMe 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                }`}
              >
                {msg.type === 'text' && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                {msg.type === 'document' && (
                  <a 
                    href={`${import.meta.env.VITE_API_BASE_URL}${msg.attachment?.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all
                      ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100'}
                    `}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${isMe ? 'bg-white/20' : 'bg-white shadow-sm'}
                    `}>
                      <FileText size={16} className={isMe ? 'text-white' : 'text-emerald-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate">{msg.attachment?.name || 'Attachment'}</p>
                      <p className={`text-[9px] uppercase tracking-wider font-bold opacity-60`}>
                        {(msg.attachment?.name?.split('.').pop() || 'file')}
                      </p>
                    </div>
                  </a>
                )}
                {msg.type === 'sticker' && (
                  <div className="p-1 rounded-xl">
                    <img 
                      src={msg.stickerId} 
                      alt="sticker" 
                      className="w-24 h-24 object-contain drop-shadow-md"
                      onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/5021/5021430.png'; }}
                    />
                  </div>
                )}
                {msg.type === 'voice' && (
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <Mic size={16} />
                    <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-white" />
                    </div>
                    <p className="text-[10px] font-bold">0:12</p>
                  </div>
                )}

                {/* Single Message Delete Button */}
                {(isMe || currentUser?.role === 'admin') && (
                  <button 
                    onClick={() => onAction('delete_message', msg._id)}
                    className={`absolute -top-2 ${isMe ? '-left-8' : '-right-8'} p-1.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 rounded-lg shadow-sm opacity-0 group-hover/msg:opacity-100 transition-all z-20`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <p className="text-[9px] font-medium text-slate-400 mt-1.5">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ChatInput = ({ onSend, onUpload, onEmoji }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef();
  
  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  return (
    <div className="p-4 bg-white border-t border-slate-100">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <div className="max-w-4xl mx-auto relative bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          className="w-full bg-transparent border-none outline-none text-sm px-3 pt-2 resize-none h-10 max-h-32"
        />
        
        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
            
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  title="Choose emoji"
                >
                  <Smile size={18} />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="p-0 border-none bg-transparent shadow-2xl">
                <EmojiPicker 
                  onEmojiClick={(emojiData) => setText(prev => prev + emojiData.emoji)}
                  width={320}
                  height={400}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button 
            onClick={handleSend}
            disabled={!text.trim()}
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Send size={14} />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Modals ──────────────────────────────────────────────────────────────────

const CreateGroupModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Create New Group</h3>
        <p className="text-sm text-slate-500 mb-6">Give your team a space to collaborate on projects.</p>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Group Name</label>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-emerald-400 transition-all text-sm"
              placeholder="e.g. Hiring Committee"
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl">Cancel</Button>
            <Button 
              onClick={() => { onCreate(name); setName(''); onClose(); }} 
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={!name.trim()}
            >
              Create Group
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScheduleCallModal = ({ isOpen, onClose, onSchedule }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Schedule Team Call</h3>
        <p className="text-sm text-slate-500 mb-6">Coordinate with your team for a sync-up.</p>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Call Title</label>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none focus:border-emerald-400 text-sm"
              placeholder="e.g. Weekly Sync"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Date</label>
              <input 
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none focus:border-emerald-400 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Time</label>
              <input 
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none focus:border-emerald-400 text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl">Cancel</Button>
            <Button 
              onClick={() => { onSchedule({ title, date, time }); onClose(); }} 
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={!title || !date || !time}
            >
              Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MembersModal = ({ isOpen, onClose, group, onAddMember }) => {
  const [email, setEmail] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Group Members</h3>
        <p className="text-sm text-slate-500 mb-6">Add colleagues to {group?.name}.</p>
        
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
            {group?.members?.map(member => (
              <div key={member._id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <Avatar className="w-8 h-8 rounded-lg">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 text-[10px] font-bold">
                    {member.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{member.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold uppercase">
                  {typeof member.role === 'object' ? member.role?.name : member.role || 'Member'}
                </Badge>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Add Member by Email</label>
            <div className="flex gap-2">
              <input 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 h-11 px-4 rounded-xl border border-slate-200 outline-none focus:border-emerald-400 text-sm"
                placeholder="colleague@company.com"
              />
              <Button 
                onClick={() => { onAddMember(email); setEmail(''); }}
                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                disabled={!email.trim()}
              >
                Add
              </Button>
            </div>
          </div>
          
          <Button variant="outline" onClick={onClose} className="w-full h-12 rounded-xl mt-4">Close</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TeamCollaboration = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (activeGroup) {
      fetchMessages(activeGroup._id);
      if (socket) {
        socket.emit('join_group', activeGroup._id);
      }
    }
  }, [activeGroup, socket]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_group_message', (message) => {
        console.log('Received message:', message);
        if (activeGroup && String(message.collaborationGroup) === String(activeGroup._id)) {
          setMessages(prev => [...prev, message]);
        }
        // Update groups list to show last message
        setGroups(prev => prev.map(g => 
          g._id === message.collaborationGroup 
            ? { ...g, lastMessage: message } 
            : g
        ));
      });
      socket.on('message_deleted', (messageId) => {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      });

      return () => {
        socket.off('receive_group_message');
        socket.off('message_deleted');
      };
    }
  }, [socket, activeGroup]);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/collaboration/groups`, { headers });
      setGroups(res.data);
      if (res.data.length > 0) setActiveGroup(res.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (groupId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/collaboration/groups/${groupId}/messages`, { headers });
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (name) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collaboration/groups`, { name }, { headers });
      setGroups(prev => [res.data, ...prev]);
      setActiveGroup(res.data);
      toast.success('Group created successfully');
    } catch (err) {
      toast.error('Failed to create group');
    }
  };

  const handleSendMessage = async (content) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collaboration/messages`, {
        groupId: activeGroup._id,
        content,
        type: 'text'
      }, { headers });
      
      // Optimistic update if socket didn't handle it already
      setMessages(prev => {
        if (prev.some(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      
      console.log('Message sent:', res.data);
    } catch (err) {
      console.error('Send message error:', err);
      toast.error('Failed to send message');
    }
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/messages/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collaboration/messages`, {
        groupId: activeGroup._id,
        type: 'document',
        attachment: {
          url: uploadRes.data.url,
          name: uploadRes.data.name,
          fileType: uploadRes.data.type
        }
      }, { headers });
      toast.success('File shared');
    } catch (err) {
      toast.error('Failed to upload file');
    }
  };

  const handleSticker = async (stickerUrl) => {
    // Stickers removed as per user request
  };

  const handleAddMember = async (email) => {
    try {
      // Find user by email (we need a search user endpoint or just use the team invite logic)
      // For now, let's assume we add them by email.
      // Actually, my backend expects memberIds. I'll need a search endpoint.
      const searchRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user/search?email=${email}`, { headers });
      if (!searchRes.data) return toast.error('User not found');
      
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collaboration/groups/${activeGroup._id}/members`, {
        memberIds: [searchRes.data._id]
      }, { headers });
      
      toast.success('Member added');
      fetchGroups(); // Refresh group info
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add member');
    }
  };

  const handleScheduleCall = async (data) => {
    try {
      const startTime = new Date(`${data.date}T${data.time}`);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collaboration/calls/schedule`, {
        groupId: activeGroup._id,
        title: data.title,
        startTime
      }, { headers });
      
      toast.success('Call scheduled');
      // Optionally send a message about the scheduled call
      const formattedDate = startTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const formattedTime = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      handleSendMessage(`📅 Scheduled a new call: ${data.title} for ${formattedDate} ${formattedTime}`);
    } catch (err) {
      toast.error('Failed to schedule call');
    }
  };

  const handleGroupAction = async (action) => {
    if (action === 'delete') {
      if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/collaboration/groups/${activeGroup._id}`, { headers });
        toast.success('Group deleted');
        setGroups(prev => prev.filter(g => g._id !== activeGroup._id));
        setActiveGroup(null);
      } catch (err) {
        toast.error('Failed to delete group');
      }
    } else if (action === 'clear') {
      if (!window.confirm('Clear all messages in this group?')) return;
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/collaboration/groups/${activeGroup._id}/messages`, { headers });
        setMessages([]);
        toast.success('Messages cleared');
      } catch (err) {
        toast.error('Failed to clear messages');
      }
    } else if (action === 'settings') {
      toast.info('Group settings coming soon');
    } else if (action === 'delete_message') {
      const messageId = arguments[1];
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/collaboration/messages/${messageId}`, { headers });
        setMessages(prev => prev.filter(m => m._id !== messageId));
        toast.success('Message deleted');
      } catch (err) {
        toast.error('Failed to delete message');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <FeatureGate
      featureKey="hasTeamCollaboration"
      featureName="Team Collaboration"
      description="Create groups, share documents, stickers, voice messages, and schedule team calls."
      subscriptionPath="/company/subscription"
    >
      <div className="flex h-[calc(100vh-140px)] bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-2xl shadow-emerald-900/5">
        <GroupSidebar 
          groups={groups} 
          activeGroup={activeGroup} 
          onSelectGroup={setActiveGroup}
          onCreateGroup={() => setIsCreateModalOpen(true)}
        />
        
        <div className="flex-1 flex flex-col bg-white">
          {activeGroup ? (
            <>
              <ChatHeader 
                group={activeGroup} 
                onShowMembers={() => setIsMembersModalOpen(true)}
                onScheduleCall={() => setIsScheduleModalOpen(true)}
                onAction={handleGroupAction}
              />
              <MessageList messages={messages} currentUser={user} onAction={handleGroupAction} />
              <ChatInput 
                onSend={handleSendMessage}
                onUpload={handleUpload}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6 border border-slate-100">
                <Users size={32} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No active group</h3>
              <p className="text-sm text-slate-500 max-w-xs mb-8">
                Select a group from the sidebar or create a new one to start collaborating with your team.
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
              >
                Create First Group
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreate={handleCreateGroup}
      />

      <ScheduleCallModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        onSchedule={handleScheduleCall}
      />

      <MembersModal 
        isOpen={isMembersModalOpen} 
        onClose={() => setIsMembersModalOpen(false)} 
        group={activeGroup}
        onAddMember={handleAddMember}
      />
    </FeatureGate>
  );
};

export default TeamCollaboration;
