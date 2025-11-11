import { SFSymbol } from "expo-symbols";

export type TPlannerChip = {
  id: string;
  title: string;
  color: string;
  iconName: SFSymbol;
  onClick?: () => void;
};
