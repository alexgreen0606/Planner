import { Host, VStack } from '@expo/ui/swift-ui';
import { cornerRadius, frame, glassEffect } from '@expo/ui/swift-ui/modifiers';
import { useAtomValue } from 'jotai';
import React from 'react';
import { PlatformColor, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { plannerChipsByDatestamp } from '@/atoms/planner/plannerChips';
import CustomText from '@/components/text/CustomText';
import { PLANNER_CHIP_HEIGHT } from '@/lib/constants/miscLayout';

import PlannerChip from './PlannerChip';

// ✅

type TPlannerChipSetsProps = {
  datestamp: string;
  label: string;
};

const PlannerChipSets = ({ datestamp, label }: TPlannerChipSetsProps) => {
  const sets = useAtomValue(plannerChipsByDatestamp(datestamp));
  return (
    <Animated.View className="flex-row flex-wrap gap-2">
      <Host style={{ height: PLANNER_CHIP_HEIGHT }}>
        <VStack
          modifiers={[
            glassEffect({
              glass: { variant: 'regular' },
              shape: 'rectangle'
            }),
            cornerRadius(PLANNER_CHIP_HEIGHT / 2),
            frame({ height: PLANNER_CHIP_HEIGHT })
          ]}
        >
          <View className="px-4 py-[0.375rem]">
            <CustomText
              variant="plannerChipTitle"
              customStyle={{
                color: PlatformColor('label')
              }}
            >
              {label}
            </CustomText>
          </View>
        </VStack>
      </Host>
      {sets.map((set, setIndex) =>
        set.map((chip) => <PlannerChip {...chip} key={`${datestamp}-${chip.title}-${setIndex}`} />)
      )}
    </Animated.View>
  );
};

export default PlannerChipSets;
