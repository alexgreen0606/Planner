import { TSelectableColor } from '@/lib/constants/selectableColors';

import { TListItem } from './TListItem';

// ✅

export interface IColoredListItem extends TListItem {
  platformColor: TSelectableColor;
}
