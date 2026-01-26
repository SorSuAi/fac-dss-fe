import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { Upload, Mail, Search, Plus, Trash2, Edit, X, Filter } from 'lucide-react';

const FacultyManagement = () => {
  const { user, logout } = useContext(AuthContext);
  const [faculty, setFaculty] = useState([]);
  
  // --- FILTER STATES ---
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState(''); // New Dept Filter
  
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', idNumber: '', middleName: '', department: ''
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const res = await axios.get('https://fac-dss-be.onrender.com/api/admin/users?role=faculty', {
        headers: { Authorization: `Bearer ${user.token}` } 
      });
      setFaculty(res.data);
    } catch(err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Session Expired.");
        logout();
      }
      console.error(err);
    }
  };

  // --- NEW: Helper to get unique departments ---
  const uniqueDepartments = useMemo(() => {
    return [...new Set(faculty.map(f => f.department).filter(Boolean))].sort();
  }, [faculty]);

  // --- UPDATED: Multi-condition Filter Logic ---
  const filteredFaculty = faculty.filter(f => {
    const matchesSearch = 
      f.name.toLowerCase().includes(search.toLowerCase()) || 
      (f.idNumber && f.idNumber.toLowerCase().includes(search.toLowerCase())) ||
      (f.email && f.email.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = deptFilter ? f.department === deptFilter : true;

    return matchesSearch && matchesDept;
  });

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if(!file) return;

    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, ""), 
      complete: async (results) => {
        const formattedData = results.data.map(row => ({
          name: row.name,
          email: row.email,
          idNumber: row.idnumber || row.id || row.empid, 
          middleName: row.middlename || row.mname || '',
          department: row.department || row.dept
        }));

        const validData = formattedData.filter(r => r.email && r.name);
        if (validData.length === 0) {
            alert("No valid rows found. Check CSV.");
            e.target.value = null; return;
        }

        try {
          await axios.post('https://fac-dss-be.onrender.com/api/admin/manage-users/bulk', {
            users: validData, role: 'faculty'
          }, { headers: { Authorization: `Bearer ${user.token}` } });
          alert(`Success! ${validData.length} faculty processed.`);
          fetchFaculty();
        } catch (err) { 
          alert("Upload Failed: " + (err.response?.data?.message || err.message)); 
        } finally { e.target.value = null; }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await axios.put(`https://fac-dss-be.onrender.com/api/admin/users/${editingFaculty._id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert("Faculty Updated!");
      } else {
        await axios.post('https://fac-dss-be.onrender.com/api/admin/manage-users/bulk', {
          users: [formData], role: 'faculty'
        }, { headers: { Authorization: `Bearer ${user.token}` } });
        alert("Faculty Added!");
      }
      closeModal();
      fetchFaculty();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this faculty member?")) {
      try {
        await axios.delete(`https://fac-dss-be.onrender.com/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchFaculty();
      } catch (err) { alert("Delete failed"); }
    }
  };

  const openEdit = (f) => {
    setEditingFaculty(f);
    setFormData({
      name: f.name, email: f.email, idNumber: f.idNumber || '',
      middleName: f.middleName || '', department: f.department || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFaculty(null);
    setFormData({ name: '', email: '', idNumber: '', middleName: '', department: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Faculty Management" />
      <main className="max-w-7xl mx-auto p-6">
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
             <h2 className="font-bold text-xl">Faculty Roster</h2>
             <p className="text-sm text-gray-500">Manage active professors and instructors.</p>
           </div>
           
           <div className="flex flex-wrap gap-3 items-center">
             
             {/* --- NEW: Department Filter Dropdown --- */}
             <div className="relative">
                <Filter size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <select 
                  className="pl-9 p-3 bg-gray-50 border rounded-xl text-sm font-bold outline-ssu-maroon min-w-[150px]"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
             </div>

             {/* Search Input */}
             <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" placeholder="Search..." 
                  className="pl-10 p-3 bg-gray-50 border rounded-xl w-48 text-sm outline-ssu-maroon"
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             
             <button onClick={() => setShowModal(true)} className="bg-ssu-maroon text-white px-4 py-3 rounded-xl font-bold hover:bg-red-900 transition flex items-center gap-2">
               <Plus size={18} /> Add
             </button>
             <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition flex items-center gap-2">
               <Upload size={20} /> CSV
               <input type="file" className="hidden" accept=".csv" onChange={handleCSV} />
             </label>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Department</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredFaculty.length > 0 ? (
                filteredFaculty.map(f => (
                  <tr key={f._id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-ssu-gold/20 text-ssu-maroon flex items-center justify-center font-black">
                        {f.name.charAt(0)}
                      </div>
                      <div>
                        <p>{f.name}</p>
                        <p className="text-xs text-gray-400 font-normal">{f.idNumber || 'No ID'}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-600">
                      {f.department || <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="p-4 text-gray-500 flex items-center gap-2">
                       <Mail size={14}/> {f.email}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => openEdit(f)}
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(f._id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan="4" className="p-8 text-center text-gray-400">
                     No faculty members found matching filters.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Logic (Unchanged) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h3>
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
                <input required placeholder="Department (e.g. College of Science)" className="p-3 border rounded-lg w-full text-sm" 
                  value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                
                <button type="submit" className="w-full bg-ssu-maroon text-white font-bold py-3 rounded-lg hover:bg-red-900 transition mt-2">
                  {editingFaculty ? 'Update Faculty' : 'Save Faculty'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default FacultyManagement;