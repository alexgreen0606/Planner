import useAppTheme from '@/hooks/useAppTheme';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlannerChip } from '@/lib/types/planner/TPlannerChip';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import React, { useMemo } from 'react';
import { PlatformColor, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import CustomText from '../text/CustomText';
import Icon from '../icons/Icon';

// ✅ 

type TPlannerChipProps = {
    chip: TPlannerChip;
    backgroundPlatformColor?: string;
    index: number;
};

const PlannerChip = ({
    chip: {
        title,
        id,
        iconConfig,
        color,
        onClick
    },
    backgroundPlatformColor = 'systemGray6',
    index
}: TPlannerChipProps) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const { onGetDeletingItemsByStorageIdCallback } = useDeleteSchedulerContext<IPlannerEvent>();

    const { weatherChip } = useAppTheme();

    const isPendingDelete = useMemo(() =>
        onGetDeletingItemsByStorageIdCallback(EStorageId.PLANNER_EVENT).some(deleteItem =>
            // This deleting item is the chip's event
            (deleteItem.id === id || (deleteItem.calendarId === id)) &&
            // This deleting item is not from today
            deleteItem.listId !== getTodayDatestamp()
        ),
        [onGetDeletingItemsByStorageIdCallback]
    );

    const isWeatherChip = id.includes('weather-chip');
    const chipColor = isPendingDelete ? 'tertiaryLabel' : color;
    const chipCssColor = isValidPlatformColor(chipColor) ? PlatformColor(chipColor) : chipColor;

    return (
        <Pressable onPress={onClick}>
            <Animated.View
                layout={LinearTransition.duration(5000)}
                // entering={ZoomIn.duration(400)}
                // TODO: do better
                // exiting={SequencedTransition.duration(5000)}
                className='flex-row gap-1 h-6 rounded-xl min-w-6 items-center border justify-center relative overflow-hidden'
                style={{
                    borderColor: chipCssColor,
                    paddingHorizontal: 6
                }}
            >
                <View
                    className='absolute opacity-80 right-0 top-0 left-0 bottom-0'
                    style={{ backgroundColor: isWeatherChip ? PlatformColor(weatherChip.background) : PlatformColor(backgroundPlatformColor) }}
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
        </Pressable>
    )
};

export default PlannerChip;