import { NativeSyntheticEvent } from "react-native";

export type SortableListMoveEvent = {
  from: number;
  to: number;
};

export interface SortableListProps {
  children?: React.ReactNode;
  toolbarIcons?: string[];
  primaryColor?: string;
  onMoveItem?: (event: SortableListMoveEvent) => void;
  onToolbarPress?: (event: NativeSyntheticEvent<{ icon: string, itemId: string }>) => void;
}
