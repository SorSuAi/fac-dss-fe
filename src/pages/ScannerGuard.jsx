import { useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ScanGuard = () => {
  const { type } = useParams(); // 'faculty' or 'student'
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return; // Wait for user to load

    // 1. SECURITY CHECK: Mismatched Roles
    if (type === 'faculty' && user.role !== 'faculty') {
      alert("FORBIDDEN: Students cannot use this QR code.");
      navigate('/dashboard'); // Kick them back
      return;
    }

    if (type === 'student' && user.role !== 'student') {
      alert("FORBIDDEN: Faculty cannot use this QR code.");
      navigate('/dashboard'); // Kick them back
      return;
    }

    // 2. SUCCESS: Redirect to the correct form
    if (type === 'faculty') {
      navigate('/faculty/attendance-form');
    } else {
      navigate('/student/report-form');
    }

  }, [type, user, navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-xl font-bold animate-pulse">Verifying ID...</p>
    </div>
  );
};

export default ScanGuard;