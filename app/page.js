const SeatingMap = ({ assignedStudents }) => {
    // Layout Logic: Left (4 columns), Middle (5 columns), Right (4 columns)
    // BUT each 'column' now has TWO students per desk (left/right).
    // So a single 'position' in a column takes two students from the pool.
    
    const columns = { left: [], middle: [], right: [] };
    let studentIndex = 0;

    // Helper to fill a column with double desks
    const fillColumn = (colArray, numDesks) => {
      for (let d = 0; d < numDesks; d++) {
        const studentA = assignedStudents[studentIndex] || null;
        studentIndex++;
        const studentB = assignedStudents[studentIndex] || null;
        studentIndex++;
        // Store as a pair (desk)
        colArray.push({ studentA, studentB });
      }
    };

    fillColumn(columns.left, 4); // 4 double desks = 8 seats
    fillColumn(columns.middle, 5); // 5 double desks = 10 seats
    fillColumn(columns.right, 4); // 4 double desks = 8 seats

    const DoubleDesk = ({ desk, deskId }) => (
      <div className="border border-black flex h-16 w-full bg-white mb-2 shadow-sm">
        {/* Student A (Left Seat) */}
        <div className="flex-1 border-r border-dashed border-black p-1 flex flex-col justify-center items-center text-center">
            <span className="text-[7px] text-slate-400 uppercase font-black">Seat {deskId}A</span>
            <span className="text-[9px] font-black leading-tight uppercase">
                {desk.studentA ? `${getVal(desk.studentA, 'First Name').charAt(0)}. ${getVal(desk.studentA, 'Last Name')}` : "EMPTY"}
            </span>
            <span className="text-[8px] italic font-bold text-indigo-700">{desk.studentA ? getVal(desk.studentA, 'Class') : ""}</span>
        </div>
        {/* Student B (Right Seat) */}
        <div className="flex-1 p-1 flex flex-col justify-center items-center text-center">
            <span className="text-[7px] text-slate-400 uppercase font-black">Seat {deskId}B</span>
            <span className="text-[9px] font-black leading-tight uppercase">
                {desk.studentB ? `${getVal(desk.studentB, 'First Name').charAt(0)}. ${getVal(desk.studentB, 'Last Name')}` : "EMPTY"}
            </span>
            <span className="text-[8px] italic font-bold text-indigo-700">{desk.studentB ? getVal(desk.studentB, 'Class') : ""}</span>
        </div>
      </div>
    );

    return (
      <div className="mt-4 p-4 border-2 border-dashed border-slate-300 rounded-lg">
        <div className="flex justify-around gap-4">
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[10px] font-black mb-2 border-b w-full text-center">LEFT (4 Desks / 8 Seats)</p>
            {columns.left.map((desk, i) => <DoubleDesk key={i} desk={desk} deskId={i + 1} />)}
          </div>
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[10px] font-black mb-2 border-b w-full text-center">MIDDLE (5 Desks / 10 Seats)</p>
            {columns.middle.map((desk, i) => <DoubleDesk key={i} desk={desk} deskId={i + 5} />)}
          </div>
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[10px] font-black mb-2 border-b w-full text-center">RIGHT (4 Desks / 8 Seats)</p>
            {columns.right.map((desk, i) => <DoubleDesk key={i} desk={desk} deskId={i + 10} />)}
          </div>
        </div>
        <div className="mt-6 border-4 border-double border-black w-32 mx-auto text-center font-black text-xs p-1">TEACHER'S DESK / FRONT</div>
      </div>
    );
  };