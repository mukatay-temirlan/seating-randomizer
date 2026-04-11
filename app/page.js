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
          <div className="text-[10px] font-black text-indigo-600 mb-1 uppercase text-left">Desk {colId}-{deskRow}</div>
          <div className="border-2 border-black flex h-16 bg-white shadow-sm">
            <div className="flex-1 border-r border-dashed border-black p-1 flex flex-col justify-center items-center text-center">
              <span className="text-[7px] text-slate-400 font-bold mb-1">{colId}-{deskRow}A</span>
              <span className="text-[9px] font-black uppercase mb-1">
                {sA ? `${getVal(sA, 'First Name').charAt(0)}. ${getVal(sA, 'Last Name')}` : "---"}
              </span>
              <span className="text-[8px] font-bold text-indigo-700">{sA ? getVal(sA, 'Class') : ""}</span>
            </div>
            <div className="flex-1 p-1 flex flex-col justify-center items-center text-center">
              <span className="text-[7px] text-slate-400 font-bold mb-1">{colId}-{deskRow}B</span>
              <span className="text-[9px] font-black uppercase mb-1">
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <style jsx global>{`
        * { font-family: "Inter", sans-serif; }
        @media print {
          @page { size: A4; margin: 0.5cm; }
          .no-print { display: none !important; }
          .room-container, .seating-scheme-page { font-family: "Times New Roman" !important; height: 98vh; display: flex; flex-direction: column; border: 2px solid #000 !important; padding: 15px; page-break-after: always; }
        }
      `}</style>

      {/* NEW SETUP INTERFACE */}
      <div className="bg-white p-8 rounded-xl shadow-sm mb-8 border border-slate-200 no-print">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Setup</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Define Classrooms */}
          <div className="border border-slate-200 rounded-xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-800 mb-1">1. Define Classrooms</h3>
            <p className="text-sm text-slate-500 mb-4">
              Add classrooms manually, or upload a .csv file. <span className="text-indigo-600 cursor-pointer hover:underline">Open template.</span><br/>
              <span className="text-[11px] text-slate-400">Required columns: "classroom name", "seat capacity". Optional: "supervisor".</span>
            </p>
            
            <div className="space-y-3 mb-6">
              {rooms.map((room, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-slate-400 text-xs w-4">{idx + 1}.</span>
                  <input placeholder="Room Number" value={room.number} onChange={(e) => handleRoomChange(idx, 'number', e.target.value)} className="border border-slate-200 p-2 rounded-lg text-sm w-full outline-indigo-500"/>
                  <input placeholder="Supervisor" value={room.teacher} onChange={(e) => handleRoomChange(idx, 'teacher', e.target.value)} className="border border-slate-200 p-2 rounded-lg text-sm w-full outline-indigo-500"/>
                  <input type="number" placeholder="20" value={room.capacity} onChange={(e) => handleRoomChange(idx, 'capacity', e.target.value)} className="border border-slate-200 p-2 rounded-lg text-sm w-20 outline-indigo-500"/>
                  <button onClick={() => handleRemoveRoom(idx)} className="text-slate-300 hover:text-red-500 p-2">✕</button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddRoom} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all">
                <span className="text-lg">+</span> Add Classroom
              </button>
              <div className="relative">
                <input type="file" onChange={(e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const wb = XLSX.read(evt.target.result, { type: 'binary' });
                      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                      setRooms(data.map(r => ({ 
                        number: getVal(r, 'classroom name') || getVal(r, 'Room Number'), 
                        teacher: getVal(r, 'supervisor') || getVal(r, 'Teacher'), 
                        capacity: getVal(r, 'seat capacity') || getVal(r, 'Capacity') 
                      })));
                    };
                    reader.readAsBinaryString(file);
                }} className="absolute inset-0 opacity-0 cursor-pointer"/>
                <button className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all">
                   ↑ Upload Classroom List
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Upload Student List */}
          <div className="border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">2. Upload Student List</h3>
            <p className="text-sm text-slate-500 mb-6">
              Upload a .csv file with student data. <span className="text-indigo-600 cursor-pointer hover:underline">Open template.</span><br/>
              <span className="text-[11px] text-slate-400">Required: "first name", "last name", "class", "student id". Optional: "subject".</span>
            </p>
            
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center relative hover:bg-slate-100 transition-all">
              <input type="file" onChange={(e) => {
                 const file = e.target.files[0];
                 const reader = new FileReader();
                 reader.onload = (evt) => {
                   const wb = XLSX.read(evt.target.result, { type: 'binary' });
                   setStudents(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
                 };
                 reader.readAsBinaryString(file);
              }} className="absolute inset-0 opacity-0 cursor-pointer"/>
              <div className="text-slate-400 mb-2">↑</div>
              <p className="text-sm font-semibold text-slate-600">Choose CSV File</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-slate-500">
               <div className="flex items-center gap-2 text-sm">
                 <span className="text-lg">👥</span> {students.length} Students / {totalSeats} Seats
               </div>
               <div className="flex gap-2">
                 <input type="text" placeholder="School ID (e.g. 012)" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="border border-slate-200 p-2 rounded-lg text-xs w-32 outline-indigo-500"/>
               </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button onClick={generateSeating} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100">
            Generate Seating Plan
          </button>
          {result && (
            <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-100">
              Print Documents
            </button>
          )}
        </div>
      </div>

      {/* PRINTABLE PAGES (REMAIN UNCHANGED IN LOGIC) */}
      {result && result.map((room, idx) => (
        <React.Fragment key={idx}>
          <div className="room-container bg-white shadow-sm">
            <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-indigo-600">
              <h2 className="text-2xl font-black uppercase tracking-tight" style={{fontFamily:'"Times New Roman"'}}>ROOM {room.roomNumber} - ATTENDANCE</h2>
              <p className="text-xs font-black uppercase" style={{fontFamily:'"Times New Roman"'}}>{room.teacher}</p>
            </div>
            <table className="w-full text-left border-collapse" style={{fontFamily:'"Times New Roman"'}}>
              <thead>
                <tr className="bg-slate-100 text-[10px] font-black uppercase border-b-2 border-black">
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
                    <td className="p-1 text-center font-bold border-x bg-slate-50 text-xs">{getVal(s, 'Class')}</td>
                    <td className="p-1 text-slate-500 text-xs border-r">{getVal(s, 'Subject')}</td>
                    <td className="p-1 text-[10px] font-bold border-r text-center">{schoolId ? `${schoolId}-` : ""}{getVal(s, 'Student ID')}</td>
                    <td className="p-1 align-bottom"><div className="border-b border-black h-4"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="seating-scheme-page bg-white">
            <div className="border-b-4 border-black pb-2 mb-2 text-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter" style={{fontFamily:'"Times New Roman"'}}>Visual Seating Map: Room {room.roomNumber}</h2>
              <p className="font-bold text-indigo-600 uppercase text-[9px] tracking-widest">ORIENTATION: FRONT</p>
            </div>
            <SeatingMap assignedStudents={room.assignedStudents} />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}