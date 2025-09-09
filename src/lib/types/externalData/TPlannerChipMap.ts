import { TPlannerChip } from '../planner/TPlannerChip';

// ✅ 

// Chips for each given day are separated by their calendar of origin (2D array)
export type TPlannerChipMap = Record<string, TPlannerChip[][]>;