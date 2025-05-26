import React from 'react';
import { PlatformColor, StyleSheet, TouchableOpacity, View } from 'react-native';
import { isValidPlatformColor } from '../utils/colorUtils';
import GenericIcon, { GenericIconProps } from './GenericIcon';
import CustomText from './text/CustomText';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { saveEvent } from '@/storage/plannerStorage';
import { useTimeModal } from '../services/TimeModalProvider';
import { useReloadScheduler } from '@/hooks/useReloadScheduler';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';

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

    const { onOpen } = useTimeModal();

    const { getDeletingItems } = useDeleteScheduler<IPlannerEvent>();

    const { reloadPage } = useReloadScheduler();

    function handleOpen() {
        if (planEvent) onOpen(planEvent, handleSave);
    }

    async function handleSave(updatedEvent: IPlannerEvent) {
        await saveEvent(updatedEvent);
        reloadPage();
    }

    const isPendingDelete = planEvent &&
        getDeletingItems().some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // The deleting event is the end event
            (deleteItem as IPlannerEvent).timeConfig?.multiDayEnd
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