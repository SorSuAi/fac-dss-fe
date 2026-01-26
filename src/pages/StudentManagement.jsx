import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { Upload, Search, User, Trash2, Edit, Plus, X, Filter } from 'lucide-react';

const StudentManagement = () => {
  const { user, logout } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  
  // --- NEW: Specific Filter States ---
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '', email: '', idNumber: '', middleName: '', course: '', section: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('https://fac-dss-be.onrender.com/api/admin/users?role=student', {
        headers: { Authorization: `Bearer ${user.token}` } 
      });
      setStudents(res.data);
    } catch(err) { 
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Session Expired. Please Login Again.");
        logout();
      }
      console.error(err); 
    }
  };

  // --- NEW: Helper to get unique options for dropdowns ---
  const uniqueCourses = useMemo(() => {
    return [...new Set(students.map(s => s.course).filter(Boolean))].sort();
  }, [students]);

  const uniqueSections = useMemo(() => {
    // If a course is selected, only show sections for that course
    const relevantStudents = courseFilter 
      ? students.filter(s => s.course === courseFilter)
      : students;
    return [...new Set(relevantStudents.map(s => s.section).filter(Boolean))].sort();
  }, [students, courseFilter]);

  // --- UPDATED: Multi-condition Filter Logic ---
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      (s.idNumber && s.idNumber.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()));

    const matchesCourse = courseFilter ? s.course === courseFilter : true;
    const matchesSection = sectionFilter ? s.section === sectionFilter : true;

    return matchesSearch && matchesCourse && matchesSection;
  });

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
      complete: async (results) => {
        const formattedData = results.data.map(row => ({
          name: row.name,
          email: row.email,
          idNumber: row.idnumber || row.id || row.studentno, 
          middleName: row.middlename || row.mname || '',
          course: row.course, // Ensure your CSV has this column
          section: row.section // Ensure your CSV has this column
        }));

        const validData = formattedData.filter(r => r.email && r.name);
        if (validData.length === 0) {
            alert("No valid rows found. Check your CSV format.");
            e.target.value = null; return;
        }

        try {
          await axios.post('https://fac-dss-be.onrender.com/api/admin/manage-users/bulk', {
            users: validData, role: 'student'
          }, { headers: { Authorization: `Bearer ${user.token}` } });
          
          alert(`Success! ${validData.length} students processed.`);
          fetchStudents();
        } catch (err) { 
          alert("Upload Failed: " + (err.response?.data?.message || err.message)); 
        } finally { e.target.value = null; }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await axios.put(`https://fac-dss-be.onrender.com/api/admin/users/${editingStudent._id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert("Student Updated!");
      } else {
        await axios.post('https://fac-dss-be.onrender.com/api/admin/manage-users/bulk', {
          users: [formData], role: 'student'
        }, { headers: { Authorization: `Bearer ${user.token}` } });
        alert("Student Added!");
      }
      closeModal();
      fetchStudents();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await axios.delete(`https://fac-dss-be.onrender.com/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchStudents();
      } catch (err) { alert("Delete failed"); }
    }
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name, email: student.email, idNumber: student.idNumber || '',
      middleName: student.middleName || '', course: student.course || '', section: student.section || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({ name: '', email: '', idNumber: '', middleName: '', course: '', section: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Student Management" />
      <main className="max-w-7xl mx-auto p-6">
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 flex flex-col xl:flex-row justify-between items-center gap-4">
           <div>
             <h2 className="font-bold text-xl text-gray-800">Student Masterlist</h2>
             <p className="text-sm text-gray-500">View and manage enrolled students.</p>
           </div>
           
           <div className="flex flex-wrap gap-3 items-center">
             
             {/* --- NEW: Course Filter Dropdown --- */}
             <div className="relative">
                <Filter size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <select 
                  className="pl-9 p-3 bg-gray-50 border rounded-xl text-sm font-bold outline-ssu-maroon min-w-[120px]"
                  value={courseFilter}
                  onChange={(e) => {
                    setCourseFilter(e.target.value);
                    setSectionFilter(''); // Reset section when course changes
                  }}
                >
                  <option value="">All Courses</option>
                  {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>

             {/* --- NEW: Section Filter Dropdown --- */}
             <div className="relative">
                <select 
                  className="p-3 bg-gray-50 border rounded-xl text-sm font-bold outline-ssu-maroon min-w-[100px]"
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                >
                  <option value="">All Sections</option>
                  {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>

             <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search name, ID..." 
                  className="pl-10 p-3 bg-gray-50 border rounded-xl w-48 text-sm outline-ssu-maroon"
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>

             <button onClick={() => setShowModal(true)} className="bg-ssu-maroon text-white px-4 py-3 rounded-xl font-bold hover:bg-red-900 transition flex items-center gap-2">
               <Plus size={18} /> Add
             </button>
             <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition flex items-center gap-2">
               <Upload size={18} /> CSV
               <input type="file" className="hidden" accept=".csv" onChange={handleCSV} />
             </label>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">ID Number</th>
                <th className="p-4">Email</th>
                <th className="p-4">Course</th>
                <th className="p-4">Section</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                      <div className="bg-blue-50 p-2 rounded-full text-blue-600"><User size={14}/></div>
                      {s.name}
                    </td>
                    <td className="p-4 font-mono text-xs">{s.idNumber || 'N/A'}</td>
                    <td className="p-4 font-mono text-xs">{s.email || 'N/A'}</td>
                    <td className="p-4 font-bold text-xs">{s.course || '-'}</td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                        {s.section || 'Irr'}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan="6" className="p-8 text-center text-gray-400">
                     No students found matching filters.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Logic Remains Same */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                <button onClick={closeModal}><X size={24} className="text-gray-400"/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <input required placeholder="Full Name" className="p-3 border rounded-lg w-full text-sm" 
                     value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   <input required placeholder="ID Number" className="p-3 border rounded-lg w-full text-sm" 
                     value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input required type="email" placeholder="Email" className="p-3 border rounded-lg w-full text-sm" 
                     value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                   <input required placeholder="Middle Name" className="p-3 border rounded-lg w-full text-sm" 
                     value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input required placeholder="Course (e.g. BSIT)" className="p-3 border rounded-lg w-full text-sm" 
                     value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} />
                   <input required placeholder="Section (e.g. 3A)" className="p-3 border rounded-lg w-full text-sm" 
                     value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-ssu-maroon text-white font-bold py-3 rounded-lg hover:bg-red-900 transition mt-2">
                  {editingStudent ? 'Update Student' : 'Save Student'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default StudentManagement;