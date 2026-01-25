// App.jsx
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react'; // 1. Ensure useContext is imported
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import Header from './components/Header';
import FacultyManagement from './pages/FacultyManagement';
import SubjectManagement from './pages/SubjectManagement';
import StudentManagement from './pages/StudentManagement';
import Reports from './pages/Reports';
import ScanGuard from './pages/ScannerGuard';


// Custom Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function AppContent() {
  // 2. Extract 'user' here so it's defined for your routes
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/scan/:type" element={<ScanGuard />} />
        <Route 
          path="/faculty-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/student-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['dean', 'hr']}>
              {/* This is where the error was happening - user is now defined! */}
              {user?.role === 'hr' ? <HRDashboard /> : <AdminDashboard />}
            </ProtectedRoute>
          } 
        />

        {/* Management Dashboard Route */}
        <Route 
          path="/management" 
          element={
            <ProtectedRoute allowedRoles={['dean', 'hr']}>
              <ManagementDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/manage-faculty" element={<ProtectedRoute allowedRoles={['dean', 'hr']}><FacultyManagement /></ProtectedRoute>} />
        <Route path="/manage-subjects" element={<ProtectedRoute allowedRoles={['dean', 'hr']}><SubjectManagement /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['dean', 'hr']}><Reports /></ProtectedRoute>} />
        <Route path="/manage-students" element={<ProtectedRoute allowedRoles={['dean', 'hr']}><StudentManagement /></ProtectedRoute>} />


      </Routes>
      
    </Router>
  );
}

// Wrapper to ensure AuthProvider is above the context consumption
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;