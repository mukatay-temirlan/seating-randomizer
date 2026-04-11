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
          const currGrade = getVal(s, 'Class').match(/\d+/)?.[0];
          const lastGrade = getVal(last, 'Class').match(/\d+/)?.[0];
          // Rule: Different Subject AND Different Grade Number (1 grade apart)
          return getVal(s, 'Subject') !== getVal(last, 'Subject') && currGrade !== lastGrade;
        });

        if (index === -1) index = 0; // Fallback if impossible
        
        room.assignedStudents.push(pool[index]);
        pool.splice(index, 1);
      }
      roomIndex++;
      if (distribution.every(r => r.assignedStudents.length >= r.capacity)) break;
    }
    setResult(distribution);
  };

  const SeatingMap = ({ assignedStudents }) => {
    // Layout Logic: Left (4), Middle (5), Right (4)
    const columns = { left: [], middle: [], right: [] };
    assignedStudents.forEach((s, i) => {
      const row = Math.floor(i / 13);
      const pos = i % 13;
      if (pos < 4) columns.left.push(s);
      else if (pos < 9) columns.middle.push(s);
      else columns.right.push(s);
    });

    const Desk = ({ student, index }) => (
      <div className="border border-black p-1 h-14 w-full flex flex-col justify-center items-center text-center bg-white mb-2 shadow-sm">
        <span className="text-[7px] text-slate-400 uppercase font-black">Seat {index + 1}</span>
        <span className="text-[9px] font-black leading-tight uppercase">
          {student ? `${getVal(student, 'First Name').charAt(0)}. ${getVal(student, 'Last Name')}` : "EMPTY"}
        </span>
        <span className="text-[8px] italic font-bold text-indigo-700">{student ? getVal(student, 'Class') : ""}</span>
      </div>
    );

    return (
      <div className="mt-4 p-4 border-2 border-dashed border-slate-300 rounded-lg">
        <div className="flex justify-around gap-4">
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[10px] font-black mb-2 border-b w-full text-center">LEFT COLUMN</p>
            {columns.left.map((s, i) => <Desk key={i} student={s} index={i} />)}
          </div>
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[10px] font-black mb-2 border-b w-full text-center">MIDDLE COLUMN</p>
            {columns.middle.map((s, i) => <Desk key={i} student={s} index={i + 4} />)}
          </div>
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[10px] font-black mb-2 border-b w-full text-center">RIGHT COLUMN</p>
            {columns.right.map((s, i) => <Desk key={i} student={s} index={i + 9} />)}
          </div>
        </div>
        <div className="mt-8 border-4 border-double border-black w-32 mx-auto text-center font-black text-xs p-2">
          TEACHER'S DESK
        </div>
      </div>
    );
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
          .room-container { height: 98vh; display: flex; flex-direction: column; justify-content: space-between; border: 2px solid #000 !important; padding: 2px; }
          .seating-scheme-page { page-break-before: always; height: 98vh; border: 2px solid #000 !important; padding: 20px; }
        }
      `}</style>

      {/* ADMIN PANEL */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 print:hidden border-t-4 border-indigo-600">
        <h1 className="text-3xl font-black mb-1 text-indigo-950 text-center uppercase">KBO EXAM SEATING</h1>
        <div className="my-6 max-w-xs mx-auto text-center">
            <label className="block text-xs font-black text-indigo-600 uppercase mb-1 tracking-widest">School ID</label>
            <input type="text" placeholder="e.g. 012" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}
                className="w-full border-2 border-indigo-100 p-2 rounded-lg text-center font-black outline-none"/>
        </div>
        <div className="space-y-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="font-black text-indigo-900 uppercase text-sm mb-2">1. Classrooms (Manual or File)</h3>
            {rooms.map((room, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input placeholder="Room" value={room.number} onChange={(e) => handleRoomChange(idx, 'number', e.target.value)} className="border p-1 text-xs w-full"/>
                <input placeholder="Proctor" value={room.teacher} onChange={(e) => handleRoomChange(idx, 'teacher', e.target.value)} className="border p-1 text-xs w-full"/>
                <input placeholder="Cap." value={room.capacity} onChange={(e) => handleRoomChange(idx, 'capacity', e.target.value)} className="border p-1 text-xs w-20"/>
                <button onClick={() => handleRemoveRoom(idx)}>✕</button>
              </div>
            ))}
            <button onClick={handleAddRoom} className="text-indigo-600 text-xs font-bold">+ Add Room</button>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="font-black text-indigo-900 uppercase text-sm mb-2">2. Upload Students</h3>
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
        </div>
        <button onClick={generateSeating} className="py-3 rounded-lg w-full font-black bg-indigo-600 text-white mb-2">GENERATE PLAN</button>
        {result && <button onClick={() => window.print()} className="bg-emerald-600 text-white py-3 rounded-lg w-full font-black">PRINT ALL PAGES</button>}
        
        <div className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase">
          Inspired by <a href="mailto:mukatay.temirlan@gmail.com" className="text-indigo-600 underline">Temirlan Mukatay</a>
        </div>
      </div>

      {/* PRINTABLE CONTENT */}
      {result && result.map((room, idx) => (
        <React.Fragment key={idx}>
          {/* Page 1: Student List */}
          <div className="room-container mb-10 bg-white break-after-page">
            <div>
              <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-indigo-600">
                <h2 className="text-2xl font-black uppercase">ROOM {room.roomNumber} - LIST</h2>
                <div className="text-right"><p className="text-xs uppercase font-black">{room.teacher}</p></div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase border-b-2 border-black">
                    <th className="p-2 border-r w-8">Seat</th>
                    <th className="p-2 border-r">Name</th>
                    <th className="p-2 border-r text-center w-12">Class</th>
                    <th className="p-2 border-r w-24">Subject</th>
                    <th className="p-2 border-r text-right w-24">ID</th>
                    <th className="p-2 text-center w-32">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {room.assignedStudents.map((s, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="p-1 font-black text-indigo-700 border-r">{i + 1}</td>
                      <td className="p-1 font-black uppercase text-xs">{getVal(s, 'First Name')} {getVal(s, 'Last Name')}</td>
                      <td className="p-1 text-center font-bold italic border-x bg-slate-50 text-xs">{getVal(s, 'Class')}</td>
                      <td className="p-1 text-slate-500 text-xs border-r">{getVal(s, 'Subject')}</td>
                      <td className="p-1 text-right text-[10px] border-r">{schoolId ? `${schoolId}-` : ""}{getVal(s, 'Student ID')}</td>
                      <td className="p-1 align-bottom"><div className="border-b border-black h-4"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Page 2: Seating Scheme */}
          <div className="seating-scheme-page bg-white break-after-page">
            <div className="border-b-4 border-black pb-2 mb-4">
              <h2 className="text-3xl font-black uppercase text-center">SEATING SCHEME: ROOM {room.roomNumber}</h2>
              <p className="text-center font-bold text-indigo-600 uppercase text-xs tracking-widest">Proctor: {room.teacher}</p>
            </div>
            <SeatingMap assignedStudents={room.assignedStudents} />
            <div className="mt-auto pt-10 flex justify-between text-[10px] font-black uppercase text-slate-400">
                <span>KBO-OFFICIAL {schoolId}</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}