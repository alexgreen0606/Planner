import { NativeSyntheticEvent } from "react-native";

export type SortableListMoveEvent = {
  from: number;
  to: number;
};

export interface SortableListProps {
  children?: React.ReactNode;
  toolbarIcons?: string[];
  accentColor: string;
  focusedId: string | null;
  sortedItemIds: string[];
  itemTextColorsMap: Record<string, string>;
  itemValueMap: Record<string, string>;
  selectedItemMap: Record<string, boolean>;
  disabledSelectItemMap: Record<string, boolean>;
  onFocusChange: (event: NativeSyntheticEvent<{ id: string | null }>) => void;
  onCreateItem: (event: NativeSyntheticEvent<{ index: number }>) => void;
  onMoveItem: (event: NativeSyntheticEvent<SortableListMoveEvent>) => void;
  onDeleteItem: (event: NativeSyntheticEvent<{ id: string }>) => void;
  onToggleItem: (event: NativeSyntheticEvent<{ id: string }>) => void;
  onValueChange: (event: NativeSyntheticEvent<{ value: string }>) => void;
  onToolbarPress?: (event: NativeSyntheticEvent<{ icon: string, itemId: string }>) => void;
}
