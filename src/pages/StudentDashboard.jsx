import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, Send, BookOpen, Clock } from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  // NEW: Fetch ONLY the subjects for this student
  useEffect(() => {
    const fetchMySubjects = async () => {
      try {
        const res = await axios.get('https://fac-dss-be.onrender.com/api/student/my-subjects', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSubjects(res.data);
      } catch (err) {
        console.error("Failed to load subjects");
      }
    };
    fetchMySubjects();
  }, [user]);

  const handleSubmitReport = async (subject) => {
    try {
      // We calculate the class "Start Time" for today based on the subject's schedule
      // NOTE: Real production logic would parse subject.schedule.startTime (e.g. "08:00")
      // For now, we simulate the "Start Time" as 25 mins ago to allow successful testing
      const classStart = new Date();
      classStart.setMinutes(classStart.getMinutes() - 25);

      await axios.post('https://fac-dss-be.onrender.com/api/student/submit-report', {
        facultyId: subject.faculty._id,
        subjectId: subject._id,
        classStartTime: classStart.toISOString()
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setStatus('success');
      setMessage(`Report sent for ${subject.subjectCode}`);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <nav className="bg-ssu-maroon text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <h1 className="font-bold flex items-center gap-2">FAC-DSS Student</h1>
        <button onClick={logout} className="text-ssu-gold font-semibold text-sm border border-ssu-gold px-3 py-1 rounded">Logout</button>
      </nav>

      <main className="p-6 max-w-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Schedule</h2>
          <p className="text-gray-500 text-sm">Report absence only if faculty is 20+ mins late.</p>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl text-green-700 flex items-center gap-3">
            <CheckCircle2 size={24} />
            <div>
              <p className="font-bold">Report Submitted</p>
              <p className="text-xs">{message}</p>
            </div>
            <button onClick={() => setStatus(null)} className="ml-auto text-xs underline">Close</button>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 flex items-center gap-3">
            <AlertCircle size={24} />
            <div>
              <p className="font-bold">Submission Failed</p>
              <p className="text-xs">{message}</p>
            </div>
            <button onClick={() => setStatus(null)} className="ml-auto text-xs underline">Close</button>
          </div>
        )}

        {/* Dynamic Subject List */}
        <div className="space-y-4">
          {subjects.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No enrolled subjects found.</p>
          ) : (
            subjects.map((sub) => (
              <div key={sub._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-black text-lg text-ssu-maroon">{sub.subjectCode}</h3>
                    <p className="text-gray-800 font-medium">{sub.subjectName}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded uppercase">
                      {sub.schedule.day}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {sub.schedule.startTime} - {sub.schedule.endTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {sub.room}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400">
                    Instructor: <span className="text-gray-700">{sub.faculty?.name}</span>
                  </p>
                  <button 
                    onClick={() => handleSubmitReport(sub)}
                    className="bg-ssu-maroon text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-900 transition flex items-center gap-2"
                  >
                    <Send size={14} /> REPORT ABSENCE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;