import useAppTheme from '@/hooks/useAppTheme';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlannerChip } from '@/lib/types/planner/TPlannerChip';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import React, { useMemo } from 'react';
import { PlatformColor, Pressable, View } from 'react-native';
import GenericIcon from '../icon';
import CustomText from '../text/CustomText';
import { Button, Host, Label, Spacer, Text } from '@expo/ui/swift-ui';
import { frame, glassEffect, padding, tint } from '@expo/ui/swift-ui/modifiers';

// ✅ 

type TPlannerChipProps = {
    chip: TPlannerChip;
    backgroundPlatformColor?: string;
};

const PlannerChip = ({
    chip: {
        title,
        id,
        iconConfig,
        color,
        onClick
    },
    backgroundPlatformColor = 'systemGray6'
}: TPlannerChipProps) => {
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
            <View
                className='flex-row h-6 gap-1 min-w-6 items-center justify-center rounded-xl border'
                style={{
                    borderColor: chipCssColor,
                    backgroundColor: isWeatherChip ? PlatformColor(weatherChip.background) : PlatformColor(backgroundPlatformColor),
                    paddingHorizontal: 8
                }}
            >
                <GenericIcon
                    {...iconConfig}
                    platformColor={chipColor}
                    size='xs'
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
            </View>
        </Pressable>
    )
};

export default PlannerChip;