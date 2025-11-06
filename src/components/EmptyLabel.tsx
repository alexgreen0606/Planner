import React from 'react';
import { useWindowDimensions } from 'react-native';

import Icon, { TIconProps } from './icons/Icon';
import CustomText from './text/CustomText';
import FadeInView from './views/FadeInView';

// ✅

export type TEmptyPageLabelProps = {
  label: string;
  iconProps?: TIconProps;
};

const EmptyPageLabel = ({ label, iconProps }: TEmptyPageLabelProps) => {
  const { width, height } = useWindowDimensions();
  return (
    <FadeInView
      className="flex-1 absolute bottom-0 left-0 pointer-events-none items-center justify-center gap-2"
      style={{ width, height }}
    >
      {iconProps && <Icon {...iconProps} />}
      <CustomText variant="emptyLabel">{label}</CustomText>
    </FadeInView>
  );
};

export default EmptyPageLabel;
