import { NativeSyntheticEvent } from "react-native";

export type SortableListMoveEvent = {
  from: number;
  to: number;
};

export type SortableListCreateEvent = {
  baseId?: string;
  offset?: number;
  shouldSlideTo?: boolean;
}

export interface SortableListProps {
  children?: React.ReactNode;
  toolbarIcons?: string[];
  accentColor: string;
  sortedItemIds: string[];
  itemTextColorsMap: Record<string, string>;
  itemValueMap: Record<string, string>;
  itemTimeValuesMap?: Record<string, Record<string, string>>;
  selectedItemIds: string[];
  disabledItemIds: string[];
  topInset: number;
  slideToIdTrigger: string | undefined;
  snapToIdTrigger: string | undefined;
  bottomInset: number;
  onCreateItem: (event: NativeSyntheticEvent<SortableListCreateEvent>) => void;
  onMoveItem: (event: NativeSyntheticEvent<SortableListMoveEvent>) => void;
  onDeleteItem: (event: NativeSyntheticEvent<{ id: string }>) => void;
  onToggleItem: (event: NativeSyntheticEvent<{ id: string }>) => void;
  onOpenTimeModal?: (event: NativeSyntheticEvent<{ id: string }>) => void;
  onValueChange: (event: NativeSyntheticEvent<{ value: string, id: string }>) => void;
  onScrollChange: (event: NativeSyntheticEvent<{ isScrollingDown: boolean }>) => void;
  onToolbarPress?: (event: NativeSyntheticEvent<{ icon: string, itemId: string }>) => void;
}
