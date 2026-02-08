import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; 
import { Download, Filter, FileText, Calendar } from 'lucide-react';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [reportType, setReportType] = useState('attendance'); 
  const [semester, setSemester] = useState('1st Sem 2025-2026');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Date States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const API_URL = 'https://fac-dss-be.onrender.com/api';

  // Re-fetch when reportType, semester, or dates change
  useEffect(() => {
    fetchData();
  }, [reportType, semester, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setData([]); 
    try {
      let endpoint = '';
      let params = { semester }; // Base params

      if (reportType === 'attendance') {
        endpoint = `${API_URL}/admin/reports`;
        // Include status and date range for absence reports
        params = { ...params, status: 'Accepted', startDate, endDate }; 
      } else if (reportType === 'faculty') {
        endpoint = `${API_URL}/admin/users`;
        params = { role: 'faculty' }; 
      } else if (reportType === 'students') {
        endpoint = `${API_URL}/admin/users`;
        params = { role: 'student' };
      }

      const res = await axios.get(endpoint, { 
        params, 
        headers: { Authorization: `Bearer ${user.token}` } 
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFillColor(128, 0, 0); // SSU Maroon
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(`SSU ${reportType.toUpperCase()} REPORT`, 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Semester: ${semester}`, 14, 28);
    // Add date range to PDF if present
    if (startDate || endDate) {
        doc.text(`Period: ${startDate || '...'} to ${endDate || '...'}`, 14, 33);
    } else {
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 33);
    }

    let columns = [];
    let rows = [];

    if (reportType === 'attendance') {
      columns = ["Date", "Faculty", "Subject", "Reason"];
      rows = data.map(d => [
        new Date(d.createdAt).toLocaleDateString(),
        d.faculty?.name || 'Unknown',
        `${d.subject?.subjectCode || 'N/A'}`,
        d.remarks
      ]);
    } else if (reportType === 'faculty') {
      columns = ["Name", "ID Number", "Department", "Email"];
      rows = data.map(d => [d.name, d.idNumber || '-', d.department || '-', d.email]);
    } else if (reportType === 'students') {
      columns = ["Name", "ID Number", "Course/Sec", "Email"];
      rows = data.map(d => [d.name, d.idNumber || '-', `${d.course || ''} ${d.section || ''}`, d.email]);
    }

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [128, 0, 0], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`SSU_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Analytics & Reports" />
      
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col gap-6">
          
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              {/* Report Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <FileText size={12}/> Report Type
                </label>
                <select 
                  className="block w-full md:w-48 p-2.5 bg-gray-50 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-ssu-maroon outline-none"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="attendance">Absence Reports</option>
                  <option value="faculty">Faculty Masterlist</option>
                  <option value="students">Student Masterlist</option>
                </select>
              </div>

              {/* Semester */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Filter size={12}/> Semester
                </label>
                <select 
                  className="block w-full md:w-48 p-2.5 bg-gray-50 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-ssu-maroon outline-none"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="1st Sem 2025-2026">1st Sem 2025-2026</option>
                  <option value="2nd Sem 2025-2026">2nd Sem 2025-2026</option>
                </select>
              </div>

              {/* Date Filters - Conditionally visible for Attendance */}
              {reportType === 'attendance' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Calendar size={12}/> Start Date
                    </label>
                    <input 
                      type="date"
                      className="block p-2 bg-gray-50 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-ssu-maroon outline-none"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Calendar size={12}/> End Date
                    </label>
                    <input 
                      type="date"
                      className="block p-2 bg-gray-50 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-ssu-maroon outline-none"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={downloadPDF}
              disabled={data.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white transition shadow-sm self-end ${
                data.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              <Download size={18} /> Export PDF
            </button>
          </div>
        </div>

        {/* Data Table Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
              <tr>
                <th className="p-4 w-12">#</th>
                {reportType === 'attendance' && <><th className="p-4">Faculty</th><th className="p-4">Subject</th><th className="p-4">Remarks</th><th className="p-4">Date</th></>}
                {reportType === 'faculty' && <><th className="p-4">Name</th><th className="p-4">Department</th><th className="p-4">ID Number</th><th className="p-4">Email</th></>}
                {reportType === 'students' && <><th className="p-4">Name</th><th className="p-4">Course/Sec</th><th className="p-4">Email</th><th className="p-4">ID</th></>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400 font-medium">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                    Fetching data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400 italic">
                    No records found for the selected filters.
                  </td>
                </tr>
              ) : (
               data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-400 text-xs font-mono">{idx + 1}</td>
                  
                  {reportType === 'attendance' && <>
                    <td className="p-4 font-bold text-gray-800">{item.faculty?.name || "Unknown"}</td>
                    <td className="p-4">
                      <div className="font-bold text-xs">{item.subject?.subjectCode}</div>
                      <div className="text-[10px] text-gray-500">{item.subject?.subjectName}</div>
                    </td>
                    <td className="p-4"><span className="bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded text-xs font-bold">{item.remarks}</span></td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                  </>}

                  {/* Faculty/Student mapping remains unchanged as per your original file */}
                  {reportType === 'faculty' && <>
                    <td className="p-4 font-bold text-gray-800">{item.name}</td>
                    <td className="p-4">{item.department || '-'}</td>
                    <td className="p-4 font-mono text-xs bg-gray-50 inline-block rounded px-1 mt-3">{item.idNumber}</td>
                    <td className="p-4 text-blue-600 underline text-xs">{item.email}</td>
                  </>}

                  {reportType === 'students' && <>
                    <td className="p-4 font-bold text-gray-800">{item.name}</td>
                    <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">{item.course} {item.section}</span></td>
                    <td className="p-4 text-gray-500 text-xs">{item.email}</td>
                    <td className="p-4 font-mono text-xs">{item.idNumber}</td>
                  </>}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Reports;