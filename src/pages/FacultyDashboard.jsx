import { useState, useEffect, useContext } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Camera, LogOut, CheckCircle, Clock } from 'lucide-react';

const FacultyDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [scanResult, setScanResult] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      });

      scanner.render(onScanSuccess, onScanError);

      function onScanSuccess(decodedText) {
        scanner.clear();
        setIsScanning(false);
        handleStartClass(decodedText);
      }

      function onScanError(err) {
        // Silently ignore scan errors
      }

      return () => scanner.clear();
    }
  }, [isScanning]);

  const handleStartClass = async (qrData) => {
    try {
      // Mocking the scheduled time for testing: 
      // In production, this would come from the specific Subject's schedule
      const scheduledTime = new Date().setMinutes(new Date().getMinutes() - 5); 

      const res = await axios.post('https://fac-dss-be.onrender.com/api/faculty/start-class', {
        subjectId: "65b2f1a2e4b0a1234567890a", // Example ID
        room: qrData,
        building: "Main Bldg",
        scheduledTime: new Date(scheduledTime).toISOString()
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setAttendanceStatus(res.data.log.status);
      setScanResult("Room Scanned: " + qrData);
    } catch (err) {
      alert("Error starting class: " + err.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-ssu-maroon text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-lg">FAC-DSS Faculty Portal</h1>
        <button onClick={logout} className="flex items-center gap-2 text-ssu-gold hover:text-white transition">
          <LogOut size={18} /> Logout
        </button>
      </nav>

      <main className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome, {user.name}</h2>
          <p className="text-gray-500 mb-6">Ready to start your class?</p>

          {!isScanning && !attendanceStatus && (
            <button 
              onClick={() => setIsScanning(true)}
              className="w-full bg-ssu-maroon hover:bg-red-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              <Camera size={24} />
              SCAN ROOM QR
            </button>
          )}

          {isScanning && (
            <div id="reader" className="overflow-hidden rounded-lg border-2 border-ssu-maroon"></div>
          )}

          {attendanceStatus && (
            <div className={`mt-4 p-6 rounded-xl border-2 flex flex-col items-center gap-3 ${
              attendanceStatus === 'On-time' ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'
            }`}>
              {attendanceStatus === 'On-time' ? 
                <CheckCircle size={48} className="text-green-600" /> : 
                <Clock size={48} className="text-orange-600" />
              }
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 uppercase">Status Recorded</p>
                <p className={`text-2xl font-black ${attendanceStatus === 'On-time' ? 'text-green-600' : 'text-orange-600'}`}>
                  {attendanceStatus.toUpperCase()}
                </p>
              </div>
              <button 
                onClick={() => setAttendanceStatus(null)}
                className="mt-4 text-ssu-maroon font-semibold hover:underline"
              >
                Scan Another Room
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;