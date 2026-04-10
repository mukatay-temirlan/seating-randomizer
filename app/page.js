"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function SeatingApp() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [result, setResult] = useState(null);
  const [schoolId, setSchoolId] = useState("");

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

  const getSortedStats = (list) => {
    const stats = {};
    list.forEach(s => {
      const subj = getVal(s, 'Subject');
      const cls = getVal(s, 'Class');
      const gradeMatch = cls.match(/\d+/);
      const gradeNum = gradeMatch ? parseInt(gradeMatch[0]) : 99;
      const key = `${gradeNum}th grade ${subj}`;
      
      if (!stats[key]) {
        stats[key] = { label: key, count: 0, grade: gradeNum, subject: subj };
      }
      stats[key].count++;
    });

    return Object.values(stats).sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      return a.subject.localeCompare(b.subject);
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <style jsx global>{`
        * { font-family: "Times New Roman", Times, serif !important; }
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

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 print:hidden border-t-4 border-black">
        <h1 className="text-3xl font-bold mb-1 text-center uppercase">KBO EXAM SEATING</h1>
        
        <div className="my-6 max-w-xs mx-auto text-center">
            <label className="block text-xs font-bold uppercase mb-1 tracking-widest">Enter School ID</label>
            <input 
                type="text" 
                placeholder="e.g. 012" 
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full border-2 border-slate-200 p-2 rounded-lg text-center font-bold outline-none"
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold mb-2 text-sm uppercase underline">1. STUDENTS (.xlsx)</h3>
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
            <h3 className="font-bold mb-2 text-sm uppercase underline">2. ROOMS (.xlsx)</h3>
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

        <button onClick={generateSeating} className={`py-3 rounded-lg w-full font-bold mb-2 transition-all border-2 border-black ${isOverCapacity ? 'bg-red-600 text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
          GENERATE PLAN
        </button>
        
        {result && <button onClick={() => window.print()} className="bg-black text-white py-3 rounded-lg w-full font-bold">DOWNLOAD PDF / PRINT</button>}
      </div>

      {result && result.map((room, idx) => {
        const sortedStats = getSortedStats(room.assignedStudents);
        return (
          <div key={idx} className="room-container mb-10 bg-white break-after-page print:m-0">
            <div>
              <div className="bg-white text-black p-4 flex justify-between items-center border-b-4 border-black">
                <h2 className="text-3xl font-bold uppercase tracking-tighter">KBO EXAM SEATING | ROOM {room.roomNumber}</h2>
                <div className="text-right">
                  <p className="font-bold uppercase text-sm">{room.teacher}</p>
                  <p className="font-bold uppercase text-[10px]">Proctor</p>
                </div>
              </div>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-black text-[11px] font-bold uppercase border-b-2 border-black">
                    <th className="p-2 border-r border-black w-8">Seat</th>
                    <th className="p-2 border-r border-black">Full Name</th>
                    <th className="p-2 text-center border-r border-black w-16">Class</th>
                    <th className="p-2 border-r border-black w-28">Subject</th>
                    <th className="p-2 border-r border-black text-right w-28">Student ID</th>
                    <th className="p-2 text-center w-36">Student Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {room.assignedStudents.map((s, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="p-2 font-bold text-lg border-r border-slate-300 w-10">{i + 1}</td>
                      <td className="p-2 font-bold uppercase text-sm">{getVal(s, 'First name')} {getVal(s, 'Last Name')}</td>
                      <td className="p-2 font-bold text-center text-sm italic border-x border-slate-300">{getVal(s, 'Class')}</td>
                      <td className="p-2 font-bold text-sm border-r border-slate-300">{getVal(s, 'Subject')}</td>
                      <td className="p-2 text-right font-normal text-xs border-r border-slate-300">
                        {schoolId ? `${schoolId}-` : ""}{getVal(s, 'Student ID')}
                      </td>
                      <td className="p-2 align-bottom">
                        <div className="border-b border-black w-full h-6"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-white border-t-4 border-black">
              <div className="mb-4">
                <h4 className="font-bold text-black text-xs mb-2 uppercase border-b-2 border-black pb-1">Subject Breakdown</h4>
                <div className="grid grid-cols-2 gap-x-12 gap-y-1">
                  {sortedStats.map((stat) => (
                    <div key={stat.label} className="flex justify-between text-[12px] border-b border-slate-300 uppercase font-bold">
                      <span>{stat.label}:</span><span className="font-bold">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-black">
                <div className="flex items-center gap-10">
                  <div className="text-sm font-bold uppercase">
                    Total Participated: <span className="underline ml-2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                  </div>
                  <div className="text-sm font-bold uppercase flex items-center">
                    Proctor Signature: <div className="ml-2 w-64 border-b-2 border-black h-8"></div>
                  </div>
                </div>
                <div className="text-[10px] font-bold italic">
                  KBO-OFFICIAL {schoolId ? `| ${schoolId}` : ""}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}