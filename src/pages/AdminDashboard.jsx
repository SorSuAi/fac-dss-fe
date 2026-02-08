import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  ClipboardList, Calendar, Info, 
  CheckCircle, UserCheck, FileText, Settings, Users, AlertCircle
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; 
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout, apiUrl } = useContext(AuthContext);

  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('Pending'); 
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const remarkOptions = ["On Official Travel", "On-Leave", "Verbal Request", "No Reason"];

  useEffect(() => {
    fetchReports();
  }, [filter, startDate, endDate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/admin/reports`, { 
        params: { status: filter, startDate, endDate },
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Data from backend is now correctly assigned to state
      console.log("Fetched reports:", res.data); // Debug log to verify data structure
      setReports(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setLoading(false);
    }
  };

  const handleReview = async (reportId, remarks) => {
    try {
      await axios.patch(`${apiUrl}/admin/review-report/${reportId}`, 
        { status: 'Accepted', remarks },
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

    // Ensure these assets exist in your /public folder or remove if not needed
    // doc.addImage("/header.png", "PNG", 0, 0, pageWidth, 40);
    
    doc.setFontSize(16);
    doc.setTextColor(128, 0, 0); 
    doc.text("FACULTY ATTENDANCE REPORT", pageWidth / 2, 50, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Category: ${filter}`, 14, 62);
    doc.text(`Range: ${startDate || 'All'} to ${endDate || 'All'}`, 14, 68);

    const tableColumn = ["Instructor", "Subject", "Reported By", "Date/Time", "Final Remark"];
    const tableRows = reports.map(report => [
      report.faculty?.name || "N/A",
      report.subject?.subjectName || "N/A",
      report.student?.name || "Anonymous Student",
      new Date(report.createdAt).toLocaleString(),
      report.remarks || "Pending Review"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: 'grid',
      headStyles: { fillColor: [128, 0, 0] },
      styles: { fontSize: 8 },
    });

    doc.save(`FAC-DSS_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <nav className="bg-[#800000] text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="font-bold flex items-center gap-2 text-lg uppercase tracking-tight">
          <ClipboardList size={22} className="text-[#FFD700]" /> FAC-DSS Dean Portal
        </h1>
        <div className="flex items-center gap-4">
          <Link to="/management" className="flex items-center gap-2 text-[#FFD700] font-bold hover:text-white transition px-3 py-1 border border-[#FFD700] rounded-lg text-sm">
            <Settings size={16} /> SYSTEM MGMT
          </Link>
          <button onClick={logout} className="text-[#FFD700] font-bold bg-[#600000] px-4 py-1 rounded hover:bg-black transition">
            Logout
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-gray-800">Faculty Attendance Dashboard</h2>
              <p className="text-sm text-gray-500 mb-4">Validate student-reported faculty absences.</p>
              <button onClick={downloadPDF} className="flex items-center gap-2 bg-green-700 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-green-800 transition shadow-md">
                <FileText size={16} /> EXPORT SUMMARY
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-gray-200 rounded-lg p-1">
                {['Pending', 'Unconfirmed', 'Accepted'].map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition ${filter === s ? 'bg-[#800000] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}>
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-300 shadow-sm">
                <Calendar size={14} className="text-gray-400" />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs outline-none font-bold" />
                <span className="text-gray-400 font-bold">-</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs outline-none font-bold" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#800000] font-bold animate-pulse">Synchronizing Data...</div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <div key={report._id} className="bg-white rounded-xl shadow-sm border-l-4 border-[#800000] overflow-hidden hover:shadow-md transition">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase bg-orange-500">
                          {report.studentCount > 1 
                            ? `${report.studentCount} Students Reported` 
                            : `Reported by: ${report.student?.name || "Student"}`
                          }
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-[#800000]">{report.subject?.subjectName || 'Subject Not Found'}</h3>
                      <p className="text-sm font-medium text-gray-700">Instructor: <span className="font-bold">{report.faculty?.name || 'Unknown Instructor'}</span></p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Timestamp</p>
                       <p className="text-xs font-bold text-gray-600">
                         {new Date(report.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                       </p>
                    </div>
                  </div>

                  {filter === 'Pending' ? (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Decision Remarks (Decision Support)</p>
                      <div className="flex flex-wrap gap-2">
                        {remarkOptions.map((remark) => (
                          <button 
                            key={remark} 
                            onClick={() => handleReview(report._id, remark)}
                            className="text-[11px] font-bold border border-gray-300 px-3 py-1.5 rounded-md hover:bg-[#FFD700] hover:border-[#FFD700] hover:text-[#800000] transition-all"
                          >
                            {remark}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3 bg-red-50 p-2 rounded-lg border border-red-100">
                        <Info size={16} className="text-[#800000]" />
                        <p className="text-sm font-bold text-gray-700">
                          Status: <span className="text-[#800000]">{report.remarks}</span>
                        </p>
                      </div>
                      <div className="flex flex-col text-right">
                        <div className="flex items-center justify-end gap-2 text-xs font-bold text-gray-500">
                          <UserCheck size={14} className="text-green-600" />
                          Validated by: {report.reviewedBy?.name || 'System Admin'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-24 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Users size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No records found for this criteria.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;