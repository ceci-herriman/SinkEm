import "./App.css";


function GridSquare({ row, col, onClick, value, isSelected, isForPlacing, isFleetGrid }) {
  
  let color = 'yellow'

  //get background color
  if(isForPlacing && value) {
    color = '#0b84ff'
  }
  else if(isFleetGrid && value != '🌊' && value != null) {
    color = '#0b84ff'
  }
  else if(!isForPlacing && isSelected) {
    color = 'yellow'
  }
  else {
    color = 'white'
  }

  return (
    <div
      onClick={() => onClick(row, col)}
      className="square"
      style={{ backgroundColor: color}}
    >
      {value}
    </div>
  );
}


export default function Grid({gridVals, handleSquareChoice, selected, isForPlacing, isFleetGrid}) {

  // Handle square click
  const handleClick = (row, col) => {
    handleSquareChoice(row, col)
  };

  // render emojis for hits and misses
  const renderSymbol = (val) => {
    if (val === 'H') return '💥';  // hit
    if (val === 'M') return '🌊';  // miss
    return val;
  };


  return (
    // <div className="card">
      <div className="board-grid">
        {gridVals.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <GridSquare
              key={`${rowIndex}-${colIndex}`}
              row={rowIndex}
              col={colIndex}
              value={renderSymbol(value)}
              onClick={handleClick}
              isSelected={selected && selected.x === rowIndex && selected.y ===colIndex}
              isForPlacing={isForPlacing}
              isFleetGrid={isFleetGrid}
          />
          ))
        )}
      </div>
    // </div>
  );
}
