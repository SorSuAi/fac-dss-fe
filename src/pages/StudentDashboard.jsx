import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { BookOpen, Clock, MapPin, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportingId, setReportingId] = useState(null); // Tracks which class is being reported

  const API_URL = import.meta.env.VITE_API_URL || 'https://fac-dss-be.onrender.com/api';

  useEffect(() => {
    fetchMySubjects();
  }, []);

  const fetchMySubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/student/my-subjects`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSubjects(res.data);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAbsence = async (classObj) => {
    const confirmReport = window.confirm(
      `Are you sure you want to report ${classObj.faculty?.name || 'the instructor'} as absent for ${classObj.subjectCode}? \n\nNote: False reporting may result in disciplinary action.`
    );
    
    if (!confirmReport) return;

    setReportingId(classObj._id);

    try {
      // We only need to send the classId; the backend figures out the rest via SQL JOINs
      const res = await axios.post(`${API_URL}/student/submit-report`, {
        classId: classObj._id 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      alert("✅ " + res.data.message);
    } catch (err) {
      // This is where the Backend 20-minute rule and duplicate checks shine
      const errorMessage = err.response?.data?.message || err.message;
      alert("❌ " + errorMessage);
    } finally {
      setReportingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Student Portal" />

      <main className="max-w-7xl mx-auto p-6">
        
        {/* Welcome Banner */}
        <div className="bg-ssu-maroon text-white rounded-2xl p-6 md:p-8 shadow-lg mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black mb-2">Welcome, {user?.name.split(' ')}!</h2>
            <p className="text-ssu-gold font-bold text-sm md:text-base opacity-90 max-w-xl">
              Help us maintain academic excellence. You can report an absent instructor here, but please remember reports are only accepted 20 minutes after the official class start time.
            </p>
          </div>
          {/* Decorative Background Element */}
          <BookOpen className="absolute -right-10 -bottom-10 text-white opacity-10" size={200} />
        </div>

        <div className="flex items-center gap-2 mb-6 text-gray-700">
          <BookOpen size={20} className="text-ssu-maroon" />
          <h3 className="text-xl font-bold">My Enrolled Classes</h3>
        </div>

        {loading ? (
          <div className="text-center py-12 text-ssu-maroon font-bold animate-pulse">Loading classes...</div>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
            <Info size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">You are not currently assigned to any active classes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => (
              <div key={sub._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                
                {/* Card Header */}
                <div className="bg-gray-50 p-4 border-b flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-gray-800">{sub.subjectCode}</h4>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-200 inline-block px-2 py-1 rounded mt-1">
                      Section {sub.section}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <p className="text-sm font-bold text-gray-700">{sub.subjectName}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{sub.room} • Instructor: <span className="font-bold text-gray-800">{sub.faculty?.name || 'TBA'}</span></span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span>{sub.schedule?.day} | {sub.schedule?.startTime} - {sub.schedule?.endTime}</span>
                  </div>
                </div>

                {/* Card Footer / Action */}
                <div className="p-4 bg-red-50/50 border-t border-red-100">
                  <button 
                    onClick={() => handleReportAbsence(sub)}
                    disabled={reportingId === sub._id}
                    className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition
                      ${reportingId === sub._id 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-900 shadow-sm'
                      }
                    `}
                  >
                    {reportingId === sub._id ? (
                      'Processing...'
                    ) : (
                      <><AlertTriangle size={18} /> Report Faculty Absence</>
                    )}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;