import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const MeetingRoom = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white shadow-md">
        <div>
          <h2 className="text-sm font-bold">Velaivaaipu Meeting Room</h2>
          <p className="text-xs text-slate-400">Meeting ID: {id}</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-bold text-white transition-colors"
        >
          End & Close
        </button>
      </div>
      <div className="flex-1 bg-black">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={`velaivaaipu-interview-${id}`}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableModeratorIndicator: true,
            enableEmailInStats: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
          }}
          userInfo={{
            displayName: user?.name || "Participant"
          }}
          getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; iframeRef.style.width = '100%'; }}
          spinner={() => <div className="flex items-center justify-center h-full text-white"><Loader2 className="animate-spin" size={32} /></div>}
        />
      </div>
    </div>
  );
};

export default MeetingRoom;
