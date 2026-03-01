import { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, QrCode, AlertCircle } from 'lucide-react';

const ScanGuard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const locationState = useLocation().state; 
  
  // We expect the FacultyDashboard to pass the selected class down via router state
  const selectedClass = locationState?.selectedClass;

  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://fac-dss-be.onrender.com/api';

  useEffect(() => {
    // If faculty navigated here directly without selecting a class first, send them back
    if (!selectedClass) {
      navigate('/faculty-dashboard');
      return;
    }

    // Initialize the Scanner
    const scanner = new Html5QrcodeScanner("reader", { 
      qrbox: { width: 250, height: 250 }, 
      fps: 10,
    });

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText) {
      scanner.clear(); // Stop scanning once we get a result
      setScanResult(decodedText);
      processTimeIn(decodedText);
    }

    function onScanFailure(err) {
      // Ignore background scan failures (it scans constantly until it finds one)
    }

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [selectedClass, navigate]);

  const processTimeIn = async (scannedRoomData) => {
    setLoading(true);
    setError('');

    try {
      // We pass the scanned room AND the classId they selected beforehand
      const res = await axios.post(`${API_URL}/attendance/time-in`, {
        classId: selectedClass._id,
        location: scannedRoomData // The text inside the QR code (e.g., "Room 101")
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      alert(`✅ Time-in successful! Status: ${res.data.status}`);
      navigate('/faculty-dashboard'); // Send back to dashboard
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process Time-In. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      
      {/* Header */}
      <div className="p-4 bg-black/50 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-300 hover:text-white transition">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold flex items-center gap-2">
          <QrCode size={20} className="text-ssu-gold"/> Scan Room
        </h1>
        <div className="w-16"></div> {/* Spacer for center alignment */}
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Starting Class: {selectedClass?.subjectCode}</h2>
        <p className="text-sm text-gray-400 mb-8 max-w-sm">
          Please point your camera at the QR code located inside the classroom to log your actual time-in.
        </p>

        {/* QR Scanner Container */}
        <div className="bg-white p-2 rounded-2xl w-full max-w-sm overflow-hidden mb-6">
          <div id="reader" className="w-full text-black"></div>
        </div>

        {loading && (
          <div className="text-ssu-gold font-bold animate-pulse">Processing attendance...</div>
        )}

        {error && (
          <div className="bg-red-500/20 text-red-300 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 text-left max-w-sm">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ScanGuard;