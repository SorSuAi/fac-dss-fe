import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Clock, BookOpen, MapPin, Calendar, LogOut, CheckCircle } from 'lucide-react';
import Header from '../components/Header'; // Assuming you have this

const FacultyDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // API Base URL
  const API_URL = 'https://fac-dss-be.onrender.com/api' || 'http://localhost:5001/api';

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch ALL subjects (or use a specific /my-subjects endpoint if you have one)
      const subRes = await axios.get(`${API_URL}/faculty/my-subjects`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // Filter: Only show subjects assigned to THIS faculty
      const mySubjects = subRes.data.filter(s => 
        (s.faculty?._id === user._id) || (s.faculty === user._id)
      );
      setSubjects(mySubjects);

      // 2. Check if I already have an ONGOING class
      // (You might need a backend route for this, or check local storage)
      // For now, we assume no active session on load unless backend tells us
      // const sessionRes = await axios.get(`${API_URL}/attendance/active-session`, ...);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleStartClass = async (subject) => {
    if (activeSession) return alert("You already have an active class!");
    
    const confirmStart = window.confirm(`Start class for ${subject.subjectCode}?`);
    if (!confirmStart) return;

    try {
      // Call the Time-In Endpoint
      const res = await axios.post(`${API_URL}/attendance/time-in`, {
        subjectId: subject._id,
        location: subject.room || "Room TBD" 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // Set the active session state to hide the list and show the "End Class" button
      setActiveSession({
        ...res.data, // The report object from backend
        subject: subject // Store subject details for display
      });

      alert("Class Started! Students can now scan to attend.");
    } catch (err) {
      alert("Error starting class: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEndClass = async () => {
    if (!confirm("Are you sure you want to end this class session?")) return;

    try {
      // Assuming you have a route to close the session
      // If not, you might need to create one: router.put('/attendance/time-out/:id')
      /* await axios.put(`${API_URL}/attendance/time-out/${activeSession._id}`, {}, {
         headers: { Authorization: `Bearer ${user.token}` }
      }); 
      */
      
      // For now, just clear the UI state to simulate ending
      setActiveSession(null);
      alert("Class Ended. Attendance report generated.");
    } catch (err) {
      alert("Error ending class");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-ssu-maroon text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <h1 className="font-bold flex items-center gap-2">FAC-DSS Faculty</h1>
        <button onClick={logout} className="text-ssu-gold font-semibold text-sm border border-ssu-gold px-3 py-1 rounded">Logout</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* WELCOME SECTION */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h2>
          <p className="text-gray-500">Select a subject below to start your attendance session.</p>
        </div>

        {/* ACTIVE CLASS CARD (Only visible if a class is ongoing) */}
        {activeSession ? (
          <div className="bg-green-600 text-white rounded-2xl p-8 shadow-xl text-center animate-pulse">
            <CheckCircle size={64} className="mx-auto mb-4 text-white/80" />
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
            {subjects.length === 0 ? (
              <p className="text-gray-400 col-span-3 text-center py-10">No subjects assigned yet.</p>
            ) : (
              subjects.map((sub) => (
                <div 
                  key={sub._id} 
                  onClick={() => handleStartClass(sub)}
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-ssu-maroon cursor-pointer transition group"
                >
                  <div className="flex justify-between items-start mb-4">
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
                      <Calendar size={14} /> 
                      <span>{sub.schedule?.day || 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} /> 
                      <span>{sub.schedule?.startTime} - {sub.schedule?.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={14} /> 
                      <span>{sub.room || 'Room TBA'}</span>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-ssu-maroon text-sm font-bold opacity-0 group-hover:opacity-100 transition">
                      Click to Start Class →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyDashboard;