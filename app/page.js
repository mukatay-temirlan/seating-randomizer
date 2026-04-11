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

  const generateSeating = () => {
    if (students.length === 0 || totalSeats === 0) {
      alert("Please upload students and define classrooms!");
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
          const currG = getVal(s, 'Class').match(/\d+/)?.[0];
          const lastG = getVal(last, 'Class').match(/\d+/)?.[0];
          return getVal(s, 'Subject') !== getVal(last, 'Subject') && currG !== lastG;
        });
        if (index === -1) index = 0; 
        
        room.assignedStudents.push(pool[index]);
        pool.splice(index, 1);
      }
      roomIndex++;
      if (distribution.every(r => r.assignedStudents.length >= r.capacity)) break;
    }

    // Balanced distribution logic across columns L, M, R
    distribution.forEach(room => {
      const totalInRoom = room.assignedStudents.length;
      const studentsToAssign = [...room.assignedStudents];
      room.assignedStudents = []; 

      const colCounts = [4, 5, 4]; 
      let currentStudentIdx = 0;

      for (let deskRow = 1; deskRow <= 5; deskRow++) {
        ["L", "M", "R"].forEach((col, colIdx) => {
          if (deskRow <= colCounts[colIdx]) {
            if (currentStudentIdx < totalInRoom) {
              const s = studentsToAssign[currentStudentIdx++];
              room.assignedStudents.push({ ...s, _seatId: `${col}-${deskRow}A` });
            }
            if (currentStudentIdx < totalInRoom) {
              const s = studentsToAssign[currentStudentIdx++];
              room.assignedStudents.push({ ...s, _seatId: `${col}-${deskRow}B` });
            }
          }
        });
      }
    });

    setResult(distribution);
  };

  const SeatingMap = ({ assignedStudents }) => {
    const getStudentBySeat = (id) => assignedStudents.find(s => s._seatId === id) || null;

    const Desk = ({ deskRow, colId }) => {
      const sA = getStudentBySeat(`${colId}-${deskRow}A`);
      const sB = getStudentBySeat(`${colId}-${deskRow}B`);
      return (
        <div className="mb-4 w-full">
          <div className="text-[10px] font-black text-indigo-600 mb-1 uppercase tracking-tighter text-left">Desk {colId}-{deskRow}</div>
          <div className="border-2 border-black flex h-16 bg-white shadow-sm">
            <div className="flex-1 border-r border-dashed border-black p-1 flex flex-col justify-center items-center text-center">
              <span className="text-[7px] text-slate-400 font-bold mb-1">{colId}-{deskRow}A</span>
              <span className="text-[9px] font-black uppercase leading-none mb-1">
                {sA ? `${getVal(sA, 'First Name').charAt(0)}. ${getVal(sA, 'Last Name')}` : "---"}
              </span>
              <span className="text-[8px] font-bold text-indigo-700">{sA ? getVal(sA, 'Class') : ""}</span>
            </div>
            <div className="flex-1 p-1 flex flex-col justify-center items-center text-center">
              <span className="text-[7px] text-slate-400 font-bold mb-1">{colId}-{deskRow}B</span>
              <span className="text-[9px] font-black uppercase leading-none mb-1">
                {sB ? `${getVal(sB, 'First Name').charAt(0)}. ${getVal(sB, 'Last Name')}` : "---"}
              </span>
              <span className="text-[8px] font-bold text-indigo-700">{sB ? getVal(sB, 'Class') : ""}</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="mt-4 p-4 border-2 border-dashed border-slate-300 rounded-lg flex flex-col h-full">
        <div className="mb-8 border-4 border-double border-black w-48 mx-auto text-center font-black text-sm p-2 uppercase">Front / Proctor</div>
        <div className="flex justify-around gap-6 flex-1">
          <div className="flex-1">
            <p className="text-[12px] font-black mb-4 border-b-2 border-black text-center uppercase">Column L</p>
            {[1, 2, 3, 4].map(num => <Desk key={num} deskRow={num} colId="L" />)}
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-black mb-4 border-b-2 border-black text-center uppercase">Column M</p>
            {[1, 2, 3, 4, 5].map(num => <Desk key={num} deskRow={num} colId="M" />)}
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-black mb-4 border-b-2 border-black text-center uppercase">Column R</p>
            {[1, 2, 3, 4].map(num => <Desk key={num} deskRow={num} colId="R" />)}
          </div>
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
          .room-container, .seating-scheme-page { height: 98vh; display: flex; flex-direction: column; border: 2px solid #000 !important; padding: 15px; }
          .seating-scheme-page { page-break-before: always; }
        }
      `}</style>

      {/* ADMIN PANEL */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 print:hidden border-t-4 border-indigo-600">
        <h1 className="text-3xl font-black mb-1 text-indigo-950 text-center uppercase">KBO EXAM SEATING</h1>
        <div className="my-6 max-w-xs mx-auto text-center">
            <label className="block text-xs font-black text-indigo-600 uppercase mb-1 tracking-widest">School ID</label>
            <input type="text" placeholder="e.g. 012" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}
                className="w-full border-2 border-indigo-100 p-2 rounded-lg text-center font-black outline-none transition-all focus:border-indigo-600"/>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="font-black mb-1 text-indigo-900 uppercase">1. Classrooms</h3>
            <div className="space-y-2 mb-4">
              {rooms.map((room, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input placeholder="Room" value={room.number} onChange={(e) => handleRoomChange(idx, 'number', e.target.value)} className="border p-2 rounded text-xs w-full"/>
                  <input placeholder="Proctor" value={room.teacher} onChange={(e) => handleRoomChange(idx, 'teacher', e.target.value)} className="border p-2 rounded text-xs w-full"/>
                  <input type="number" placeholder="Cap." value={room.capacity} onChange={(e) => handleRoomChange(idx, 'capacity', e.target.value)} className="border p-2 rounded text-xs w-20"/>
                  <button onClick={() => handleRemoveRoom(idx)} className="text-slate-400 p-1">✕</button>
                </div>
              ))}
            </div>
            
            {/* RESTORED UPLOAD BUTTONS SECTION */}
            <div className="flex gap-2">
              <button onClick={handleAddRoom} className="bg-white border-2 border-indigo-100 text-indigo-600 px-4 py-2 rounded font-bold text-xs">+ Add Room</button>
              <div className="relative">
                <input type="file" onChange={(e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const wb = XLSX.read(evt.target.result, { type: 'binary' });
                      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                      setRooms(data.map(r => ({ 
                        number: getVal(r, 'Room Number') || getVal(r, 'classroom name'), 
                        teacher: getVal(r, 'Teacher') || getVal(r, 'supervisor'), 
                        capacity: getVal(r, 'Capacity') || getVal(r, 'seat capacity') 
                      })));
                    };
                    reader.readAsBinaryString(file);
                }} className="absolute inset-0 opacity-0 cursor-pointer"/>
                <button className="bg-white border-2 border-indigo-100 text-indigo-600 px-4 py-2 rounded font-bold text-xs">↑ Upload Rooms</button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="font-black mb-1 text-indigo-900 uppercase">2. Students</h3>
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

        <button onClick={generateSeating} className="py-3 rounded-lg w-full font-black bg-indigo-600 text-white mb-2 shadow-md">GENERATE PLAN</button>
        {result && <button onClick={() => window.print()} className="bg-emerald-600 text-white py-3 rounded-lg w-full font-black shadow-md">PRINT ALL DOCUMENTS</button>}
      </div>

      {/* PRINTABLE PAGES */}
      {result && result.map((room, idx) => (
        <React.Fragment key={idx}>
          <div className="room-container mb-10 bg-white break-after-page shadow-sm">
            <div>
              <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-indigo-600">
                <h2 className="text-2xl font-black uppercase tracking-tight">ROOM {room.roomNumber} - ATTENDANCE</h2>
                <div className="text-right"><p className="text-xs font-black uppercase leading-none">{room.teacher}</p></div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase border-b-2 border-black">
                    <th className="p-2 border-r w-14">Seat ID</th>
                    <th className="p-2 border-r">Full Name</th>
                    <th className="p-2 text-center border-r w-10">Class</th>
                    <th className="p-2 border-r w-24">Subject</th>
                    <th className="p-2 border-r w-24">Student ID</th>
                    <th className="p-2 text-center w-28">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {room.assignedStudents.map((s, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="p-1 font-black text-indigo-700 border-r bg-indigo-50 text-center">{s._seatId}</td>
                      <td className="p-1 font-black uppercase text-xs">{getVal(s, 'First Name')} {getVal(s, 'Last Name')}</td>
                      <td className="p-1 text-center font-bold italic border-x bg-slate-50 text-xs">{getVal(s, 'Class')}</td>
                      <td className="p-1 text-slate-500 text-xs border-r">{getVal(s, 'Subject')}</td>
                      <td className="p-1 text-[10px] font-bold border-r text-center">{schoolId ? `${schoolId}-` : ""}{getVal(s, 'Student ID')}</td>
                      <td className="p-1 align-bottom"><div className="border-b border-black h-4"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="seating-scheme-page bg-white break-after-page">
            <div className="border-b-4 border-black pb-2 mb-2">
              <h2 className="text-2xl font-black uppercase text-center tracking-tighter">Visual Seating Map: Room {room.roomNumber}</h2>
              <p className="text-center font-bold text-indigo-600 uppercase text-[9px] tracking-widest">ORIENTATION: FRONT</p>
            </div>
            <SeatingMap assignedStudents={room.assignedStudents} />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}