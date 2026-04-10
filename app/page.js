"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function SeatingApp() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [result, setResult] = useState(null);

  const generateSeating = () => {
    let pool = [...students].sort(() => Math.random() - 0.5);
    let distribution = [];

    rooms.sort((a, b) => b.Capacity - a.Capacity).forEach(room => {
      let roomAssignment = { ...room, assignedStudents: [] };
      
      for (let i = 0; i < room.Capacity; i++) {
        if (pool.length === 0) break;

        const last = roomAssignment.assignedStudents[roomAssignment.assignedStudents.length - 1];

        // LOGIC: No same Subject AND No same Class together
        let index = pool.findIndex(s => {
          if (!last) return true;
          return s.Subject !== last.Subject && s.Class !== last.Class;
        });

        if (index === -1) {
          index = pool.findIndex(s => !last || s.Subject !== last.Subject);
        }

        if (index === -1) index = 0;

        roomAssignment.assignedStudents.push(pool[index]);
        pool.splice(index, 1);
      }
      distribution.push(roomAssignment);
    });
    setResult(distribution);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      type === 'students' ? setStudents(data) : setRooms(data);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans bg-slate-50 min-h-screen">
      <div className="bg-white p-8 rounded-2xl shadow-xl mb-8 print:shadow-none print:p-0">
        <h1 className="text-4xl font-black mb-2 text-indigo-950 text-center uppercase">Exam Seating Manager</h1>
        <p className="text-center text-indigo-600 mb-8 font-bold tracking-widest">SCHOOL ID: 012</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 print:hidden">
          <div className="bg-indigo-50 p-6 rounded-xl border-2 border-indigo-100">
            <h3 className="font-black text-indigo-900 mb-4 flex items-center">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">1</span>
              STUDENT LIST (.xlsx)
            </h3>
            <input type="file" onChange={(e) => handleFileUpload(e, 'students')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"/>
            <div className="mt-4 flex flex-wrap gap-2">
              {['First name', 'Last Name', 'Class', 'Student ID', 'Subject'].map(h => (
                <span key={h} className="text-[10px] bg-white px-2 py-1 rounded border border-indigo-200 text-indigo-700 font-bold">{h}</span>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-xl border-2 border-emerald-100">
            <h3 className="font-black text-emerald-900 mb-4 flex items-center">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">2</span>
              ROOM LIST (.xlsx)
            </h3>
            <input type="file" onChange={(e) => handleFileUpload(e, 'rooms')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"/>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Room Number', 'Teacher', 'Capacity'].map(h => (
                <span key={h} className="text-[10px] bg-white px-2 py-1 rounded border border-emerald-200 text-emerald-700 font-bold">{h}</span>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={generateSeating}
          className="bg-indigo-900 text-white px-8 py-4 rounded-xl hover:bg-black w-full font-black text-lg shadow-lg hover:shadow-indigo-200 transition-all active:scale-[0.98] print:hidden"
        >
          GENERATE SEATING PLAN
        </button>
      </div>

      {result && result.map((room, idx) => (
        <div key={idx} className="mb-12 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden break-after-page print:shadow-none print:border-slate-300">
          <div className="bg-slate-900 text-white p-8 flex justify-between items-end">
            <div>
              <p className="text-indigo-400 font-bold tracking-widest text-xs mb-1 uppercase">Classroom Assignment</p>
              <h2 className="text-5xl font-black tracking-tighter">ROOM {room['Room Number']}</h2>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{room.Teacher}</p>
              <p className="text-slate-400 font-mono text-sm uppercase">Proctor In Charge</p>
            </div>
          </div>
          
          <div className="p-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-black">
                  <th className="p-4 border-b">Seat</th>
                  <th className="p-4 border-b">Full Name</th>
                  <th className="p-4 border-b text-center">Class</th>
                  <th className="p-4 border-b">Subject</th>
                  <th className="p-4 border-b text-right">Student ID</th>
                </tr>
              </thead>
              <tbody>
                {room.assignedStudents.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-indigo-600 text-xl w-16">{i + 1}</td>
                    <td className="p-4 font-bold text-slate-800 uppercase text-sm">
                      {s['First name']} {s['Last Name']}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-black text-xs border border-amber-200">
                        {s.Class}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-indigo-700 text-sm">
                      {s.Subject}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-400 text-xs">
                      012-{s['Student ID']}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Students in Room: {room.assignedStudents.length}</p>
          </div>
        </div>
      ))}
    </div>
  );
}