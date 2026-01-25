import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  ClipboardList, Filter, Calendar, Info, 
  CheckCircle, UserCheck, FileText, Settings
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // Import it as 'autoTable'
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  
  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const remarkOptions = ["On Official Travel", "On-Leave", "Verbal Request", "No Reason"];

  useEffect(() => {
    fetchReports();
  }, [filter, startDate, endDate]); // Trigger fetch on filter or date change

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`https://fac-dss-be.onrender.com/api/admin/reports`, {
        params: { status: filter, startDate, endDate },
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReports(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reports");
      setLoading(false);
    }
  };

  const handleReview = async (reportId, status, remarks) => {
    try {
      await axios.patch(`https://fac-dss-be.onrender.com/api/admin/review-report/${reportId}`, 
        { status, remarks, reviewedBy: user.id }, // Send current user ID as reviewer
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchReports();
    } catch (err) {
      alert("Error updating report");
    }
  };

  const downloadPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Add Header Banner (Ensure file is in /public)
  doc.addImage("/header.png", "PNG", 0, 0, pageWidth, 40);

  // 2. Add Title & Metadata
  doc.setFontSize(16);
  doc.setTextColor(128, 0, 0); // SSU Maroon
  doc.text("FACULTY ATTENDANCE REPORT", pageWidth / 2, 50, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Reset to Black
  doc.text(`Status: ${filter}`, 14, 62);
  doc.text(`Range: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 68);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 74);

  // 3. Create the Table (Fixed: calling autoTable(doc, options))
  const tableColumn = ["Instructor", "Subject", "Reported By", "Date/Time", "Remarks"];
  const tableRows = reports.map(report => [
    report.faculty?.name || "N/A",
    report.subject?.subjectName || "N/A",
    report.student?.name || "N/A",
    new Date(report.createdAt).toLocaleString(),
    report.remarks || "Pending"
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    theme: 'grid',
    headStyles: { fillColor: [128, 0, 0] }, // SSU Maroon
    styles: { fontSize: 8 },
  });

  // 4. Add Footer Image
  doc.addImage("/footer.png", "PNG", 0, pageHeight - 25, pageWidth, 25);

  // 5. Save
  doc.save(`SSU_Report_${filter}_${new Date().toLocaleDateString()}.pdf`);
};

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-ssu-maroon text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="font-bold flex items-center gap-2 text-lg">
          <ClipboardList size={22} /> FAC-DSS Dean Portal
        </h1>
        {/* <button onClick={logout} className="text-ssu-gold font-bold bg-maroon-800 px-4 py-1 rounded">Logout</button> */}
        <div className="flex items-center gap-4">
          <Link 
            to="/management" 
            className="flex items-center gap-2 text-ssu-gold font-bold hover:text-white transition px-3 py-1 border border-ssu-gold rounded-lg text-sm"
          >
            <Settings size={16} /> SYSTEM MGMT
          </Link>
          <button onClick={logout} className="text-ssu-gold font-bold bg-maroon-800 px-4 py-1 rounded hover:bg-red-900">
            Logout
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Attendance Review</h2>
              <p className="text-sm text-gray-500">Manage and validate faculty absence reports.</p>
              <button 
                onClick={downloadPDF}
                className="mt-2 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-md"
              >
                <FileText size={16} /> DOWNLOAD PDF REPORT
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['Pending', 'Accepted', 'Rejected'].map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-4 py-2 rounded-md text-xs font-bold transition ${filter === s ? 'bg-ssu-maroon text-white shadow' : 'text-gray-500'}`}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Date Range Filters */}
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg border border-gray-200">
                <Calendar size={16} className="text-gray-400" />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                <span className="text-gray-400">-</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs outline-none" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">Fetching records...</div>
        ) : (
          <div className="grid gap-6">
            {reports.map((report) => (
              <div key={report._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-xl text-ssu-maroon tracking-tight">
                        {report.subject?.subjectName || "Subject Not Found"}
                      </h3>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                        <p className="text-sm font-medium">Instructor: <span className="text-gray-900 font-bold">{report.faculty?.name}</span></p>
                        <p className="text-sm font-medium">By: <span className="text-gray-900">{report.student?.name}</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Created At</p>
                       <p className="text-xs font-bold text-gray-700">
                        {/* Fix for Invalid Date: Ensure createdAt exists */}
                         {report.createdAt ? new Date(report.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                       </p>
                    </div>
                  </div>

                  {filter === 'Pending' ? (
                    <div className="mt-6 pt-6 border-t border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">Decision Remarks</p>
                      <div className="flex flex-wrap gap-2">
                        {remarkOptions.map((remark) => (
                          <button key={remark} onClick={() => handleReview(report._id, 'Accepted', remark)}
                            className="text-xs font-bold border-2 border-gray-100 px-4 py-2 rounded-lg hover:border-ssu-maroon hover:text-ssu-maroon transition-all">
                            {remark}
                          </button>
                        ))}
                        <button onClick={() => handleReview(report._id, 'Rejected', 'Invalid')}
                          className="text-xs font-bold border-2 border-red-50 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 pt-4 border-t border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3 bg-ssu-maroon/5 p-3 rounded-lg border border-ssu-maroon/10">
                        <Info size={16} className="text-ssu-maroon" />
                        <p className="text-sm font-bold text-gray-700">
                          Remark: <span className="text-ssu-maroon">{report.remarks}</span>
                        </p>
                      </div>
                      
                      <div className="flex flex-col text-right">
                        <div className="flex items-center justify-end gap-2 text-xs font-bold text-gray-500">
                          <UserCheck size={14} className="text-green-600" />
                          Reviewed by: {report.reviewedBy?.name || 'Dean'}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">
                          UPDATED: {new Date(report.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">No records found for this criteria.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;