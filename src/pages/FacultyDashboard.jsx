import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Clock, BookOpen, MapPin, Calendar, CheckCircle, Settings, LogOut } from 'lucide-react';
import ChangePasswordModal from '../components/ChangePasswordModal'; // Ensure this path is correct

const FacultyDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  
  // Data State
  const [subjects, setSubjects] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [dayFilter, setDayFilter] = useState('All'); // Default to All days

  const days = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Fixed API URL for your deployed backend
  const API_URL = 'https://fac-dss-be.onrender.com/api';

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const subRes = await axios.get(`${API_URL}/faculty/my-subjects`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSubjects(subRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setLoading(false);
    }
  };

  const handleStartClass = async (subject) => {
    if (activeSession) return alert("You already have an active class!");
    
    const confirmStart = window.confirm(`Start class for ${subject.subjectCode}?`);
    if (!confirmStart) return;

    try {
      const res = await axios.post(`${API_URL}/attendance/time-in`, {
        subjectId: subject._id,
        location: subject.room || "Room TBD" 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setActiveSession({
        ...res.data, 
        subject: subject 
      });

      alert("Class Started! Students can now scan to attend.");
    } catch (err) {
      alert("Error starting class: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEndClass = async () => {
    if (!activeSession) return;
    if (!confirm("Are you sure you want to end this class session?")) return;

    try {
      await axios.put(`${API_URL}/attendance/time-out/${activeSession._id}`, {}, {
         headers: { Authorization: `Bearer ${user.token}` }
      }); 
      
      setActiveSession(null);
      alert("Class Ended. Attendance report generated.");
    } catch (err) {
      console.error(err);
      alert("Error ending class: " + (err.response?.data?.message || err.message));
    }
  };

  // --- FILTER LOGIC ---
  const filteredSubjects = subjects.filter(sub => {
    if (dayFilter === 'All') return true;
    return sub.schedule?.day === dayFilter;
  });

  if (loading) return <div className="p-8 text-center mt-10">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* --- UPDATED NAVBAR --- */}
      <nav className="bg-ssu-maroon text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <h1 className="font-bold flex items-center gap-2 text-lg">
            FAC-DSS <span className="text-[10px] bg-ssu-gold text-ssu-maroon px-2 rounded-full uppercase tracking-wider">Faculty</span>
          </h1>

          <div className="flex items-center gap-3">
             {/* User Info (Hidden on small screens) */}
             <div className="text-right hidden md:block mr-2">
               <p className="text-xs font-bold">{user?.name}</p>
               <p className="text-[10px] opacity-70 uppercase tracking-widest">{user?.role}</p>
             </div>

             {/* Change Password Button */}
             <button 
               onClick={() => setShowPasswordModal(true)} 
               className="bg-black/20 hover:bg-black/40 p-2 rounded-full transition text-white/90"
               title="Change Password"
             >
               <Settings size={18} />
             </button>

             {/* Logout Button */}
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
      <div className="bg-white shadow-sm border-b sticky top-[64px] z-10 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex p-2 gap-2">
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

      <main className="max-w-7xl mx-auto p-6">
        
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {dayFilter === 'All' ? 'All Classes' : `${dayFilter} Classes`}
          </h2>
          <p className="text-gray-500 text-sm">Select a subject card to start your class session.</p>
        </div>

        {/* ACTIVE CLASS CARD (Only visible if a class is ongoing) */}
        {activeSession ? (
          <div className="bg-green-600 text-white rounded-2xl p-8 shadow-xl text-center animate-fade-in mb-8">
            <div className="animate-pulse">
                <CheckCircle size={64} className="mx-auto mb-4 text-white/80" />
            </div>
            <h3 className="text-3xl font-bold mb-2">{activeSession.subject.subjectCode} is Active</h3>
            <p className="text-lg opacity-90 mb-6">{activeSession.subject.subjectName} • {activeSession.subject.section}</p>
            
            <button 
              onClick={handleEndClass}
              className="bg-white text-green-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition shadow-md"
            >
              End Class Session
            </button>
          </div>
        ) : (
          
          /* SUBJECT LIST GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400 font-bold">No classes scheduled for {dayFilter}.</p>
                <p className="text-gray-300 text-sm mt-1">Enjoy your free time!</p>
              </div>
            ) : (
              filteredSubjects.map((sub) => (
                <div 
                  key={sub._id} 
                  onClick={() => handleStartClass(sub)}
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-ssu-maroon cursor-pointer transition group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-gray-100 text-[10px] font-bold text-gray-500 px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    {sub.schedule?.day}
                  </div>

                  <div className="flex justify-between items-start mb-4 mt-2">
                    <div className="bg-ssu-maroon/10 p-3 rounded-xl text-ssu-maroon group-hover:bg-ssu-maroon group-hover:text-white transition">
                      <BookOpen size={24} />
                    </div>
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {sub.section}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-ssu-maroon transition">
                    {sub.subjectCode}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mb-4">{sub.subjectName}</p>

                  <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} className="text-ssu-maroon" /> 
                      <span className="font-medium text-gray-700">{sub.schedule?.startTime} - {sub.schedule?.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={14} /> 
                      <span>{sub.room || 'Room TBA'}</span>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-ssu-maroon text-xs font-bold opacity-0 group-hover:opacity-100 transition uppercase tracking-wide">
                      Click to Start Class
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default FacultyDashboard;