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

      {/* ADMIN PANEL */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 print:hidden border-t-4 border-indigo-600">
        <h1 className="text-3xl font-black mb-1 text-indigo-950 text-center uppercase">KBO EXAM SEATING</h1>
        <p className="text-center text-indigo-600 mb-6 font-bold text-xs tracking-[0.2em]">ADMINISTRATION PANEL</p>
        
        <div className="my-6 max-w-xs mx-auto text-center">
            <label className="block text-xs font-black text-indigo-600 uppercase mb-1 tracking-widest">Enter School ID</label>
            <input 
                type="text" 
                placeholder="e.g. 012" 
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full border-2 border-indigo-100 p-2 rounded-lg text-center font-black focus:border-indigo-600 outline-none transition-all"
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Section 1: Rooms */}
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="font-black mb-2 text-indigo-900 uppercase">1. Define Classrooms</h3>
            <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">
              Upload an <strong>.xlsx</strong> or <strong>.csv</strong> file with room data.<br/>
              <span className="text-indigo-600 font-bold">Required columns:</span> "Room Number", "Capacity". <br/>
              <span className="text-slate-400 font-bold">Optional:</span> "Teacher" (Supervisor).
            </p>
            <input type="file" onChange={(e) => {
               const file = e.target.files[0];
               const reader = new FileReader();
               reader.onload = (evt) => {
                 const wb = XLSX.read(evt.target.result, { type: 'binary' });
                 setRooms(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
               };
               reader.readAsBinaryString(file);
            }} className="w-full text-xs border border-dashed border-slate-300 p-2 bg-white rounded cursor-pointer"/>
          </div>

          {/* Section 2: Students */}
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="font-black mb-2 text-indigo-900 uppercase">2. Upload Student List</h3>
            <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">
              Upload an <strong>.xlsx</strong> or <strong>.csv</strong> file with student data.<br/>
              <span className="text-indigo-600 font-bold">Required columns:</span> "First Name", "Last Name", "Class", "Subject", "Student ID".
            </p>
            <input type="file" onChange={(e) => {
               const file = e.target.files[0];
               const reader = new FileReader();
               reader.onload = (evt) => {
                 const wb = XLSX.read(evt.target.result, { type: 'binary' });
                 setStudents(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
               };
               reader.readAsBinaryString(file);
            }} className="w-full text-xs border border-dashed border-slate-300 p-2 bg-white rounded cursor-pointer"/>
          </div>
        </div>

        {(students.length > 0 && rooms.length > 0) && (
          <div className={`mb-4 p-4 rounded-lg flex justify-between items-center ${isOverCapacity ? 'bg-red-50 border-2 border-red-200' : 'bg-emerald-50 border-2 border-emerald-200'}`}>
            <div className="text-sm font-bold">
              <p className={isOverCapacity ? 'text-red-700' : 'text-emerald-700'}>
                {isOverCapacity ? '⚠️ NOT ENOUGH SEATS!' : '✅ CAPACITY OK'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight font-black">
                Students: {studentCount} | Total Seats: {totalSeats}
              </p>
            </div>
          </div>
        )}

        <button onClick={generateSeating} className={`py-3 rounded-lg w-full font-bold mb-2 transition-all shadow-md ${isOverCapacity ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          GENERATE PLAN
        </button>
        
        {result && <button onClick={() => window.print()} className="bg-emerald-600 text-white py-3 rounded-lg w-full font-bold shadow-md hover:bg-emerald-700">DOWNLOAD PDF / PRINT</button>}

        {/* Credit Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest">
          Inspired by <a href="mailto:mukatay.temirlan@gmail.com" className="text-indigo-600 hover:text-indigo-800 transition-colors underline decoration-dotted">Temirlan Mukatay</a>
        </div>
      </div>

      {/* PRINTABLE PAGES */}
      {result && result.map((room, idx) => {
        const sortedStats = getSortedStats(room.assignedStudents);
        return (
          <div key={idx} className="room-container mb-10 bg-white break-after-page print:m-0 shadow-sm">
            <div>
              <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-indigo-600">
                <h2 className="text-3xl font-black uppercase tracking-tighter">KBO EXAM SEATING | ROOM {room.roomNumber}</h2>
                <div className="text-right">
                  <p className="font-black uppercase tracking-widest text-sm">{room.teacher}</p>
                  <p className="text-indigo-400 font-bold uppercase text-[10px]">Proctor</p>
                </div>
              </div>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[11px] font-black uppercase border-b-2 border-black">
                    <th className="p-2 border-r border-slate-300 w-8">Seat</th>
                    <th className="p-2 border-r border-slate-300">Full Name</th>
                    <th className="p-2 text-center border-r border-slate-300 w-16">Class</th>
                    <th className="p-2 border-r border-slate-300 w-28">Subject</th>
                    <th className="p-2 border-r border-slate-300 text-right w-28">Student ID</th>
                    <th className="p-2 text-center w-36">Student Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {room.assignedStudents.map((s, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="p-2 font-black text-indigo-700 text-lg border-r border-slate-100 w-10">{i + 1}</td>
                      <td className="p-2 font-black uppercase text-sm">{getVal(s, 'First name')} {getVal(s, 'Last Name')}</td>
                      <td className="p-2 font-black text-center text-sm italic border-x border-slate-100 bg-slate-50">{getVal(s, 'Class')}</td>
                      <td className="p-2 font-bold text-slate-600 text-sm border-r border-slate-100">{getVal(s, 'Subject')}</td>
                      <td className="p-2 text-right font-normal text-xs border-r border-slate-100 text-slate-500">
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

            <div className="p-4 bg-white border-t-4 border-indigo-600">
              <div className="mb-4">
                <h4 className="font-black text-indigo-950 text-xs mb-2 uppercase border-b-2 border-indigo-100 pb-1">Subject Breakdown</h4>
                <div className="grid grid-cols-2 gap-x-12 gap-y-1">
                  {sortedStats.map((stat) => (
                    <div key={stat.label} className="flex justify-between text-[11px] border-b border-slate-100 uppercase font-bold">
                      <span className="text-slate-600">{stat.label}:</span><span className="font-black text-indigo-700">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-black">
                <div className="flex items-center gap-10">
                  <div className="text-sm font-black uppercase text-indigo-950">
                    Total Participated: <span className="underline ml-2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                  </div>
                  <div className="text-sm font-black uppercase flex items-center text-indigo-950">
                    Proctor Signature: <div className="ml-2 w-64 border-b-2 border-black h-8"></div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 font-mono italic">
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