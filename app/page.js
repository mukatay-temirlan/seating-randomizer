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

  const totalSeats = rooms.reduce((acc, r) => acc + (Number(getVal(r, 'Capacity')) || 0), 0);
  const studentCount = students.length;
  const isOverCapacity = studentCount > totalSeats;

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
            height: 97vh; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between;
            border: 2px solid #000 !important;
            padding: 2px;
          }
        }
      `}</style>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 print:hidden border-t-4 border-indigo-600">
        <h1 className="text-3xl font-black mb-1 text-indigo-950 text-center uppercase">KBO EXAM SEATING</h1>
        <p className="text-center text-indigo-600 mb-6 font-bold text-xs tracking-[0.2em]">ADMINISTRATION PANEL</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold mb-2 text-sm uppercase underline">1. STUDENTS</h3>
            <input type="file" onChange={(e) => {
               const file = e.target.files[0];
               const reader = new FileReader();
               reader.onload = (evt) => {
                 const wb = XLSX.read(evt.target.result, { type: 'binary' });
                 setStudents(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
               };
               reader.readAsBinaryString(file);
            }} className="w-full text-xs"/>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold mb-2 text-sm uppercase underline">2. ROOMS</h3>
            <input type="file" onChange={(e) => {
               const file = e.target.files[0];
               const reader = new FileReader();
               reader.onload = (evt) => {
                 const wb = XLSX.read(evt.target.result, { type: 'binary' });
                 setRooms(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
               };
               reader.readAsBinaryString(file);
            }} className="w-full text-xs"/>
          </div>
        </div>

        {(students.length > 0 && rooms.length > 0) && (
          <div className={`mb-4 p-4 rounded-lg flex justify-between items-center ${isOverCapacity ? 'bg-red-50 border-2 border-red-200' : 'bg-emerald-50 border-2 border-emerald-200'}`}>
            <div className="text-sm font-bold">
              <p className={isOverCapacity ? 'text-red-700' : 'text-emerald-700'}>
                {isOverCapacity ? '⚠️ NOT ENOUGH SEATS!' : '✅ CAPACITY OK'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight">
                Students: {studentCount} | Total Seats: {totalSeats}
              </p>
            </div>
          </div>
        )}

        <button 
          onClick={generateSeating} 
          className={`py-3 rounded-lg w-full font-bold mb-2 transition-all ${isOverCapacity ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}
        >
          GENERATE PLAN
        </button>
        
        {result && <button onClick={() => window.print()} className="bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 w-full font-bold">DOWNLOAD PDF / PRINT</button>}
      </div>

      {result && result.map((room, idx) => {
        const stats = getStats(room.assignedStudents);
        return (
          <div key={idx} className="room-container mb-10 bg-white break-after-page print:m-0">
            <div>
              <div className="bg-black text-white p-4 flex justify-between items-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter">KBO EXAM SEATING | ROOM {room.roomNumber}</h2>
                <div className="text-right">
                  <p className="font-black uppercase tracking-widest text-sm">{room.teacher}</p>
                  <p className="text-indigo-400 font-bold uppercase text-[10px]">Proctor</p>
                </div>
              </div>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-black text-[11px] font-black uppercase border-b-2 border-black">
                    <th className="p-2 border-r border-black">Seat</th>
                    <th className="p-2 border-r border-black">Full Name</th>
                    <th className="p-2 text-center border-r border-black">Class</th>
                    <th className="p-2 border-r border-black">Subject</th>
                    <th className="p-2 text-right">Student ID</th>
                  </tr>
                </thead>
                <tbody>
                  {room.assignedStudents.map((s, i) => (
                    <tr key={i} className="border-b border-slate-300">
                      <td className="p-2 font-black text-indigo-700 text-lg border-r border-slate-200 w-10">{i + 1}</td>
                      <td className="p-2 font-black uppercase text-sm">{getVal(s, 'First name')} {getVal(s, 'Last Name')}</td>
                      <td className="p-2 font-black text-center text-sm italic border-x border-slate-200 bg-slate-50">{getVal(s, 'Class')}</td>
                      <td className="p-2 font-bold text-slate-700 text-sm">{getVal(s, 'Subject')}</td>
                      <td className="p-2 text-right font-mono font-black text-black text-xs">012-{getVal(s, 'Student ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-white border-t-4 border-black">
              <div className="mb-4">
                <h4 className="font-black text-black text-xs mb-2 uppercase border-b-2 border-black pb-1">Subject Breakdown</h4>
                <div className="grid grid-cols-2 gap-x-12 gap-y-1">
                  {Object.entries(stats).map(([label, count]) => (
                    <div key={label} className="flex justify-between text-[11px] border-b border-slate-200 uppercase font-bold">
                      <span>{label}:</span><span className="font-black text-indigo-700">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-black">
                <div className="flex items-center gap-10">
                  <div className="text-sm font-black uppercase">
                    Total Participated: <span className="underline ml-2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                  </div>
                  <div className="text-sm font-black uppercase flex items-center">
                    Proctor Signature: <div className="ml-2 w-56 border-b-2 border-black h-8"></div>
                  </div>
                </div>
                <div className="text-[9px] font-black text-slate-500 font-mono">
                  KBO-OFFICIAL | 012
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}