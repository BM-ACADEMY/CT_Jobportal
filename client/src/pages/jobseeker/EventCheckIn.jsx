import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle } from 'lucide-react';
const API=import.meta.env.VITE_API_BASE_URL;
export default function EventCheckIn(){const{token}=useParams();const[state,setState]=useState({loading:true,msg:''});useEffect(()=>{axios.post(`${API}/college/me/event-checkin/${token}`,{},{headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}}).then(r=>setState({loading:false,msg:r.data.msg,ok:true})).catch(e=>setState({loading:false,msg:e.response?.data?.msg||'Check-in failed',ok:false}));},[token]);return <div className="min-h-[70vh] grid place-items-center"><div className="bg-white border rounded-3xl p-10 text-center max-w-md">{state.loading?<div className="animate-spin h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"/>:state.ok?<CheckCircle2 className="mx-auto text-emerald-600" size={52}/>:<XCircle className="mx-auto text-red-500" size={52}/>}<h1 className="font-black text-xl mt-4">{state.loading?'Recording attendance…':state.msg}</h1></div></div>}
