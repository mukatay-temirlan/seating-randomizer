"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function SeatingApp() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [result, setResult] = useState(null);

  const getVal = (obj, key) => {
    const foundKey = Object.keys(obj).find(k => k.trim().toLowerCase() === key.toLowerCase());
    return foundKey ? obj[foundKey] : "";
  };

  const generateSeating = () => {
    if (students.length === 0 || rooms.length === 0) {
      alert("Please upload both Student and Room files first!");
      return;
    }

    let pool = [...students].sort(() => Math.random() - 0.5);
    let distribution = rooms.map(r => ({
      roomNumber: getVal(r, 'Room Number'),
      teacher: getVal(r, 'Teacher'),
      capacity: Number(getVal(r, 'Capacity')),
      assignedStudents: []
    }));

    let roomIndex = 0;
    while (pool.length > 0) {
      let room = distribution[roomIndex % distribution.length];
      if (room.assignedStudents.length < room.capacity) {
        const last = room.assignedStudents[room.assignedStudents.length - 1];
        let index = pool.findIndex(s => {
          if (!last) return true;
          return getVal(s, 'Subject') !== getVal(last, 'Subject') && 
                 getVal(s, 'Class') !== getVal(last, 'Class');
        });
        if (index === -1) index = pool.findIndex(s => !last || getVal(s, 'Subject') !== getVal(last, 'Subject'));
        if (index === -1) index = 0;
        room.assignedStudents.push(pool[index]);
        pool.splice(index, 1);
      }
      roomIndex++;
      if (distribution.every(r => r.assignedStudents.length >= r.capacity)) break;
    }
    setResult(distribution);
  };

  const getStats = (list) => {
    const stats = {};
    list.forEach(s => {
      const subj = getVal(s, 'Subject');
      const cls = getVal(s, 'Class');
      // Extract only the number from the class (e.g., "7A" becomes "7")
      const grade = cls.match(/\d+/) ? cls.match(/\d+/)[0] : cls;
      const key = `${grade}th grade ${subj}`;
      stats[key] = (stats[key] || 0) + 1;
    });
    return stats;
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto font-sans bg-slate-50 min-h-screen">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0.5cm; }
          .break-after-page { page-break-after: always; display: block; clear: both; }
          .no-print { display: none !important; }
          body { background: white !important; }
          .room-container { 
            height: 98vh; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between;
            border: 1px solid #000 !important;
          }
          table { font-size: 10px !important; }
          .stat-text { font-size: 9px !important; }
        }
      `}</style>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 print:hidden border-t-4 border-indigo-600">
        <h1 className="text-3xl font-black mb-1 text-indigo-950 text-center uppercase">KBO EXAM SEATING</h1>
        <p className="text-center text-indigo-600 mb-6 font-bold text-xs tracking-[0.2em]">ADMINISTRATION PANEL</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold mb-2 underline">1. STUDENTS (.xlsx)</h3>
            <input type="file" onChange={(e) => {
               const file = e.target.files[0];
               const reader = new FileReader();
               reader.onload = (evt) => {
                 const wb = XLSX.read(evt.target.result, { type: 'binary' });
                 setStudents(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
               };
               reader.readAsBinaryString(file);
            }} className="w-full"/>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold mb-2 underline">2. ROOMS (.xlsx)</h3>
            <input type="file" onChange={(e) => {
               const file = e.target.files[0];
               const reader = new FileReader();
               reader.onload = (evt) => {
                 const wb = XLSX.read(evt.target.result, { type: 'binary' });
                 setRooms(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
               };
               reader.readAsBinaryString(file);
            }} className="w-full"/>
          </div>
        </div>

        <button onClick={generateSeating} className="bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 w-full font-bold mb-2">GENERATE PLAN</button>
        {result && <button onClick={() => window.print()} className="bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 w-full font-bold">DOWNLOAD PDF / PRINT</button>}
      </div>

      {result && result.map((room, idx) => {
        const stats = getStats(room.assignedStudents);
        return (
          <div key={idx} className="room-container mb-10 bg-white break-after-page print:m-0">
            <div>
              <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-indigo-600">
                <h2 className="text-2xl font-black uppercase tracking-tighter">KBO EXAM SEATING | ROOM {room.roomNumber}</h2>
                <div className="text-right text-[10px]">
                  <p className="font-bold uppercase tracking-widest">{room.teacher}</p>
                  <p className="text-indigo-400 font-bold uppercase">Proctor</p>
                </div>
              </div>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase border-b border-black">
                    <th className="p-2">Seat</th>
                    <th className="p-2">Full Name</th>
                    <th className="p-2 text-center">Class</th>
                    <th className="p-2">Subject</th>
                    <th className="p-2 text-right">Student ID</th>
                  </tr>
                </thead>
                <tbody>
                  {room.assignedStudents.map((s, i) => (
                    <tr key={i} className="border-b border-slate-200 text-[10px]">
                      <td className="p-1.5 font-black text-indigo-600 border-r border-slate-100 w-8">{i + 1}</td>
                      <td className="p-1.5 font-bold uppercase">{getVal(s, 'First name')} {getVal(s, 'Last Name')}</td>
                      <td className="p-1.5 font-bold text-center w-12 italic">{getVal(s, 'Class')}</td>
                      <td className="p-1.5 font-semibold text-slate-500">{getVal(s, 'Subject')}</td>
                      <td className="p-1.5 text-right font-mono text-slate-400">012-{getVal(s, 'Student ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-white border-t-2 border-black">
              <div className="mb-4">
                <h4 className="font-black text-black text-[10px] mb-2 uppercase border-b-2 border-slate-100 pb-1">Subject Breakdown</h4>
                <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                  {Object.entries(stats).map(([label, count]) => (
                    <div key={label} className="flex justify-between stat-text border-b border-dotted border-slate-300">
                      <span className="uppercase">{label}:</span>
                      <span className="font-black">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-black">
                <div className="flex items-center gap-8">
                  <div className="text-[11px] font-black uppercase">
                    Total Participated: <span className="underline ml-2"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>
                  </div>
                  <div className="text-[11px] font-black uppercase flex items-center">
                    Proctor Signature: <div className="ml-2 w-48 border-b border-black h-6"></div>
                  </div>
                </div>
                <div className="text-[8px] font-bold text-slate-400 italic">
                  KBO-OFFICIAL | 012 | {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}