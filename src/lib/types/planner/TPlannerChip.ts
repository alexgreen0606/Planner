import { GenericIconProps } from '@/components/Icon';

// ✅

export type TPlannerChip = {
  id: string;
  title: string;
  color: string;
  iconConfig: GenericIconProps;
  onClick?: () => void;
};
