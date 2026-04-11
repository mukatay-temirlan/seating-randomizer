"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function SeatingApp() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([{ number: "", teacher: "", capacity: "" }]);
  const [result, setResult] = useState(null);
  const [schoolId, setSchoolId] = useState("");

  const getVal = (obj, key) => {
    const foundKey = Object.keys(obj).find(k => k.trim().toLowerCase() === key.toLowerCase());
    return foundKey ? obj[foundKey] : "";
  };

  const handleAddRoom = () => setRooms([...rooms, { number: "", teacher: "", capacity: "" }]);
  
  const handleRemoveRoom = (index) => {
    const newRooms = rooms.filter((_, i) => i !== index);
    setRooms(newRooms.length ? newRooms : [{ number: "", teacher: "", capacity: "" }]);
  };

  const handleRoomChange = (index, field, value) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;
    setRooms(newRooms);
  };

  const totalSeats = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0);
  const studentCount = students.length;
  const isOverCapacity = studentCount > totalSeats;

  const generateSeating = () => {
    if (students.length === 0 || totalSeats === 0) {
      alert("Please upload students and define at least one classroom!");
      return;
    }

    let pool = [...students].sort(() => Math.random() - 0.5);
    let distribution = rooms.map(r => ({
      roomNumber: r.number,
      teacher: r.teacher,
      capacity: Number(r.capacity),
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
      if (!stats[key]) stats[key] = { label: key, count: 0, grade: gradeNum, subject: subj };
      stats[key].count++;
    });
    return Object.values(stats).sort((a, b) => a.grade !== b.grade ? a.grade - b.grade : a.subject.localeCompare(b.subject));
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
            display: flex; flex-direction: column; justify-content: space-between;
            border: 2px solid #000 !important; padding: 2px;
          }
        }
      `}</style>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 print:hidden border-t-4 border-indigo-600">
        <h1 className="text-3xl font-black mb-1 text-indigo-950 text-center uppercase">KBO EXAM SEATING</h1>
        
        <div className="my-6 max-w-xs mx-auto text-center">
            <label className="block text-xs font-black text-indigo-600 uppercase mb-1 tracking-widest">Enter School ID</label>
            <input type="text" placeholder="e.g. 012" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}
                className="w-full border-2 border-indigo-100 p-2 rounded-lg text-center font-black focus:border-indigo-600 outline-none transition-all"/>
        </div>
        
        <div className="space-y-8 mb-8">
          {/* 1. Define Classrooms */}
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="font-black mb-1 text-indigo-900 uppercase">1. Define Classrooms</h3>
            <p className="text-[12px] text-slate-600 mb-4">
              Add classrooms manually, or upload a .csv file. <br/>
              <span className="text-indigo-600 font-bold text-[10px]">Required columns for upload:</span> "Room Number", "Capacity".
            </p>
            
            <div className="space-y-2 mb-4">
              {rooms.map((room, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                  <input placeholder="Room 101" value={room.number} onChange={(e) => handleRoomChange(idx, 'number', e.target.value)} className="border p-2 rounded text-xs w-full focus:border-indigo-500 outline-none"/>
                  <input placeholder="Supervisor" value={room.teacher} onChange={(e) => handleRoomChange(idx, 'teacher', e.target.value)} className="border p-2 rounded text-xs w-full focus:border-indigo-500 outline-none"/>
                  <input type="number" placeholder="Cap." value={room.capacity} onChange={(e) => handleRoomChange(idx, 'capacity', e.target.value)} className="border p-2 rounded text-xs w-20 focus:border-indigo-500 outline-none"/>
                  <button onClick={() => handleRemoveRoom(idx)} className="text-slate-400 hover:text-red-500 p-2">✕</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={handleAddRoom} className="bg-white border-2 border-indigo-100 text-indigo-600 px-4 py-2 rounded font-bold text-xs hover:bg-indigo-50">+ Add Classroom</button>
              <div className="relative">
                <input type="file" onChange={(e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const wb = XLSX.read(evt.target.result, { type: 'binary' });
                      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                      setRooms(data.map(r => ({ number: getVal(r, 'Room Number'), teacher: getVal(r, 'Teacher'), capacity: getVal(r, 'Capacity') })));
                    };
                    reader.readAsBinaryString(file);
                }} className="absolute inset-0 opacity-0 cursor-pointer"/>
                <button className="bg-white border-2 border-indigo-100 text-indigo-600 px-4 py-2 rounded font-bold text-xs">↑ Upload List</button>
              </div>
            </div>
          </div>

          {/* 2. Upload Student List */}
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="font-black mb-1 text-indigo-900 uppercase">2. Upload Student List</h3>
            <p className="text-[12px] text-slate-600 mb-4">
              Upload a .csv file with student data. <br/>
              <span className="text-indigo-600 font-bold text-[10px]">Required:</span> "First Name", "Last Name", "Class", "Subject", "Student ID".
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

        {(students.length > 0 && totalSeats > 0) && (
          <div className={`mb-4 p-4 rounded-lg flex justify-between items-center ${isOverCapacity ? 'bg-red-50 border-2 border-red-200' : 'bg-emerald-50 border-2 border-emerald-200'}`}>
            <div className="text-sm font-bold">
              <p className={isOverCapacity ? 'text-red-700' : 'text-emerald-700 font-black'}>{isOverCapacity ? '⚠️ NOT ENOUGH SEATS!' : '✅ CAPACITY OK'}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">Students: {studentCount} | Total Seats: {totalSeats}</p>
            </div>
          </div>
        )}

        <button onClick={generateSeating} className={`py-3 rounded-lg w-full font-bold mb-2 transition-all shadow-md ${isOverCapacity ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>GENERATE PLAN</button>
        {result && <button onClick={() => window.print()} className="bg-emerald-600 text-white py-3 rounded-lg w-full font-bold shadow-md">DOWNLOAD PDF / PRINT</button>}

        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Inspired by <a href="mailto:mukatay.temirlan@gmail.com" className="text-indigo-600 hover:text-indigo-800 transition-colors underline decoration-dotted">Temirlan Mukatay</a>
        </div>
      </div>

      {/* PRINTABLE PAGES (Same logic as before) */}
      {result && result.map((room, idx) => {
        const sortedStats = getSortedStats(room.assignedStudents);
        return (
          <div key={idx} className="room-container mb-10 bg-white break-after-page print:m-0">
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
                      <td className="p-2 align-bottom"><div className="border-b border-black w-full h-6"></div></td>
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
                  <div className="text-sm font-black uppercase text-indigo-950">Total Participated: <span className="underline ml-2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
                  <div className="text-sm font-black uppercase flex items-center text-indigo-950">Proctor Signature: <div className="ml-2 w-64 border-b-2 border-black h-8"></div></div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 font-mono italic">KBO-OFFICIAL {schoolId ? `| ${schoolId}` : ""}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}