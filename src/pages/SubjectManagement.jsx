import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { Upload, Search, BookOpen, Trash2, Clock } from 'lucide-react';

const SubjectManagement = () => {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'https://fac-dss-be.onrender.com/api';

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/subjects`, {
        headers: { Authorization: `Bearer ${user.token}` } 
      });
      setSubjects(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  const handleCSV = (e) => {
    const file = e.target.files;
    if(!file) return;

    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, ""), 
      complete: async (results) => {
        const formattedData = results.data.map(row => ({
          subjectCode: row.subjectcode || row.code,
          subjectName: row.subjectname || row.title,
          facultyId: row.facultyid || row.instructorid, // Maps to the Turso users table
          semester: row.semester || '1st Sem 2025-2026',
          section: row.section || '',
          room: row.room || 'TBA',
          day: row.day || 'TBA',
          startTime: row.starttime || '00:00',
          endTime: row.endtime || '00:00'
        }));

        const validData = formattedData.filter(r => r.subjectCode && r.facultyId);
        
        try {
          const res = await axios.post(`${API_URL}/admin/manage-subjects/bulk`, {
            subjects: validData
          }, { headers: { Authorization: `Bearer ${user.token}` } });
          
          alert(res.data.message);
          if (res.data.errors?.length > 0) {
              console.warn("Upload Warnings:", res.data.errors);
              alert("Some rows skipped (e.g. Faculty not found). Check console for details.");
          }
          fetchSubjects();
        } catch (err) { 
          alert("Upload Failed: " + (err.response?.data?.message || err.message)); 
        } finally { e.target.value = null; }
      }
    });
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this schedule?")) {
      try {
        await axios.delete(`${API_URL}/admin/subjects/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchSubjects();
      } catch (err) { alert("Delete failed"); }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Schedule Management" />
      <main className="max-w-7xl mx-auto p-6">
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 flex justify-between items-center">
           <div>
             <h2 className="font-bold text-xl">Class Schedules</h2>
             <p className="text-sm text-gray-500">Map subjects, schedules, and faculty assignments.</p>
           </div>
           <div className="flex gap-3 items-center">
             <input 
               type="text" placeholder="Search code or section..." 
               className="p-3 bg-gray-50 border rounded-xl w-64 text-sm"
               onChange={(e) => setSearch(e.target.value)}
             />
             <label className="cursor-pointer bg-ssu-maroon text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2">
               <Upload size={20} /> Upload Schedule CSV
               <input type="file" className="hidden" accept=".csv" onChange={handleCSV} />
             </label>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="p-4">Subject</th>
                <th className="p-4">Faculty Assigned</th>
                <th className="p-4">Schedule</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subjects.filter(s => s.subjectCode.toLowerCase().includes(search.toLowerCase())).map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{s.subjectCode}</p>
                    <p className="text-xs text-gray-500">{s.subjectName} • Sec {s.section}</p>
                  </td>
                  <td className="p-4 text-gray-700 font-medium">{s.faculty?.name || 'Unassigned'}</td>
                  <td className="p-4 text-gray-500 text-xs">
                    <div className="flex items-center gap-1"><Clock size={12}/> {s.schedule?.day}</div>
                    <div>{s.schedule?.startTime} - {s.schedule?.endTime} • {s.room}</div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default SubjectManagement;