import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, login } = useContext(AuthContext); // Added user here
  const navigate = useNavigate();

  // FIX: Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'faculty') navigate('/faculty-dashboard');
      else if (user.role === 'student') navigate('/student-dashboard');
      else navigate('/admin-dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://fac-dss-be.onrender.com/api/auth/login', { email, password });
      login(res.data);
      // Navigation happens via useEffect above once 'user' state changes
    } catch (err) {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Changed border-ssuMaroon to border-ssu-maroon for v4 compatibility */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border-t-8 border-ssu-maroon">
        <div className="p-8 text-center">
          {/* Ensure this file is in your /public folder */}
          <img src="/fac-dss-fe/logo192.png" alt="SSU Logo" className="w-24 mx-auto mb-4" />
          
          <h1 className="text-2xl font-bold text-ssu-maroon">FAC-DSS</h1>
          <p className="text-gray-500 text-sm">Faculty Attendance Checker</p>
          
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-ssu-gold outline-none transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-ssu-maroon outline-none transition-all"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="w-full bg-ssu-maroon text-white font-bold py-3 rounded-lg hover:bg-red-900 transition-colors shadow-lg active:transform active:scale-95">
              LOGIN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;