'use client';

import styles from "./grid.module.css";

import useGrid from "@/hooks/useGrid";

import Cell from "@/components/cell/cell";

export default function Grid() {
    const { cells, revealCell, toggleFlag, revealedCells, flaggedCells, gameOver } = useGrid(10, 10, 20);
    return (
        <div className={styles.grid}>
            <div className={styles.info}>
            <div>Revealed Cells: {revealedCells}</div>
            <div>Flagged Cells: {flaggedCells}</div>
            {gameOver && <div>Game Over!</div>}
            </div>
            {cells.map((row, y) => (
                <div key={y} className={styles.row}>
                    {row.map((cell, x) => (
                        <Cell
                            key={x}
                            state={cell.state}
                            type={cell.type}
                            degree={cell.degree}
                            onClick={() => {
                                console.log(`Reveal cell at ${x}, ${y}`);
                                revealCell(x, y)
                            }}
                            onContextMenu={(e) => { e.preventDefault(); toggleFlag(x, y); }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};