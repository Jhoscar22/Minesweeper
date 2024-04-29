'use client';

import styles from "./cell.module.css";

interface CellProps {
    type: CellType;
    state: CellState;
    degree: number;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

import { CellState } from "@/types/grid.types";
import { CellType } from "@/types/grid.types";

export default function Cell({ type, state, degree, onClick, onContextMenu }: CellProps) {
    const isHidden = state === CellState.HIDDEN;
    const isMine = type === CellType.MINE;
    
    return (
        <div
            className={[isHidden ? styles.hiddenCell : isMine ? styles.mineCell : styles.revealedCell, styles.cell].join(' ')}
            onClick={onClick}
            onContextMenu={onContextMenu}
        >
            {state === CellState.REVEALED && (isMine ? "💣" : degree)}
        </div>
    );
}
