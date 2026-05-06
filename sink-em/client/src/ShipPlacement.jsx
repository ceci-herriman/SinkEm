import {useEffect, useMemo, useState, useRef} from "react";
import Grid from "./Grid.jsx";
import BoardWithAxes from "./axis.jsx";
//import "./App.css";


const SIZE = 10;

const makeEmptyBoard = () => Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null));

// Battleship definitions (ids used on the board to mark ship cells)
const INITIAL_SHIPS = [
    { id: "A", name: "Aircraft Carrier", size: 5, placed: false, cells: [] },
    { id: "B", name: "Battleship",      size: 4, placed: false, cells: [] },
    { id: "S", name: "Submarine",       size: 3, placed: false, cells: [] },
    { id: "C", name: "Cruiser",         size: 3, placed: false, cells: [] },
    { id: "D", name: "Destroyer",       size: 2, placed: false, cells: [] },
];

// Get the list of cells a ship would occupy given starting cell, size, and orientation
function cellsForPlacement(row, col, size, orientation) {
    const cells = [];
    for (let i = 0; i < size; i++) {
        cells.push(orientation === "Horizontal" ? [row, col + i] : [row + i, col]);
    }
    return cells;
}

// Check if all cells are within board bounds
function isInBounds(cells) {
    return cells.every(([r, c]) => r >= 0 && r < SIZE && c >= 0 && c < SIZE);
}

// Check if any of the cells overlap existing ships on the board
function overlaps(board, cells) {
    return cells.some(([r, c]) => board[r][c] !== null);
}


