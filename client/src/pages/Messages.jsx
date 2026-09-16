import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Send, Search, Circle, Loader2, Smile, Paperclip, X, FileText, Download, Image as ImageIcon, AlertCircle, Sparkles, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '@/context/SocketContext';
import axios from 'axios';

const getOtherParticipant = (participants, currentUserId) => {
  const id = currentUserId?.toString();
  return (
    participants.find(p => {
      const pid = p._id?.toString() || p.id?.toString() || p?.toString();
      return pid !== id;
    }) || participants.find(p => p) || participants[0]
  );
};

const displayName = (participant) =>
  participant?.role === 'admin' ? 'Velaivaaipu Support' : (participant?.name || 'Unknown');

const displayRole = (participant) =>
  participant?.role === 'admin' ? 'Platform Support' : (participant?.role || 'User');

const Messages = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hoveredConv, setHoveredConv] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ['😊', '😂', '👍', '🔥', '❤️', '🙌', '💡', '✅', '🚀', '⭐', '🤝', '🎉'];

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setConversations(data);
        const counts = {};
        data.forEach(c => { if (c.unreadCount > 0) counts[c._id] = c.unreadCount; });
        setUnreadCounts(counts);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Handle selecting conversation from navigation state
  useEffect(() => {
    const targetId = location.state?.conversationId;
    if (targetId && conversations.length > 0) {
      const target = conversations.find(c => c._id === targetId);
      if (target) {
        setActive(target);
        window.history.replaceState({}, document.title);
      }
    }
  }, [conversations, location.state]);

  useEffect(() => {
    if (active) {
      const fetchMessages = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/messages/${active._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessages(Array.isArray(res.data) ? res.data : []);
          
          if (socket) {
            socket.emit('join_room', active._id);
          }
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };
      fetchMessages();
    }
  }, [active, socket]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', (data) => {
        const currentUserId = user?._id || user?.id;
        if (active && data.roomId === active._id) {
          if (data.senderId?.toString() === currentUserId?.toString()) return;
          setMessages(prev => [...prev, {
            _id: Date.now().toString(),
            sender: data.senderId,
            content: data.content,
            attachment: data.attachment || null,
            createdAt: data.timestamp
          }]);
        } else {
          setUnreadCounts(prev => ({
            ...prev,
            [data.roomId]: (prev[data.roomId] || 0) + 1
          }));
        }

        setConversations(prev => (Array.isArray(prev) ? prev : []).map(c =>
          c._id === data.roomId
            ? { ...c, lastMessage: { content: data.content }, updatedAt: data.timestamp }
            : c
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      });

      return () => socket.off('receive_message');
    }
  }, [socket, active]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const selectConversation = (c) => {
    setActive(c);
    setUnreadCounts(prev => ({ ...prev, [c._id]: 0 }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if ((!msg.trim() && !selectedFile) || !active) return;

    const content = msg;
    const currentUserId = user?._id || user?.id;
    let attachment = null;

    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/messages/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        attachment = res.data;
      } catch (err) {
        console.error('Upload error:', err);
        setUploading(false);
        return;
      }
    }

    setMessages(prev => [...prev, {
      _id: `temp-${Date.now()}`,
      sender: currentUserId,
      content,
      attachment,
      createdAt: new Date().toISOString()
    }]);

    setMsg('');
    setSelectedFile(null);
    setUploading(false);
    setShowEmojis(false);

    const messageData = {
      roomId: active._id,
      content,
      attachment,
      senderId: currentUserId,
      timestamp: new Date()
    };

    if (socket) {
      socket.emit('send_message', messageData);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/messages`, {
        conversationId: active._id,
        content,
        attachment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-[65vh] flex items-center justify-center bg-white rounded-none border border-[#e8e8e8]">
        <Loader2 className="text-blue-500 animate-spin" size={32} />
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-0" style={{ height: 'calc(100vh - 4.5rem)' }}>
      {user.role === 'jobseeker' && (() => {
        const limit = user?.subscription?.messageRecruitersCount ?? 0;
        const used = user?.messagesUsed ?? 0;
        const unlimited = limit === 0;
        if (unlimited) return null;
        const remaining = Math.max(0, limit - used);
        const atLimit = remaining === 0;
        return (
          <div className={`mb-4 shrink-0 flex items-center justify-between gap-3 px-4 py-3 rounded border text-xs font-medium ${
            atLimit
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={13} className="shrink-0" />
              {atLimit
                ? `You've reached your limit of ${limit} recruiter conversation${limit > 1 ? 's' : ''}. Upgrade to message more.`
                : `${remaining} of ${limit} recruiter conversation${limit > 1 ? 's' : ''} remaining on your plan.`
              }
            </div>
            {atLimit && (
              <Link to="/candidate/subscription" className="flex items-center gap-1 shrink-0 font-bold hover:underline">
                <Sparkles size={11} /> Upgrade
              </Link>
            )}
          </div>
        );
      })()}

      <div className="rounded-none border border-[#e8e8e8] overflow-hidden bg-white flex-1 min-h-0 flex flex-col">
        <div className="flex h-full flex-row min-h-0">
          {/* Sidebar */}
          <div className="w-80 border-r border-[#e8e8e8] flex flex-col shrink-0 bg-white h-full min-h-0">
            <div className="p-4 border-b border-[#f0f0f0] shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="w-full h-8 pl-9 pr-3 rounded-full bg-slate-100 border border-transparent text-xs outline-none focus:bg-white focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)] transition-all placeholder:text-slate-400" placeholder="Search conversations..." />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 bg-white">
              {!Array.isArray(conversations) || conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400 font-medium">No conversations yet.</p>
                </div>
              ) : (
                conversations.map(c => {
                  const currentUserId = user?._id?.toString() || user?.id?.toString();
                  const recipient = getOtherParticipant(c.participants, currentUserId);
                  const rName = displayName(recipient);
                  const rRole = displayRole(recipient);
                  const isActive = active?._id === c._id;
                  return (
                    <button
                      key={c._id}
                      onClick={() => selectConversation(c)}
                      className={`w-full text-left px-4 py-3 border-b border-[#fafafa] transition-all cursor-pointer ${isActive ? 'bg-blue-50/60' : 'hover:bg-slate-50/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                            {recipient?.avatar ? <img src={recipient.avatar} alt={rName} className="w-full h-full object-cover" /> : rName[0]}
                          </div>
                          <Circle size={9} className="absolute bottom-0 right-0 fill-blue-500 text-blue-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs truncate ${unreadCounts[c._id] > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-900'}`}>{rName}</p>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              {unreadCounts[c._id] > 0 && (
                                <span className="min-w-[16px] h-[16px] px-1 bg-blue-500 text-white text-[9px] font-semibold rounded-full flex items-center justify-center leading-none">
                                  {unreadCounts[c._id] > 99 ? '99+' : unreadCounts[c._id]}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-400">
                                {c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                          <p className={`text-[10px] truncate mt-0.5 ${unreadCounts[c._id] > 0 ? 'font-medium text-slate-800' : 'font-normal text-slate-500'}`}>
                            {c.lastMessage?.content || 'Started a conversation'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#f4f7f9] relative">
            {active ? (
              <>
                <div className="p-4 border-b border-[#e8e8e8] flex items-center gap-3 bg-white relative z-10">
                  {(() => {
                    const currentUserId = user?._id?.toString() || user?.id?.toString();
                    const recipient = getOtherParticipant(active.participants, currentUserId);
                    const rName = displayName(recipient);
                    const rRole = displayRole(recipient);
                    return (
                      <>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                          {recipient?.avatar ? <img src={recipient.avatar} alt={rName} className="w-full h-full object-cover" /> : rName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate leading-tight">{rName}</p>
                          <p className="text-[10px] text-slate-400 truncate font-normal mt-0.5 capitalize">{rRole} &bull; Online</p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f0f4f8]">
                  {Array.isArray(messages) && messages.map(m => {
                    const currentUserId = user?._id || user?.id;
                    const isMe = m.sender?.toString() === currentUserId?.toString();
                    return (
                      <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] relative ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`px-3.5 py-2 shadow-sm relative ${
                            isMe
                              ? 'bg-[#e1f3fc] text-[#13496c] border border-[#cbe3f0]/30 rounded-2xl rounded-tr-[4px]'
                              : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-[4px]'
                          }`}>
                            {m.attachment && (
                              <div className="mb-2 overflow-hidden rounded-lg">
                                {m.attachment.fileType?.startsWith('image/') ? (
                                  <img 
                                    src={`${import.meta.env.VITE_API_DOMAIN}${m.attachment.url}`} 
                                    alt={m.attachment.name} 
                                    className="max-w-full h-auto max-h-60 object-cover cursor-pointer"
                                    onClick={() => window.open(`${import.meta.env.VITE_API_DOMAIN}${m.attachment.url}`, '_blank')}
                                  />
                                ) : (
                                  <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${isMe ? 'bg-[#d2ebf9] border-[#cbe3f0]' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className={`w-8 h-8 rounded flex items-center justify-center ${isMe ? 'bg-[#2f8ccb]' : 'bg-white shadow-sm'}`}>
                                      <FileText size={16} className={isMe ? 'text-white' : 'text-slate-400'} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-[10px] font-semibold truncate ${isMe ? 'text-[#13496c]' : 'text-slate-900'}`}>{m.attachment.name}</p>
                                      <p className={`text-[9px] ${isMe ? 'text-[#558da9]' : 'text-slate-400'}`}>File Attachment</p>
                                    </div>
                                    <a 
                                      href={`${import.meta.env.VITE_API_DOMAIN}${m.attachment.url}`} 
                                      download={m.attachment.name}
                                      className={`w-7 h-7 rounded flex items-center justify-center transition-all ${isMe ? 'bg-[#2f8ccb] hover:bg-[#207cb9]' : 'bg-white hover:bg-slate-50 shadow-sm border border-slate-200'}`}
                                    >
                                      <Download size={12} className={isMe ? 'text-white' : 'text-blue-500'} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            {m.content && <p className="text-xs leading-relaxed whitespace-pre-wrap pr-1">{m.content}</p>}
                            
                            <div className="text-right -mt-0.5 select-none block">
                              <span className={`text-[9px] inline-flex items-center ${isMe ? 'text-[#558da9]' : 'text-slate-400'}`}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isMe && <CheckCheck size={11} className="ml-1 text-blue-500 inline" />}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-3 border-t border-[#e8e8e8] space-y-3 bg-white">
                  {selectedFile && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="w-9 h-9 bg-white rounded flex items-center justify-center border border-slate-200">
                        {selectedFile.type.startsWith('image/') ? <ImageIcon size={18} className="text-blue-500" /> : <FileText size={18} className="text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-900 truncate">{selectedFile.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-tight">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)}
                        className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-all cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-0.5">
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setShowEmojis(!showEmojis)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${showEmojis ? 'bg-blue-50 text-blue-500' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                          <Smile size={18} />
                        </button>
                        {showEmojis && (
                          <div className="absolute bottom-12 left-0 p-2 bg-white rounded shadow-2xl border border-slate-200 grid grid-cols-4 gap-1 z-50 min-w-[160px] animate-in slide-in-from-bottom-2">
                            {emojis.map(emoji => (
                              <button 
                                key={emoji} 
                                type="button"
                                onClick={() => { setMsg(prev => prev + emoji); setShowEmojis(false); }}
                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded text-base transition-all cursor-pointer border-none bg-transparent"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        <Paperclip size={18} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect} 
                      />
                    </div>

                    <input
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      className="flex-1 h-9 px-4 rounded-full bg-slate-100 text-xs border border-transparent focus:border-blue-400 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                      placeholder="Write a message..."
                    />
                    <button 
                      type="submit"
                      disabled={(!msg.trim() && !selectedFile) || uploading}
                      className="w-9 h-9 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:bg-blue-300 rounded-full flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer border-none shrink-0"
                    >
                      {uploading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/10">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle size={32} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Select a conversation</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Choose someone to start chatting with.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
