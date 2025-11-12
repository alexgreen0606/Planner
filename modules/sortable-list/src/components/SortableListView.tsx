import { requireNativeView } from 'expo';
import { SortableListProps } from '../types/SortableList.types';

const SortableListView = requireNativeView('SortableList');

export default function SortableList(props: SortableListProps) {
  return <SortableListView {...props} />;
}
