import { SFSymbol } from 'expo-symbols';

import { EPopupActionType } from '../enums/EPopupActionType';

// ✅

type TBasePopupAction = {
  title: string;
  systemImage?: SFSymbol;
  hidden?: boolean;
};

type TButtonPopupAction = TBasePopupAction & {
  type: EPopupActionType.BUTTON;
  onPress: () => void;
  destructive?: boolean;
  value?: boolean;
  color?: string;
};

type TSwitchPopupAction = TBasePopupAction & {
  type: EPopupActionType.SWITCH;
  value: boolean;
  onPress: () => void;
};

type TSubmenuPopupAction = TBasePopupAction & {
  type: EPopupActionType.SUBMENU;
  items: TPopupAction[];
};

export type TPopupAction = TButtonPopupAction | TSwitchPopupAction | TSubmenuPopupAction;
