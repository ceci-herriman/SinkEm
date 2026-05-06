// BoardWithAxes.jsx
import React from "react";

export default function BoardWithAxes({ children, size = 10 }) { // default of 10 x 10
  const letters = Array.from({ length: size }, (_, i) =>
    String.fromCharCode(65 + i) // generate letters up to grid size (10)
  );
  const numbers = Array.from({ length: size }, (_, i) => i + 1); // generate numbers 1 to 10

  return (
    <div className="flex flex-col items-center"> 
    {/* X axis (letters) */}
    <div className="flex ml-6 mb-3">
        <div className="w-0" /> {/* left padding to align numbers */}
        {letters.map((letter) => (
        <div
            key={letter}
            // for each letter cell
            className="w-12 h-4 text-center text-sm font-bold text-gray-400"
        >
            {letter}
        </div>
        ))}
    </div>

    {/* Y axis (numbers) + board side by side */}
    <div className="flex items-center">
        <div className="flex flex-col items-end mr-2">
        {numbers.map((num) => (
            <div
            key={num}
            //   class name for each number cell
            className="h-12 flex items-center justify-end text-sm font-bold text-gray-400"
            >
            {num}
            </div>
        ))}
        </div>

        {/* Your existing board (Grid) */}
        <div>{children}</div>
    </div>
    </div>
  );
}
