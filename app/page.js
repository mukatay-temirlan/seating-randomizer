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

    // EQUAL DISTRIBUTION LOGIC (Round Robin)
    let roomIndex = 0;
    while (pool.length > 0) {
      let room = distribution[roomIndex % distribution.length];
      
      if (room.assignedStudents.length < room.capacity) {
        const last = room.assignedStudents[room.assignedStudents.length - 1];
        
        // Find best student (No same subject/class)
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
      // Safety break if all rooms are full but students remain
      if (distribution.every(r => r.assignedStudents.length >= r.capacity)) break;
    }
    setResult(distribution);
  };

  const getStats = (list) => {
    const stats = { subjects: {}, classes: {} };
    list.forEach(s => {
      const subj = getVal(s, 'Subject');
      const cls = getVal(s, 'Class');
      stats.subjects[subj] = (stats.subjects[subj] || 0) + 1;
      stats.classes[cls] = (stats.classes[cls] || 0) + 1;
    });
    return stats;
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto font-sans bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 print:hidden border-t-4 border-indigo-600">
        <h1 className="text-3xl font-black mb-1 text-indigo-950 text-center uppercase">BTS-3 Exam Seating</h1>
        <p className="text-center text-indigo-600 mb-6 font-bold text-xs tracking-[0.2em]">ADMINISTRATION PANEL</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-sm text-slate-700 mb-2">1. STUDENTS (.xlsx)</h3>
            <input type="file" onChange={(e) => {
               const file = e.target.files[0];
               const reader = new FileReader();
               reader.onload = (evt) => {
                 const wb = XLSX.read(evt.target.result, { type: 'binary' });
                 setStudents(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
               };
               reader.readAsBinaryString(file);
            }} className="text-xs block w-full"/>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-sm text-slate-700 mb-2">2. ROOMS (.xlsx)</h3>
            <input type="file" onChange={(e) => {
               const file = e.target.files[0];
               const reader = new FileReader();
               reader.onload = (evt) => {
                 const wb = XLSX.read(evt.target.result, { type: 'binary' });
                 setRooms(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
               };
               reader.readAsBinaryString(file);
            }} className="text-xs block w-full"/>
          </div>
        </div>

        <button onClick={generateSeating} className="bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 w-full font-bold transition-all mb-2">GENERATE PLAN</button>
        {result && <button onClick={() => window.print()} className="bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 w-full font-bold transition-all">DOWNLOAD PDF / PRINT</button>}
      </div>

      {result && result.map((room, idx) => {
        const stats = getStats(room.assignedStudents);
        return (
          <div key={idx} className="mb-10 bg-white border border-slate-300 overflow-hidden break-after-page print:m-0 print:border-0">
            <div className="bg-black text-white p-6 flex justify-between items-center border-b-4 border-indigo-600">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Room {room.roomNumber}</h2>
              <div className="text-right">
                <p className="font-bold text-lg">{room.teacher}</p>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Lead Proctor</p>
              </div>
            </div>
            
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                  <th className="p-3 border-b">Seat</th>
                  <th className="p-3 border-b">Full Name</th>
                  <th className="p-3 border-b">Class</th>
                  <th className="p-3 border-b">Subject</th>
                  <th className="p-3 border-b text-right">Student ID</th>
                </tr>
              </thead>
              <tbody>
                {room.assignedStudents.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100 text-xs">
                    <td className="p-3 font-black text-indigo-600">{i + 1}</td>
                    <td className="p-3 font-bold uppercase">{getVal(s, 'First name')} {getVal(s, 'Last Name')}</td>
                    <td className="p-3 font-bold">{getVal(s, 'Class')}</td>
                    <td className="p-3 font-semibold text-slate-500">{getVal(s, 'Subject')}</td>
                    <td className="p-3 text-right font-mono text-slate-400">012-{getVal(s, 'Student ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-8 text-[10px]">
                <div>
                  <h4 className="font-black text-indigo-900 mb-2 uppercase border-b border-indigo-100 pb-1">Subject Breakdown</h4>
                  {Object.entries(stats.subjects).map(([name, count]) => (
                    <div key={name} className="flex justify-between py-0.5 border-b border-dotted border-slate-300">
                      <span>{name}</span><span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-black text-indigo-900 mb-2 uppercase border-b border-indigo-100 pb-1">Class Breakdown</h4>
                  {Object.entries(stats.classes).map(([name, count]) => (
                    <div key={name} className="flex justify-between py-0.5 border-b border-dotted border-slate-300">
                      <span>Class {name}</span><span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex justify-between items-end border-t-2 border-slate-900 pt-4">
                <div className="text-[10px] font-bold text-slate-500">
                  GENERATED ON: {new Date().toLocaleDateString()}
                </div>
                <div className="flex gap-12">
                   <div className="text-center">
                     <div className="w-40 border-b border-black h-8 mb-1"></div>
                     <p className="text-[9px] font-bold uppercase">Proctor Signature</p>
                   </div>
                   <div className="text-center">
                     <div className="w-40 border-b border-black h-8 mb-1"></div>
                     <p className="text-[9px] font-bold uppercase">Admin Signature</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}