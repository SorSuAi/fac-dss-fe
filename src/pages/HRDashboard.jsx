import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid 
} from 'recharts';
import { LayoutDashboard, Users, FilePieChart, TrendingUp, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const HRDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [facultyData, setFacultyData] = useState([]);
  const [remarkData, setRemarkData] = useState([]);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState('1st Sem 2025-2026');
  
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch only Accepted reports for official analytics
      const res = await axios.get(`https://fac-dss-be.onrender.com/api/admin/reports`, {
        params: { status: 'Accepted', semester: selectedSemester },
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setTotalReports(res.data.length);

      // Format data for Bar Chart (Absences per Faculty)
      const counts = res.data.reduce((acc, curr) => {
        const name = curr.faculty?.name || "Unknown";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      setFacultyData(Object.keys(counts).map(key => ({ name: key, count: counts[key] })));

      
      // Format data for Pie Chart (Remarks distribution)
      const remarks = res.data.reduce((acc, curr) => {
        const r = curr.remarks || "No Reason";
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});
      setRemarkData(Object.keys(remarks).map(key => ({ name: key, value: remarks[key] })));

    } catch (err) {
      console.error("Error fetching analytics", err);
    }
  };

  

  const COLORS = ['#800000', '#FFD700', '#B8860B', '#4a4a4a', '#D1D5DB'];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-ssu-maroon text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="font-bold flex items-center gap-2 text-lg">
          <LayoutDashboard size={22} /> SSU HR Analytics
        </h1>
        <div className="flex items-center gap-6">
          <Link to="/management" className="text-ssu-gold font-bold flex items-center gap-2 text-sm">
            <Settings size={18} /> MANAGE DATA
          </Link>
          <button onClick={logout} className="text-ssu-gold font-bold border border-ssu-gold px-3 py-1 rounded">
            Logout
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        {/* Stats Cards */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            {/* SEMESTER FILTER */}
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Viewing:</span>
              <select 
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="text-sm font-bold text-ssu-maroon outline-none bg-transparent cursor-pointer"
              >
                <option value="1st Sem 2025-2026">1st Sem 2025-2026</option>
                <option value="2nd Sem 2025-2026">2nd Sem 2025-2026</option>
                <option value="Summer 2026">Summer 2026</option>
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-ssu-maroon">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Validated Absences</p>
            <h3 className="text-4xl font-black text-gray-800 mt-1">{totalReports}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-ssu-gold">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Active Faculty Tracked</p>
            <h3 className="text-4xl font-black text-gray-800 mt-1">{facultyData.length}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart: Faculty Performance */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-ssu-maroon" /> Absence Frequency by Faculty
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facultyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f9fafb'}} />
                  <Bar dataKey="count" fill="#800000" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Reason Distribution */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <FilePieChart size={18} className="text-ssu-maroon" /> Categorized Reasons
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={remarkData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {remarkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HRDashboard;