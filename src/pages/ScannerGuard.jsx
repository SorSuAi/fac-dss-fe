import { useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ScanGuard = () => {
  const { type } = useParams(); // 'faculty' or 'student'
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return; // Wait for user data to load

    // 1. SECURITY: Prevent Students from scanning Faculty codes
    if (type === 'faculty' && user.role !== 'faculty') {
      alert("ACCESS DENIED: Students cannot use this QR code.");
      navigate('/student-dashboard'); 
      return;
    }

    if (type === 'student' && user.role !== 'student') {
      alert("ACCESS DENIED: Faculty cannot use this QR code.");
      navigate('/faculty-dashboard'); 
      return;
    }

    // 2. REDIRECT LOGIC (The Fix)
    if (type === 'faculty') {
      // ✅ STOP auto-submit. Just go to the Dashboard.
      navigate('/faculty-dashboard'); 
    } else {
      // Students still go to their report form
      navigate('/student/report-form');
    }

  }, [type, user, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ssu-maroon mb-4"></div>
      <p className="text-gray-500 font-bold animate-pulse">Verifying Access...</p>
    </div>
  );
};

export default ScanGuard;