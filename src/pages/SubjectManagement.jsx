import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { Upload, Plus, Trash2, Search, Edit, X } from 'lucide-react';

const SubjectManagement = () => {
  const { user, logout } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [semesterFilter, setSemesterFilter] = useState('1st Sem 2025-2026');
  const [search, setSearch] = useState('');
  
  // Modal & Form State
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ 
    subjectName: '', subjectCode: '', facultyId: '',
    day: 'Monday', startTime: '', endTime: '', room: '',
    course: '', section: '', semester: '1st Sem 2025-2026'
  });

  useEffect(() => {
    fetchSubjects();
    fetchFaculties();
  }, [semesterFilter]);

  const fetchFaculties = async () => {
    try {
      const res = await axios.get('https://fac-dss-be.onrender.com/api/admin/users?role=faculty', {
         headers: { Authorization: `Bearer ${user.token}` } 
      });
      setFaculties(res.data);
    } catch(err) {}
  };

  const fetchSubjects = async () => {
  try {
    // Change this URL from '/api/student/my-subjects' to '/api/admin/subjects'
    const res = await axios.get('https://fac-dss-be.onrender.com/api/admin/subjects', { 
      headers: { Authorization: `Bearer ${user.token}` } 
    }); 
    
    // Filter the subjects based on the semester selected in the dropdown
    const filtered = res.data.filter(s => s.semester === semesterFilter);
    setSubjects(filtered);
  } catch (err) {
    // If the error is 403, it means the route above isn't working or 
    // your token is old.
    if (err.response?.status === 403 || err.response?.status === 401) {
      alert("Session Error: Please ensure the Admin Subject route is active on the backend.");
      // logout(); // Uncomment this only if you want to force logout
    }
    console.error("Fetch error:", err);
  }
};

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if(!file) return;

    Papa.parse(file, {
      header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
      complete: async (results) => {
        const validRows = results.data.filter(r => r.subjectCode && r.subjectName);
        if (validRows.length === 0) {
           alert("No valid subjects found in CSV.");
           e.target.value = null; return;
        }

        try {
          await axios.post('https://fac-dss-be.onrender.com/api/admin/manage-subjects/bulk', {
            subjects: validRows
          }, { headers: { Authorization: `Bearer ${user.token}` } });
          alert(`Success! ${validRows.length} subjects imported.`);
          fetchSubjects();
        } catch (err) { alert("Upload Failed: " + (err.response?.data?.message || err.message)); }
        finally { e.target.value = null; }
      }
    });
  };

  const handleDelete = async (id) => {
    if(confirm("Delete this subject?")) {
      try {
        await axios.delete(`https://fac-dss-be.onrender.com/api/admin/subjects/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchSubjects();
      } catch(err) { alert("Delete failed"); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // CONSTRUCTION: Format data to match the Mongoose Schema
      const payload = {
        subjectCode: subjectForm.subjectCode,
        subjectName: subjectForm.subjectName,
        faculty: subjectForm.facultyId, // MAPPING: facultyId (Form) -> faculty (Schema)
        schedule: {                     // MAPPING: Nest flat fields into 'schedule' object
          day: subjectForm.day,
          startTime: subjectForm.startTime,
          endTime: subjectForm.endTime
        },
        room: subjectForm.room,
        course: subjectForm.course,
        section: subjectForm.section,
        semester: subjectForm.semester,
        isActive: true
      };

      const API_URL = 'https://fac-dss-be.onrender.com/api/admin'; // Or use your env variable

      if (editingSubject) {
        await axios.put(`${API_URL}/subjects/${editingSubject._id}`, payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert("Subject Updated Successfully!");
      } else {
        await axios.post(`${API_URL}/create-subject`, payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert("Subject Added Successfully!");
      }
      closeModal();
      fetchSubjects();
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const openEdit = (sub) => {
    setEditingSubject(sub);
    
    setSubjectForm({
      subjectName: sub.subjectName, 
      subjectCode: sub.subjectCode,
      // Handle faculty whether it's populated (object) or just an ID (string)
      facultyId: sub.faculty?._id || sub.faculty || '', 
      
      // FLATTENING: Pull values out of the nested 'schedule' object
      day: sub.schedule?.day || 'Monday', 
      startTime: sub.schedule?.startTime || '', 
      endTime: sub.schedule?.endTime || '',
      
      room: sub.room, 
      course: sub.course || '', 
      section: sub.section || '', 
      semester: sub.semester
    });
    
    setShowForm(true);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingSubject(null);
    setSubjectForm({ 
      subjectName: '', subjectCode: '', facultyId: '',
      day: 'Monday', startTime: '', endTime: '', room: '',
      course: '', section: '', semester: semesterFilter
    });
  };

  const filteredSubjects = subjects.filter(s => 
    s.subjectName.toLowerCase().includes(search.toLowerCase()) || 
    s.subjectCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Subject Management" />
      <main className="max-w-7xl mx-auto p-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
             <select 
                className="p-3 bg-white border rounded-xl font-bold shadow-sm"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
             >
                <option>1st Sem 2025-2026</option>
                <option>2nd Sem 2025-2026</option>
             </select>
             <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" placeholder="Search subject..." 
                  className="pl-10 p-3 rounded-xl border w-64 outline-ssu-maroon" 
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>
          
          <div className="flex gap-2">
            <label className="cursor-pointer flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition">
              <Upload size={18} /> CSV
              <input type="file" className="hidden" onChange={handleBulkUpload} />
            </label>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-ssu-maroon text-white px-4 py-2 rounded-lg font-bold hover:bg-red-900 transition">
              <Plus size={18} /> Add Subject
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map(sub => (
            <div key={sub._id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-ssu-maroon transition relative group">
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                 <button onClick={() => openEdit(sub)} className="p-1 text-blue-600 bg-blue-50 rounded"><Edit size={14}/></button>
                 <button onClick={() => handleDelete(sub._id)} className="p-1 text-red-600 bg-red-50 rounded"><Trash2 size={14}/></button>
              </div>
              <div className="flex justify-between items-start">
                <h3 className="font-black text-lg text-ssu-maroon">{sub.subjectCode}</h3>
                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold">{sub.section}</span>
              </div>
              <p className="font-bold text-gray-700">{sub.subjectName}</p>
              <p className="text-sm text-gray-500 mt-2">{sub.schedule.day} • {sub.schedule.startTime}-{sub.schedule.endTime}</p>
              <p className="text-xs font-bold text-blue-600 mt-1">{sub.faculty?.name || 'Unassigned'}</p>
            </div>
          ))}
        </div>

        {/* Modal for Add/Edit Subject */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">{editingSubject ? 'Edit Subject' : 'Add Subject'}</h3>
                <button onClick={closeModal}><X size={24} className="text-gray-400"/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input required placeholder="Code (IT-101)" className="p-3 border rounded-lg text-sm"
                    value={subjectForm.subjectCode} onChange={e => setSubjectForm({...subjectForm, subjectCode: e.target.value})} />
                  <input required placeholder="Subject Name" className="p-3 border rounded-lg text-sm"
                    value={subjectForm.subjectName} onChange={e => setSubjectForm({...subjectForm, subjectName: e.target.value})} />
                </div>
                <select required className="w-full p-3 border rounded-lg text-sm"
                  value={subjectForm.facultyId} onChange={e => setSubjectForm({...subjectForm, facultyId: e.target.value})}>
                  <option value="">Assign Faculty</option>
                  {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                   <input required placeholder="Course (BSIT)" className="p-3 border rounded-lg text-sm"
                    value={subjectForm.course} onChange={e => setSubjectForm({...subjectForm, course: e.target.value})} />
                   <input required placeholder="Section (3A)" className="p-3 border rounded-lg text-sm"
                    value={subjectForm.section} onChange={e => setSubjectForm({...subjectForm, section: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="p-3 border rounded-lg text-sm" value={subjectForm.day} onChange={e => setSubjectForm({...subjectForm, day: e.target.value})}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input required placeholder="Room" className="p-3 border rounded-lg text-sm"
                    value={subjectForm.room} onChange={e => setSubjectForm({...subjectForm, room: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input required type="time" className="p-3 border rounded-lg text-sm"
                    value={subjectForm.startTime} onChange={e => setSubjectForm({...subjectForm, startTime: e.target.value})} />
                  <input required type="time" className="p-3 border rounded-lg text-sm"
                    value={subjectForm.endTime} onChange={e => setSubjectForm({...subjectForm, endTime: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-ssu-maroon text-white font-bold py-3 rounded-lg hover:bg-red-900 transition mt-2">
                  {editingSubject ? 'Update Subject' : 'Save Subject'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default SubjectManagement;