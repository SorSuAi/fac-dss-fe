import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const FacultyAttendanceForm = () => {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  // 1. PRE-LOAD: Fetch subjects assigned to THIS faculty only
  useEffect(() => {
    const fetchMySubjects = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/faculty/my-subjects`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSubjects(res.data); // This fills the dropdown automatically
      } catch (err) {
        console.error("Could not load subjects", err);
      }
    };
    fetchMySubjects();
  }, [user]);

  const handleSubmit = async () => {
    // Send attendance data to backend...
    alert(`Attendance submitted for ${selectedSubject}`);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-ssu-maroon mb-4">Faculty Attendance</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <label className="block text-sm font-bold text-gray-500 mb-2">Select Your Class</label>
        
        {/* PRE-LOADED DROPDOWN */}
        <select 
          className="w-full p-3 border rounded-lg bg-gray-50 font-bold"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">-- Choose Subject --</option>
          {subjects.map(sub => (
            <option key={sub._id} value={sub.subjectCode}>
              {sub.subjectCode} - {sub.section}
            </option>
          ))}
        </select>

        <button 
          onClick={handleSubmit}
          className="w-full mt-6 bg-ssu-maroon text-white font-bold py-3 rounded-lg"
        >
          Time In
        </button>
      </div>
    </div>
  );
};

export default FacultyAttendanceForm;