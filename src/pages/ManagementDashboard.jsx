import { useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { Archive, AlertTriangle, ShieldCheck } from 'lucide-react';

const ManagementDashboard = () => {
  const { user } = useContext(AuthContext);

  const archiveSemester = async () => {
    if (window.confirm("WARNING: This will archive all reports and deactivate current subjects. Are you sure?")) {
      try {
        await axios.post('https://fac-dss-be.onrender.com/api/admin/archive-semester', {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert("System Reset Successful. Ready for new semester.");
      } catch (err) { alert("Archive failed."); }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="System Settings" />
      <main className="max-w-4xl mx-auto p-6">
        
        <h2 className="text-2xl font-bold text-gray-800 mb-6">System Administration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-green-700">
              <ShieldCheck size={28} />
              <h3 className="font-bold text-lg">System Status</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">The system is currently active and accepting reports.</p>
            <div className="text-xs font-mono bg-gray-100 p-3 rounded text-gray-600">
              Database: Connected<br/>
              API: Online<br/>
              Version: v2.5.0
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-red-700">
              <Archive size={28} />
              <h3 className="font-bold text-lg">End of Semester</h3>
            </div>
            <p className="text-sm text-red-600 mb-6 leading-relaxed">
              Archiving will move all current attendance reports to history and set all students/subjects to 
              <strong> Inactive</strong>. Do this only when the semester is officially over.
            </p>
            <button 
              onClick={archiveSemester}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <AlertTriangle size={18}/> ARCHIVE SEMESTER DATA
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ManagementDashboard;