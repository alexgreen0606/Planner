import useAppTheme from '@/hooks/useAppTheme';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlannerChip } from '@/lib/types/planner/TPlannerChip';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import React, { useMemo } from 'react';
import { PlatformColor, Pressable, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, LinearTransition, SlideInDown, SlideInUp } from 'react-native-reanimated';
import CustomText from '../text/CustomText';
import Icon from '../icons/Icon';
import { PRESSABLE_OPACITY } from '@/lib/constants/generic';

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

    const { weatherChip, CssColor: { background } } = useAppTheme();

    const isWeatherChip = id.includes('weather-chip');
    const chipColor = isPendingDelete ? 'tertiaryLabel' : color;
    const chipCssColor = isValidPlatformColor(chipColor) ? PlatformColor(chipColor) : chipColor;

    return (
        <TouchableOpacity activeOpacity={onClick ? PRESSABLE_OPACITY : 1} onPress={onClick}>
            <Animated.View
                entering={FadeInUp}
                exiting={FadeOutDown}
                className='flex-row gap-1 h-6 rounded-xl min-w-6 items-center border justify-center relative overflow-hidden'
                style={{
                    borderColor: chipCssColor,
                    paddingHorizontal: 6
                }}
            >
                <View
                    className='absolute opacity-80 right-0 top-0 left-0 bottom-0'
                    style={{ backgroundColor: isWeatherChip ? PlatformColor(weatherChip.background) : background }}
                />
                <Icon
                    {...iconConfig}
                    color={chipColor}
                    size={14}
                />
                <CustomText
                    variant='eventChipLabel'
                    ellipsizeMode='tail'
                    numberOfLines={1}
                    customStyle={{
                        color: isWeatherChip ? PlatformColor(weatherChip.label) : chipCssColor,
                        textDecorationLine: isPendingDelete ? 'line-through' : undefined,
                    }}
                >
                    {title}
                </CustomText>
            </Animated.View>
        </TouchableOpacity>
    )
};

export default PlannerChip;