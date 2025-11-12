export type SortableListMoveEvent = {
  from: number;
  to: number;
};

export interface SortableListProps {
  children?: React.ReactNode;
  onMoveItem?: (event: SortableListMoveEvent) => void;
}
