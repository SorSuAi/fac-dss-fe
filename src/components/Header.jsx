import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, BookOpen, FileText, LogOut, Settings, BackpackIcon, ArrowLeftIcon, ArrowRight } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal'; // Import the new modal

const Header = ({ title }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false); // State for modal

  const navItems = [
    { name: 'Reports', path: '/reports', icon: <FileText size={18} /> },
    { name: 'Faculty', path: '/manage-faculty', icon: <Users size={18} /> },
    { name: 'Students', path: '/manage-students', icon: <Users size={18} /> },
    { name: 'Subjects', path: '/manage-subjects', icon: <BookOpen size={18} /> },
    // Only show "System" to HR or Dean
    { name: 'System', path: '/management', icon: <Settings size={18} /> }, 
    { name: 'Back', path: '/admin-dashboard', icon: <ArrowRight size={18} /> },
  ];

  return (
    <nav className="bg-ssu-maroon text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Branding */}
        <div className="flex items-center gap-3">
          {/* <img src="/logo.png" alt="SSU" className="w-8 h-8"/> */}
          <div>
            <h1 className="font-bold text-lg leading-tight">FAC-DSS ADMIN</h1>
            <p className="text-[10px] text-ssu-gold font-bold uppercase tracking-wider">
              {title || 'Decision Support System'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 bg-maroon-800/50 p-1 rounded-lg overflow-x-auto max-w-full">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition whitespace-nowrap ${
                location.pathname === item.path 
                  ? 'bg-ssu-gold text-ssu-maroon shadow-sm' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.icon} {item.name}
            </Link>
          ))}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold">{user?.name}</p>
            <p className="text-[10px] opacity-70 uppercase">{user?.role}</p>
          </div>
          <button 
               onClick={() => setShowPasswordModal(true)} 
               className="bg-black/20 hover:bg-black/40 p-2 rounded-full transition"
               title="Change Password"
             >
               <Settings size={18} />
             </button>
          <button onClick={logout} className="bg-black/20 hover:bg-black/40 p-2 rounded-full transition">
            <LogOut size={16} />
          </button>
        </div>
      </div>
      {/* Render Modal if True */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </nav>
  );
};

export default Header;