import React from 'react';
import { PlatformColor, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useDeleteScheduler } from '../feature/sortedList/services/DeleteScheduler';
import { useReload } from '../services/ReloadProvider';
import { isValidPlatformColor } from '../utils/colorUtils';
import globalStyles from '../theme/globalStyles';
import GenericIcon, { GenericIconProps } from './GenericIcon';
import CustomText from './text/CustomText';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { saveEvent } from '@/storage/plannerStorage';
import { useTimeModal } from './modal/services/TimeModalProvider';

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

    const { pendingDeleteItems } = useDeleteScheduler();

    const { reloadPage } = useReload();

    function handleOpen() {
        if (planEvent) onOpen(planEvent, handleSave);
    }

    async function handleSave(updatedEvent: IPlannerEvent) {
        await saveEvent(updatedEvent);
        reloadPage();
    }

    const isPendingDelete = planEvent &&
        pendingDeleteItems.some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // The deleting event is the end event
            (deleteItem as IPlannerEvent).timeConfig?.multiDayEnd
        );
    const chipColor = isPendingDelete ? 'tertiaryLabel' : color;

    const ChipContent = () => (
        <View style={{
            ...styles.chip,
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

const styles = StyleSheet.create({
    chip: {
        ...globalStyles.verticallyCentered,
        height: 20,
        gap: 4,
        maxWidth: '100%',
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderRadius: 16,
    },
});

export default EventChip;