// Component for placing ships on the board
export default function ShipPlacement({ onDone }) {
    const [msg, setMsg] = useState("Select your ships and place them below.");
    const [hoverCells, setHoverCells] = useState([]);
    const [hoverAnchor, setHoverAnchor] = useState(null);
    const gridWrapRef = useRef(null);
    const [board, setBoard] = useState(() => makeEmptyBoard());
    const [ships, setShips] = useState(() => INITIAL_SHIPS.map(s => ({ ...s })));
    const [selectedShipId, setSelectedShipId] = useState(INITIAL_SHIPS[0].id);
    const [orientation, setOrientation] = useState("Horizontal"); // Horizontal or  Vertical


    const selectedShip = useMemo(
        () => ships.find(s => s.id === selectedShipId) ?? null,
        [ships, selectedShipId]
        );


    // Keyboard: R rotates, and 1 through5 selects ships (that are not placed)
    useEffect(() => {
    const onKeyDown = (e) => {
        if (e.key === "r" || e.key === "R") {
        setOrientation(o => (o === "Horizontal" ? "Vertical" : "Horizontal"));
        return;
        }
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < INITIAL_SHIPS.length) {

            const wantedId = INITIAL_SHIPS[idx].id;
            const wanted = ships.find(s => s.id === wantedId);

            if (wanted && !wanted.placed) {
                setSelectedShipId(wantedId);
            }
        }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    }, [ships]);


    // Handle click to place ship (only if it's valid)
    const handleSquareClick = (r, c) => {
        if (!selectedShip) {
            return;
        }
        const cells = cellsForPlacement(r, c, selectedShip.size, orientation);

        // ignores placing outside the board
        if (!isInBounds(cells)) {
            setMsg("Cannot place: " + selectedShip.name + "  is off the board")
            return; 
        } 

        // ignores overlaps with other ships
        if (overlaps(board, cells)) {
            setMsg("Cannot place: " + selectedShip.name + " is overlaping an existing ship")
            return; 
        }

        const newBoard = board.map(row => [...row]);
        for (const [rr, cc] of cells) newBoard[rr][cc] = selectedShip.id;
        setBoard(newBoard);

        // marks  placed ships and auto-select next one
        setShips(prev => {
        const updated = prev.map(s =>
            s.id === selectedShip.id ? { ...s, placed: true, cells } : s
        );
        const next = updated.find(s => !s.placed);
        setSelectedShipId(next ? next.id : null);

        setMsg(selectedShip.name + " placed")
        return updated;
        });

    };

    // remove ships
    const removeShip = id => {
        const ship = ships.find(s => s.id === id);
        setMsg(ship.name + " removed")

        if (!ship || !ship.placed) return;
            const newBoard = board.map(row => [...row]);
        for (const [r, c] of ship.cells) newBoard[r][c] = null;
            setBoard(newBoard);
            setShips(prev => prev.map(s => (s.id === id ? { ...s, placed: false, cells: [] } : s)));
            setSelectedShipId(id);
    };

    useEffect(() => {
        // when all ships placed, call onDone with the board
        if (ships.every(s => s.placed)) {
            onDone?.(board, ships);
        }
    }, [ships, board, onDone]);

    const gridVals = board;
    const handleMouseMove = (e) => {
        const el = e.target;

        if (!el || !el.classList || !el.classList.contains("square")) {
            return;
        }

        // find row/col by the square's position
        const gridEl = el.parentElement;
        const children = Array.from(gridEl.children);
        const index = children.indexOf(el);
        
        if (index < 0) {
            return;
        }

        const r = Math.floor(index / SIZE);
        const c = index % SIZE;

        if (!selectedShip) {
            setHoverCells([]);
            return;
        }

        setHoverAnchor({ r, c });
    };

    const handleMouseLeave = () => {
        setHoverAnchor (null)
        setHoverCells([]);
    };

    // Updates the hover to rotate as soon as you rotate the ship
    useEffect(() => {
        if (!hoverAnchor || !selectedShip) {
            setHoverCells([]);
            return;
        }
        const cells = cellsForPlacement(
            hoverAnchor.r,
            hoverAnchor.c,
            selectedShip.size,
            orientation
        );
        setHoverCells(cells);
    }, [hoverAnchor, selectedShip, orientation]);


    
    return (
        <div>
            <h2 className="h2-nocenter">Place Your Ships</h2>
            <div role="status" aria-live="polite" style={{ margin: "8px 0px 25px 0px", fontWeight: 600 }}>{msg}</div>

            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>


                <BoardWithAxes>
                <div
                ref={gridWrapRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ position: "relative", display: "inline-block" }}>

                <Grid gridVals={gridVals} handleSquareChoice={handleSquareClick} isForPlacing={true} isFleetGrid={false}/>

                <div
                    style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    gridTemplateColumns: "repeat(10, 3vw)",
                    gridTemplateRows: "repeat(10, 3vw)",
                    gap: "3px",
                    pointerEvents: "none",
                    }}
                >
                    {hoverCells.map(([r, c]) =>
                    r >= 0 && r < SIZE && c >= 0 && c < SIZE ? (
                        <div
                        key={`${r}-${c}`}
                        style={{
                            gridColumnStart: c + 1,
                            gridRowStart: r + 1,
                            backgroundColor: "rgba(28, 240, 255, 0.56)", // the color when hovering over
                            borderRadius: 4,
                        }}
                        />
                    ) : null
                    )}
                </div>
                </div>
            </BoardWithAxes>

                <div className="card-empty w-full max-w-lg mx-auto">
                    <div style={{ textAlign: "left" }}>
                        <div>
                            <strong>(Click to place, press R to rotate)</strong>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <strong>Orientation:</strong> <u>{orientation}</u>
                            {orientation === "Horizontal" ? " ↔️" : " ↕️"}
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <strong>Ships</strong>
                            <ul>
                                {ships.map(s => (
                                    <li key={s.id} className={selectedShipId===s.id ? "selectedShip" : ''} style={{ marginBottom: 6 }}>
                                        <button
                                            onClick={() => setSelectedShipId(s.id)}
                                            disabled={s.placed}
                                            style={{ marginRight: 8 }}
                                        >
                                            {s.name} ({s.size})
                                        </button>
                                        {s.placed ? (
                                            <button onClick={() => removeShip(s.id)}>Remove</button>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}