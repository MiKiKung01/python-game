import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Briefcase, DollarSign, Clock, Star, Download, Play,
  X, AlertCircle, Loader2, FileCode, MessageSquareQuote,
  User, Activity, Award, CheckCircle, TrendingUp, Search,
  ChevronRight, Upload, Sparkles, Edit3, Check
} from 'lucide-react';

const AVATAR_OPTIONS = ['👨‍💻', '👩‍💻', '🧑‍🔬', '🐱', '🦊', '🐸', '🤖', '🎮'];

export default function JobPlatform({ onAcceptJob, userData, files = [] }) {
  const [activeTab, setActiveTab] = useState('FEED'); 
  
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedMyJob, setSelectedMyJob] = useState(null);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Upload / Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [browseFolderId, setBrowseFolderId] = useState(null);

  // Profile state (localStorage only)
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('game_displayName') || '');
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('game_avatar') || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const profileName = displayName || userData?.username || 'Guest';
  const profileAvatar = selectedAvatar || '';

  useEffect(() => {
    if (activeTab === 'FEED') fetchJobs();
    if (activeTab === 'MY_JOBS') fetchMyActiveJobs();
  }, [activeTab]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/jobs/available');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
      setJobs([]); 
    } finally {
      setLoading(false);
    }
  };

  const fetchMyActiveJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3001/jobs/my-active/${userData.id}`);
      setMyJobs(res.data);
    } catch (err) {
      console.error(err);
      setMyJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProcess = async () => {
    setIsDownloading(true);
    for (let i = 0; i <= 100; i += 10) {
        setDownloadProgress(i);
        await new Promise(r => setTimeout(r, 80));
    }
    try {
        await axios.post('http://localhost:3001/jobs/accept', { 
            jobId: selectedJob.contract_id,
            userId: userData.id 
        });
        setIsDownloading(false);
        setSelectedJob(null);
        setActiveTab('MY_JOBS'); // ไปหน้า My Jobs หลังรับงาน
    } catch (err) {
        alert(err.response?.data?.message || "Failed to accept job.");
        setIsDownloading(false);
        setSelectedJob(null);
    }
  };

  // File browser helpers
  const getBrowseItems = () => {
    return files.filter(f => (f.parentId || null) === browseFolderId);
  };
  const getBrowseBreadcrumb = () => {
    const trail = [{ label: 'This PC', id: null }];
    const buildPath = (fId) => {
      const f = files.find(x => x.id === fId);
      if (!f) return;
      if (f.parentId) buildPath(f.parentId);
      trail.push({ label: f.name, id: f.id });
    };
    if (browseFolderId) buildPath(browseFolderId);
    return trail;
  };

  const handleSubmitJob = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    try {
        await axios.post('http://localhost:3001/jobs/submit', {
            jobId: selectedMyJob.contract_id,
            userId: userData.id,
            fileName: selectedFile.name
        });
        setSubmitSuccess({ reward: selectedMyJob.reward });
        // รอ 2 วินาทีแล้วปิด modal
        setTimeout(() => {
            setSelectedMyJob(null);
            setSelectedFile(null);
            setSubmitSuccess(null);
            setIsSubmitting(false);
            fetchMyActiveJobs(); // refresh
        }, 2500);
    } catch (err) {
        alert(err.response?.data?.error || "Failed to submit job.");
        setIsSubmitting(false);
    }
  };

  // Profile helpers
  const handleSaveDisplayName = () => {
    const name = tempName.trim();
    if (name) {
      setDisplayName(name);
      localStorage.setItem('game_displayName', name);
    }
    setIsEditingName(false);
  };

  const handleSelectAvatar = (emoji) => {
    setSelectedAvatar(emoji);
    localStorage.setItem('game_avatar', emoji);
  };

  const reputation = userData?.reputation || 10;
  const userLevel = reputation < 50 ? 'Junior' : reputation < 200 ? 'Mid-Level' : 'Senior';

  const parseJobData = (reqString) => {
      try {
          return JSON.parse(reqString);
      } catch (e) {
          return {
              clientName: "Anonymous Client",
              clientRole: "Verified User",
              story: "No additional details provided. Please follow the technical requirements.",
              desc: "1. Complete the code.\n2. Pass the tests."
          };
      }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col sm:flex-row font-sans text-slate-800 relative overflow-hidden animate-fade-in">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full sm:w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl z-20">
         <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><Briefcase size={20} className="text-white" /></div>
            <h2 className="font-black text-xl text-white tracking-wide">DevFreelance</h2>
         </div>
         
         <div className="p-6 border-b border-slate-800 bg-slate-800/30">
            <div className="flex items-center gap-4 mb-3">
               {profileAvatar ? (
                 <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-slate-700">
                   {profileAvatar}
                 </div>
               ) : (
                 <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-slate-700">
                   {profileName[0]?.toUpperCase()}
                 </div>
               )}
               <div>
                  <div className="text-white font-bold">{profileName}</div>
                  <div className="text-xs text-blue-400 font-bold">{userLevel} Developer</div>
               </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium bg-slate-900 p-2 rounded-lg border border-slate-700">
                <Star size={14} className="text-yellow-500" />
                <span>Reputation: <span className="text-white font-bold">{reputation}</span></span>
            </div>
         </div>

         <div className="p-4 space-y-2 flex-1">
            <SidebarBtn icon={<Search />} label="Job Board" active={activeTab === 'FEED'} onClick={() => setActiveTab('FEED')} />
            <SidebarBtn icon={<Activity />} label="My Jobs" active={activeTab === 'MY_JOBS'} onClick={() => setActiveTab('MY_JOBS')} />
            <SidebarBtn icon={<User />} label="My Profile" active={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} />
         </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative bg-[#f8fafc]">
         
         {/* TAB 1: JOB FEED */}
         {activeTab === 'FEED' && (
             <div className="flex-1 overflow-y-auto p-8 animate-slide-up">
                 <div className="mb-6 border-b border-slate-200 pb-4">
                     <h2 className="text-3xl font-black text-slate-800">Available Jobs</h2>
                     <p className="text-slate-500">Help clients solve their problems and earn rewards.</p>
                 </div>

                 {loading ? (
                     <div className="flex justify-center items-center h-64"><Loader2 size={40} className="animate-spin text-blue-500" /></div>
                 ) : jobs.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-slate-300">
                         <h3 className="text-xl font-bold text-slate-600">No Jobs Available</h3>
                         <p className="text-slate-400">Check back later for new requests.</p>
                     </div>
                 ) : (
                     <div className="space-y-6">
                         {jobs.map(job => {
                             const jobData = parseJobData(job.ai_requirements);
                             return (
                                 <div key={job.contract_id} onClick={() => setSelectedJob(job)}
                                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group overflow-hidden">
                                     
                                     {/* Post Header (Client Info) */}
                                     <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                         <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                                 {jobData.clientName[0].toUpperCase()}
                                             </div>
                                             <div>
                                                 <div className="font-bold text-slate-800 text-sm leading-tight">{jobData.clientName}</div>
                                                 <div className="text-xs text-slate-500">{jobData.clientRole}</div>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getDifficultyBadge(job.difficulty)}`}>
                                                 {job.difficulty.toUpperCase()}
                                             </span>
                                             <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 justify-end">
                                                 <Clock size={12}/> Posted recently
                                             </div>
                                         </div>
                                     </div>

                                     {/* Post Body */}
                                     <div className="p-5">
                                         <h3 className="font-black text-xl text-slate-800 group-hover:text-blue-600 mb-2">{job.title}</h3>
                                         <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed italic border-l-4 border-blue-200 pl-3">
                                             "{jobData.story}"
                                         </p>
                                         
                                         {/* Rewards Footer */}
                                         <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                                             <div className="flex gap-4 font-medium">
                                                 <span className="flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                                                     <DollarSign size={16}/> {job.reward} ฿
                                                 </span>
                                             </div>
                                             <button className="text-blue-600 font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 View Details <ChevronRight size={16}/>
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 )}
             </div>
         )}

         {/* TAB 2: MY JOBS */}
         {activeTab === 'MY_JOBS' && (
             <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
                 <h2 className="text-3xl font-black text-slate-800 mb-2">งานที่กำลังทำอยู่</h2>
                 <p className="text-slate-500 mb-8">Jobs you are currently working on. Click to view details and submit.</p>

                 {loading ? (
                     <div className="flex justify-center items-center h-64"><Loader2 size={40} className="animate-spin text-blue-500" /></div>
                 ) : myJobs.length === 0 ? (
                     <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center">
                         <Activity size={48} className="text-slate-300 mx-auto mb-4" />
                         <h3 className="font-bold text-slate-600">ยังไม่มีงานที่กำลังทำ</h3>
                         <p className="text-slate-400 text-sm mt-2">ไปที่ Job Board เพื่อรับงานใหม่</p>
                     </div>
                 ) : (
                     <div className="grid grid-cols-1 gap-4">
                         {myJobs.map(job => {
                             const jobData = parseJobData(job.ai_requirements);
                             return (
                                 <div key={job.user_contract_id} 
                                      onClick={() => { setSelectedMyJob(job); setSelectedFile(null); setSubmitSuccess(null); }}
                                      className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-md relative overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all group">
                                     <div className="flex justify-between items-center">
                                         <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-1">
                                                 <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase animate-pulse">In Progress</span>
                                                 <span className="text-xs text-slate-400">Accepted: {new Date(job.accepted_at).toLocaleTimeString()}</span>
                                             </div>
                                             <h3 className="font-bold text-xl text-slate-800">{job.title}</h3>
                                             <p className="text-sm text-slate-500 mt-1 line-clamp-1">by {jobData.clientName} • {job.difficulty}</p>
                                         </div>
                                         <div className="flex items-center gap-3">
                                             <span className="flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-bold">
                                                 <DollarSign size={14}/> {job.reward} ฿
                                             </span>
                                             <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 )}
             </div>
         )}

         {/* TAB 3: PROFILE */}
         {activeTab === 'PROFILE' && (
             <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
                 <h2 className="text-3xl font-black text-slate-800 mb-6">Developer Profile</h2>
                 
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-5"><Award size={120} /></div>
                     <div className="flex items-center gap-6 relative z-10">
                         {profileAvatar ? (
                           <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-lg">
                             {profileAvatar}
                           </div>
                         ) : (
                           <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-4xl border-4 border-white shadow-lg">
                             {profileName[0]?.toUpperCase()}
                           </div>
                         )}
                         <div>
                             <div className="flex items-center gap-3 mb-1">
                               {isEditingName ? (
                                 <div className="flex items-center gap-2">
                                   <input 
                                     type="text" 
                                     value={tempName} 
                                     onChange={(e) => setTempName(e.target.value)}
                                     onKeyDown={(e) => e.key === 'Enter' && handleSaveDisplayName()}
                                     className="text-2xl font-black text-slate-800 border-b-2 border-blue-500 outline-none bg-transparent w-48"
                                     autoFocus
                                     maxLength={20}
                                   />
                                   <button onClick={handleSaveDisplayName} className="p-1 bg-green-500 text-white rounded-lg hover:bg-green-600"><Check size={16}/></button>
                                   <button onClick={() => setIsEditingName(false)} className="p-1 bg-slate-300 text-slate-600 rounded-lg hover:bg-slate-400"><X size={16}/></button>
                                 </div>
                               ) : (
                                 <>
                                   <h3 className="text-3xl font-black text-slate-800">{profileName}</h3>
                                   <button onClick={() => { setTempName(profileName); setIsEditingName(true); }} 
                                           className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors" title="Edit display name">
                                     <Edit3 size={16}/>
                                   </button>
                                 </>
                               )}
                             </div>
                             {displayName && (
                               <div className="text-xs text-slate-400 mb-2">Login: {userData?.username}</div>
                             )}
                             <div className="flex gap-2">
                                 <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider">{userLevel}</span>
                                 <span className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Verified</span>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Avatar Picker */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                     <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Sparkles size={18} className="text-yellow-500" /> Choose Avatar</h4>
                     <div className="flex gap-3 flex-wrap">
                         {AVATAR_OPTIONS.map(emoji => (
                             <button 
                               key={emoji} 
                               onClick={() => handleSelectAvatar(emoji)}
                               className={`w-14 h-14 text-2xl rounded-xl border-2 flex items-center justify-center transition-all hover:scale-110
                                 ${selectedAvatar === emoji ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200 scale-110' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                             >
                               {emoji}
                             </button>
                         ))}
                         <button 
                           onClick={() => handleSelectAvatar('')}
                           className={`w-14 h-14 text-xs font-bold rounded-xl border-2 flex items-center justify-center transition-all hover:scale-110
                             ${selectedAvatar === '' ? 'border-blue-500 bg-blue-50 shadow-lg text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
                         >
                           Default
                         </button>
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                         <Star size={32} className="text-yellow-500 mb-2" />
                         <div className="text-3xl font-black text-slate-800">{reputation}</div>
                         <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Reputation Score</div>
                     </div>
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                         <TrendingUp size={32} className="text-green-500 mb-2" />
                         <div className="text-3xl font-black text-slate-800">{userData?.current_money || 0} ฿</div>
                         <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Total Earnings</div>
                     </div>
                 </div>
             </div>
         )}
      </div>

      {/* JOB DETAILS MODAL (for new jobs from FEED) */}
      {selectedJob && (
          <JobDetailModal 
            job={selectedJob}
            parseJobData={parseJobData}
            onClose={() => setSelectedJob(null)}
            footer={
              !isDownloading ? (
                <button 
                  onClick={handleAcceptProcess}
                  className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
                >
                    <Download size={22} className="group-hover:animate-bounce" /> ACCEPT JOB
                </button>
              ) : (
                <div className="w-full py-4 bg-slate-800 text-white rounded-xl flex flex-col items-center justify-center gap-2 cursor-wait">
                    <div className="flex items-center gap-3">
                        <Loader2 size={20} className="animate-spin text-blue-400" />
                        <span className="font-bold text-sm tracking-widest">ACCEPTING JOB... {downloadProgress}%</span>
                    </div>
                </div>
              )
            }
          />
      )}

      {/* JOB DETAILS MODAL (for active jobs from MY_JOBS - with Upload) */}
      {selectedMyJob && (
          <JobDetailModal 
            job={selectedMyJob}
            parseJobData={parseJobData}
            onClose={() => { setSelectedMyJob(null); setSelectedFile(null); setSubmitSuccess(null); }}
            footer={
              submitSuccess ? (
                // Success message
                <div className="w-full py-5 bg-green-600 text-white rounded-xl flex flex-col items-center justify-center gap-2 animate-fade-in">
                    <CheckCircle size={28} />
                    <span className="font-bold text-lg">ส่งงานสำเร็จ!</span>
                    <span className="text-green-200 text-sm">ได้รับ {submitSuccess.reward} ฿</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected file display */}
                  {selectedFile ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="text-lg">{selectedFile.name.endsWith('.py') ? '🐍' : selectedFile.name.endsWith('.js') ? '🟡' : '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-blue-700 truncate">{selectedFile.name}</div>
                        <div className="text-[11px] text-blue-400">Ready to upload</div>
                      </div>
                      <button onClick={() => setSelectedFile(null)} className="text-blue-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setShowFileBrowser(true); setBrowseFolderId(null); }}
                      className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-bold"
                    >
                      <Upload size={20} /> Browse Files...
                    </button>
                  )}
                  
                  {/* Submit Button */}
                  <button 
                    onClick={handleSubmitJob}
                    disabled={!selectedFile || isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                      ${selectedFile && !isSubmitting
                        ? 'bg-green-600 hover:bg-green-500 text-white' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                  >
                    {isSubmitting ? (
                      <><Loader2 size={22} className="animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload size={22} /> Upload & Submit</>
                    )}
                  </button>
                </div>
              )
            }
          />
      )}

      {/* FILE BROWSER MODAL */}
      {showFileBrowser && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowFileBrowser(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileCode size={18} className="text-blue-500" /> Select File</h3>
              <button onClick={() => setShowFileBrowser(false)} className="text-slate-400 hover:text-red-500"><X size={18} /></button>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs overflow-x-auto">
              {getBrowseBreadcrumb().map((crumb, i) => (
                <span key={i} className="flex items-center shrink-0">
                  {i > 0 && <ChevronRight size={10} className="text-slate-300 mx-0.5" />}
                  <button 
                    onClick={() => setBrowseFolderId(crumb.id)}
                    className={`px-1.5 py-0.5 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors
                      ${i === getBrowseBreadcrumb().length - 1 ? 'font-bold text-slate-700' : 'text-slate-400'}`}
                  >
                    {crumb.label}
                  </button>
                </span>
              ))}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-3">
              {getBrowseItems().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                  <FileCode size={40} className="mb-2 opacity-30" />
                  <p className="text-sm">This folder is empty</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Folders first, then files */}
                  {getBrowseItems().filter(f => f.type === 'folder').sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setBrowseFolderId(item.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-transparent hover:bg-yellow-50 hover:border-yellow-200 text-left text-sm transition-all group"
                    >
                      <span className="text-lg">📁</span>
                      <span className="font-medium text-slate-700 group-hover:text-yellow-700">{item.name}</span>
                      <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-yellow-500" />
                    </button>
                  ))}
                  {getBrowseItems().filter(f => f.type === 'file').sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { setSelectedFile(item); setShowFileBrowser(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-transparent hover:bg-blue-50 hover:border-blue-200 text-left text-sm transition-all group"
                    >
                      <span className="text-lg">{item.name.endsWith('.py') ? '🐍' : item.name.endsWith('.js') ? '🟡' : '📄'}</span>
                      <span className="font-medium text-slate-700 group-hover:text-blue-700">{item.name}</span>
                      <CheckCircle size={14} className="ml-auto text-slate-200 group-hover:text-blue-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400">
              Click a folder to browse inside. Click a file to select it.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Job Detail Modal
function JobDetailModal({ job, parseJobData, onClose, footer }) {
  const jobData = parseJobData(job.ai_requirements);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90%] animate-slide-up">
            
            {/* Modal Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white">
                        {jobData.clientName[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 leading-tight">{job.title}</h2>
                        <div className="text-sm text-slate-500">Posted by <span className="font-bold text-slate-700">{jobData.clientName}</span></div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white hover:bg-red-50 hover:text-red-500 rounded-full border border-slate-200 transition-all shadow-sm"><X size={20}/></button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 bg-white">
                
                {/* Story Section */}
                <div>
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><MessageSquareQuote size={18} className="text-blue-500"/> Message from Client</h4>
                    <div className="bg-blue-50/50 border-l-4 border-blue-400 p-5 rounded-r-xl text-slate-700 italic leading-relaxed shadow-inner">
                        "{jobData.story}"
                    </div>
                </div>

                {/* Budget & Penalty */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-green-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
                        <div className="text-green-700 text-xs font-bold uppercase tracking-widest">Reward</div>
                        <div className="text-2xl font-black text-green-700">{job.reward} ฿</div>
                    </div>
                    <div className="flex-1 bg-red-50 p-4 rounded-xl border border-red-200 flex items-center justify-between">
                        <div className="text-red-700 text-xs font-bold uppercase tracking-widest">Fail Penalty</div>
                        <div className="text-2xl font-black text-red-700">-{job.penalty || 0} ฿</div>
                    </div>
                </div>

                {/* Technical Requirements */}
                <div>
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><FileCode size={18} className="text-slate-500"/> Technical Requirements</h4>
                    <div className="bg-slate-900 p-5 rounded-xl text-sm text-green-400 font-mono shadow-inner overflow-x-auto">
                        <pre className="whitespace-pre-wrap leading-loose">
{jobData.desc}
                        </pre>
                    </div>
                </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
                {footer}
            </div>
        </div>
    </div>
  );
}

function SidebarBtn({ icon, label, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
            ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            {icon} {label}
        </button>
    );
}

function getDifficultyBadge(diff) {
    if (diff === 'Easy') return 'bg-green-100 text-green-700 border-green-200';
    if (diff === 'Medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
}