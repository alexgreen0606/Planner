import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { openTimeModal } from '@/utils/plannerUtils';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { PlatformColor, StyleSheet, TouchableOpacity, View } from 'react-native';
import GenericIcon, { GenericIconProps } from './GenericIcon';
import CustomText from './text/CustomText';
import { isValidPlatformColor } from '@/utils/colorUtils';

export interface EventChipProps {
    planEvent?: IPlannerEvent;
    iconConfig: GenericIconProps;
    backgroundPlatformColor?: string;
    color: string;
    label: string;
    onClick?: () => void;
};

const EventChip = ({
    planEvent,
    label,
    iconConfig,
    backgroundPlatformColor = 'systemGray6',
    color,
    onClick
}: EventChipProps) => {
    const { getDeletingItems } = useDeleteScheduler<IPlannerEvent>();
    const router = useRouter();

    function handleOpen() {
        if (planEvent) openTimeModal(planEvent.listId, planEvent, router);
    }

    const isPendingDelete = useMemo(() => planEvent &&
        getDeletingItems().some(deleteItem =>
            // This deleting item is the chip's event
            deleteItem.id === planEvent.id &&
            // This deleting item is not from today
            deleteItem.listId !== getTodayDatestamp()
        ),
        [getDeletingItems]
    );
    const chipColor = isPendingDelete ? 'tertiaryLabel' : color;

    const ChipContent = () => (
        <View
            className='flex-row gap-2 h-5 max-w-full px-[10px] items-center rounded-[16px]'
            style={{
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: isValidPlatformColor(chipColor) ? PlatformColor(chipColor) : chipColor,
                backgroundColor: PlatformColor(backgroundPlatformColor)
            }}
        >
            <GenericIcon
                {...iconConfig}
                platformColor={chipColor}
                size='xs'
            />
            <CustomText
                type='soft'
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{
                    color: isValidPlatformColor(chipColor) ? PlatformColor(chipColor) : chipColor,
                    textDecorationLine: isPendingDelete ? 'line-through' : undefined
                }}
            >
                {label}
            </CustomText>
        </View>
    );

    return (
        <>
            {planEvent ? (
                <>
                    <TouchableOpacity onPress={handleOpen}>
                        <ChipContent />
                    </TouchableOpacity>
                </>
            ) : onClick ? (
                <TouchableOpacity onPress={onClick}>
                    <ChipContent />
                </TouchableOpacity>
            ) : (
                <ChipContent />
            )}
        </>
    );
};

export default EventChip;