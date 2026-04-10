"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function SeatingApp() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [result, setResult] = useState(null);

  // The Core Algorithm
  const generateSeating = () => {
    let pool = [...students].sort(() => Math.random() - 0.5);
    let distribution = [];

    rooms.sort((a, b) => b.capacity - a.capacity).forEach(room => {
      let roomAssignment = { ...room, assignedStudents: [] };
      
      for (let i = 0; i < room.capacity; i++) {
        if (pool.length === 0) break;

        const last = roomAssignment.assignedStudents[roomAssignment.assignedStudents.length - 1];

        // Find student with DIFFERENT subject AND DIFFERENT class
        let index = pool.findIndex(s => {
          if (!last) return true;
          return s.subject !== last.subject && s.className !== last.className;
        });

        // Fallback 1: Just different subject
        if (index === -1) {
          index = pool.findIndex(s => !last || s.subject !== last.subject);
        }

        // Fallback 2: Take anyone left
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
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">School Seating Randomizer (ID: 012)</h1>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border-2 border-dashed p-4 rounded">
          <p className="font-bold mb-2">1. Upload Students (Excel)</p>
          <input type="file" onChange={(e) => handleFileUpload(e, 'students')} />
          <p className="text-xs mt-2 text-gray-500">Columns: name, surname, student_id, subject, className</p>
        </div>
        <div className="border-2 border-dashed p-4 rounded">
          <p className="font-bold mb-2">2. Upload Rooms (Excel)</p>
          <input type="file" onChange={(e) => handleFileUpload(e, 'rooms')} />
          <p className="text-xs mt-2 text-gray-00 text-gray-500">Columns: roomNumber, teacher, capacity</p>
        </div>
      </div>

      <button 
        onClick={generateSeating}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 w-full mb-8 font-bold"
      >
        GENERATE SEATING LIST
      </button>

      {result && result.map((room, idx) => (
        <div key={idx} className="mb-12 border-t-2 pt-6 break-after-page">
          <div className="flex justify-between items-center mb-4 bg-gray-100 p-4 rounded">
            <h2 className="text-2xl font-bold">Room: {room.roomNumber}</h2>
            <p className="font-medium text-lg">Teacher: {room.teacher}</p>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-2 border">Seat</th>
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Name Surname</th>
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">Class</th>
              </tr>
            </thead>
            <tbody>
              {room.assignedStudents.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-2 border font-bold">{i + 1}</td>
                  <td className="p-2 border text-gray-600">012-{s.student_id}</td>
                  <td className="p-2 border font-medium">{s.name} {s.surname}</td>
                  <td className="p-2 border text-blue-700 font-bold">{s.subject}</td>
                  <td className="p-2 border font-mono">{s.className}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}