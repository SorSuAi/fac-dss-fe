import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, Send, BookOpen, Clock, Settings, LogOut, Calendar } from 'lucide-react';
import ChangePasswordModal from '../components/ChangePasswordModal'; // Ensure you have this component

const StudentDashboard = () => {
  const { user, logout, apiUrl } = useContext(AuthContext);
  
  // State
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Filter State (Default to current day or 'All')
  const [dayFilter, setDayFilter] = useState('All');

  // Days Array for the Filter Tabs
  const days = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // API URL
  // const API_URL = 'https://fac-dss-be.onrender.com/api';

  useEffect(() => {
    const fetchMySubjects = async () => {
      try {
        const res = await axios.get(`${apiUrl}/student/my-subjects`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSubjects(res.data);
      } catch (err) {
        console.error("Failed to load subjects");
      }
    };
    if (user) fetchMySubjects();
  }, [user]);

  // const handleSubmitReport = async (subject) => {
  //   if (!confirm(`Report instructor absence for ${subject.subjectCode}?`)) return;

  //   try {
  //     // Simulate checking if class started 20 mins ago
  //     const classStart = new Date();
  //     classStart.setMinutes(classStart.getMinutes() - 25);

  //     await axios.post(`${apiUrl}/student/submit-report`, {
  //       facultyId: subject.faculty._id || subject.faculty, // Handle populated vs unpopulated
  //       subjectId: subject._id,
  //       classStartTime: classStart.toISOString()
  //     }, {
  //       headers: { Authorization: `Bearer ${user.token}` }
  //     });

  //     setStatus('success');
  //     setMessage(`Report successfully sent for ${subject.subjectCode}`);
  //   } catch (err) {
  //     setStatus('error');
  //     setMessage(err.response?.data?.message || "An error occurred");
  //   }
  // };


  const handleSubmitReport = async (subject) => {
    // 1. Confirmation Dialog
    if (!confirm(`Report instructor absence for ${subject.subjectCode}?`)) return;

    try {
      // Logic: Send the report request to the backend. 
      // The backend now handles the "Unconfirmed" vs "Pending" transition.
      const res = await axios.post(`${apiUrl}/student/submit-report`, {
        facultyId: subject.faculty?._id || subject.faculty, 
        subjectId: subject._id,
        // Optional: Sending current time, though backend testing currently ignores the 20-min rule
        classStartTime: new Date().toISOString() 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // 2. Success Feedback (Transitioned to Unconfirmed or Pending)
      setStatus('success');
      setMessage(res.data.message || `Report successfully sent for ${subject.subjectCode}`);
      
      // Clear status after 5 seconds
      setTimeout(() => setStatus(null), 5000);

    } catch (err) {
      // 3. Error Feedback (Handles "Invalid Report" if already submitted)
      setStatus('error');
      const errorMsg = err.response?.data?.message || "An error occurred";
      setMessage(errorMsg);
      
      // If it's a duplicate report error, keep it visible longer
      if (err.response?.status === 400) {
        console.warn("Duplicate report attempted.");
      }
    }
  };

  // --- FILTER LOGIC ---
  const filteredSubjects = subjects.filter(sub => {
    if (dayFilter === 'All') return true;
    return sub.schedule?.day === dayFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* --- FIXED NAVBAR --- */}
      <nav className="bg-ssu-maroon text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          
          {/* Logo / Title */}
          <h1 className="font-bold text-lg flex items-center gap-2">
            FAC-DSS <span className="text-ssu-gold text-xs px-2 py-0.5 border border-ssu-gold rounded">Student</span>
          </h1>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block leading-tight">
              <p className="text-xs font-bold">{user?.name}</p>
              <p className="text-[10px] opacity-70 uppercase tracking-wider">{user?.role}</p>
            </div>
            
            <button 
               onClick={() => setShowPasswordModal(true)} 
               className="bg-black/20 hover:bg-black/40 p-2 rounded-full transition text-white/90"
               title="Change Password"
            >
               <Settings size={18} />
            </button>
            
            <button 
              onClick={logout} 
              className="bg-black/20 hover:bg-black/40 p-2 rounded-full transition text-white/90"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- DAY FILTER TABS --- */}
      <div className="bg-white shadow-sm border-b sticky top-[64px] z-10 overflow-x-auto no-scrollbar">
        <div className="max-w-xl mx-auto flex p-2 gap-2">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setDayFilter(day)}
              className={`
                px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all
                ${dayFilter === day 
                  ? 'bg-ssu-maroon text-white shadow-md' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
              `}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6 max-w-xl mx-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-ssu-maroon"/> 
            {dayFilter === 'All' ? 'All Classes' : `${dayFilter} Classes`}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Tap "Report Absence" only if the instructor is late by 20+ mins.
          </p>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl text-green-700 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 size={24} />
            <div className="flex-1">
              <p className="font-bold text-sm">Success</p>
              <p className="text-xs opacity-90">{message}</p>
            </div>
            <button onClick={() => setStatus(null)} className="text-xs font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 flex items-center gap-3 animate-fade-in">
            <AlertCircle size={24} />
            <div className="flex-1">
              <p className="font-bold text-sm">Error</p>
              <p className="text-xs opacity-90">{message}</p>
            </div>
            <button onClick={() => setStatus(null)} className="text-xs font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {/* Dynamic Subject List */}
        <div className="space-y-4">
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400 text-sm font-bold">No classes found for {dayFilter}.</p>
              <p className="text-gray-300 text-xs mt-1">Enjoy your free time!</p>
            </div>
          ) : (
            filteredSubjects.map((sub) => (
              <div key={sub._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-ssu-maroon transition group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-black text-lg text-ssu-maroon">{sub.subjectCode}</h3>
                    <p className="text-gray-800 font-bold text-sm leading-tight">{sub.subjectName}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wide">
                      {sub.schedule.day}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-ssu-maroon"/>
                    {sub.schedule.startTime} - {sub.schedule.endTime}
                  </div>
                  <div className="flex items-center gap-1.5 border-l pl-4 border-gray-300">
                    <BookOpen size={14} className="text-ssu-maroon"/>
                    {sub.room || "TBA"}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                       {sub.faculty?.name?.charAt(0) || "?"}
                    </div>
                    <div className="text-xs">
                      <p className="text-gray-400 font-bold uppercase text-[10px]">Instructor</p>
                      <p className="text-gray-700 font-bold">{sub.faculty?.name || "Unassigned"}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSubmitReport(sub)}
                    className="bg-white border border-ssu-maroon text-ssu-maroon text-xs font-bold px-4 py-2 rounded-lg hover:bg-ssu-maroon hover:text-white transition flex items-center gap-2 shadow-sm"
                  >
                    <Send size={14} /> REPORT
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Render Password Modal */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default StudentDashboard;