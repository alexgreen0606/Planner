import { PRESSABLE_OPACITY } from '@/lib/constants/generic';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlannerChip } from '@/lib/types/planner/TPlannerChip';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { getValidCssColor } from '@/utils/colorUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { Host, VStack } from '@expo/ui/swift-ui';
import { cornerRadius, frame, glassEffect } from '@expo/ui/swift-ui/modifiers';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import Icon from '../icons/Icon';
import CustomText from '../text/CustomText';
import { PLANNER_CHIP_HEIGHT } from '@/lib/constants/miscLayout';

// ✅ 

const PlannerChip = ({
    title,
    id,
    iconConfig,
    color,
    onClick
}: TPlannerChip) => {
    const { onGetDeletingItemsByStorageIdCallback } = useDeleteSchedulerContext<IPlannerEvent>();

    const isPendingDelete = useMemo(() =>
        onGetDeletingItemsByStorageIdCallback(EStorageId.PLANNER_EVENT).some(deleteItem =>
            // This deleting item is the chip's event
            (deleteItem.id === id || (deleteItem.calendarEventId === id)) &&
            // This deleting item is not from today
            deleteItem.listId !== getTodayDatestamp()
        ),
        [onGetDeletingItemsByStorageIdCallback]
    );

    const chipColor = isPendingDelete ? 'tertiaryLabel' : color;
    const chipCssColor = getValidCssColor(chipColor);

    return (
        <TouchableOpacity activeOpacity={onClick ? PRESSABLE_OPACITY : 1} onPress={onClick}>
            <Animated.View
                entering={FadeInUp}
                exiting={FadeOutDown}
                style={{
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: chipCssColor,
                    borderRadius: PLANNER_CHIP_HEIGHT / 2
                }}
            >
                <Host style={{ height: PLANNER_CHIP_HEIGHT }}>
                    <VStack modifiers={[glassEffect({ glass: { variant: 'regular' }, shape: 'rectangle' }), cornerRadius(PLANNER_CHIP_HEIGHT / 2), frame({ height: PLANNER_CHIP_HEIGHT })]}>
                        <View className='px-2 flex-row gap-1 items-center py-[0.375rem]'>
                            <Icon
                                {...iconConfig}
                                color={chipColor}
                                size={14}
                            />
                            <CustomText variant='eventChipLabel' customStyle={{ color: chipCssColor }}>
                                {title}
                            </CustomText>
                        </View>
                    </VStack>
                </Host>
            </Animated.View>
        </TouchableOpacity>
    )
};

export default PlannerChip;