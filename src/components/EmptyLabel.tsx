import React from 'react';
import { useWindowDimensions } from 'react-native';

import CustomText from './text/CustomText';
import FadeTransitionView from './views/FadeTransitionView';

interface IEmptyPageLabelProps {
  label: string;
};

const EmptyPageLabel = ({ label }: IEmptyPageLabelProps) => {
  const { width, height } = useWindowDimensions();
  return (
    <FadeTransitionView
      className="flex-1 absolute bottom-0 left-0 pointer-events-none items-center justify-center gap-2"
      style={{ width, height }}
    >
      <CustomText variant="emptyLabel">{label}</CustomText>
    </FadeTransitionView>
  );
};

export default EmptyPageLabel;
