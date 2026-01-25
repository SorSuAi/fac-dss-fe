import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { X, Lock, Save } from 'lucide-react';

const ChangePasswordModal = ({ onClose }) => {
  const { user } = useContext(AuthContext);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return alert("New passwords do not match!");
    }

    setLoading(true);
    // Use the variable logic for local vs prod URL we discussed
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    try {
      await axios.put(`${API_URL}/auth/update-password`, {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      
      alert("Password Changed Successfully!");
      onClose();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-ssu-maroon p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2"><Lock size={18}/> Change Password</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Old Password</label>
            <input type="password" required className="w-full p-3 border rounded-xl bg-gray-50"
              onChange={e => setPasswords({...passwords, oldPassword: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">New Password</label>
            <input type="password" required className="w-full p-3 border rounded-xl bg-gray-50"
              onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Confirm New Password</label>
            <input type="password" required className="w-full p-3 border rounded-xl bg-gray-50"
              onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full bg-ssu-maroon text-white font-bold py-3 rounded-xl hover:bg-red-900 transition flex justify-center gap-2">
            {loading ? "Updating..." : <><Save size={18}/> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;