import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { Upload, Mail, Search, Users, Trash2 } from 'lucide-react';

const StudentManagement = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'https://fac-dss-be.onrender.com/api';

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users?role=student`, {
        headers: { Authorization: `Bearer ${user.token}` } 
      });
      setStudents(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.idNumber && s.idNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCSV = (e) => {
    const file = e.target.files;
    if(!file) return;

    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, ""), 
      complete: async (results) => {
        const formattedData = results.data.map(row => ({
          name: row.name,
          email: row.email,
          idNumber: row.idnumber || row.studentno, 
          middleName: row.middlename || '',
          section: row.section || '',
          course: row.course || ''
        }));

        const validData = formattedData.filter(r => r.email && r.name);
        if (validData.length === 0) return alert("No valid rows found in CSV.");

        try {
          await axios.post(`${API_URL}/admin/manage-users/bulk`, {
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

  const handleDelete = async (id) => {
    if (confirm("Delete this student?")) {
      try {
        await axios.delete(`${API_URL}/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchStudents();
      } catch (err) { alert("Delete failed"); }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Student Management" />
      <main className="max-w-7xl mx-auto p-6">
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
             <h2 className="font-bold text-xl">Student Directory</h2>
             <p className="text-sm text-gray-500">Manage enrolled students for crowd-sourced validation.</p>
           </div>
           
           <div className="flex gap-3 items-center">
             <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" placeholder="Search students..." 
                  className="pl-10 p-3 bg-gray-50 border rounded-xl w-64 text-sm"
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <label className="cursor-pointer bg-ssu-maroon text-white px-4 py-3 rounded-xl font-bold hover:bg-red-900 transition flex items-center gap-2">
               <Upload size={20} /> Bulk CSV Upload
               <input type="file" className="hidden" accept=".csv" onChange={handleCSV} />
             </label>
           </div>
        </div>

        {/* ... table rendering similar to FacultyManagement (mapping through filteredStudents) ... */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Course & Section</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-800">
                    <p>{s.name}</p>
                    <p className="text-xs text-gray-400 font-normal">{s.idNumber}</p>
                  </td>
                  <td className="p-4 text-gray-600">{s.course} {s.section}</td>
                  <td className="p-4 text-gray-500">{s.email}</td>
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

export default StudentManagement;