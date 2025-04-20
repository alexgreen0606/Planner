import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, PlatformColor } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../components/GenericIcon';
import globalStyles from '../../theme/globalStyles';
import CustomText from '../../components/text/CustomText';
import TimeModal from './timeModal/TimeModal';
import { PlannerEvent } from '../types';
import { saveEvent } from '../storage/plannerStorage';
import { isValidPlatformColor } from '../../theme/colors';
import { useDeleteScheduler } from '../../sortedLists/services/DeleteScheduler';

export interface EventChipProps {
    planEvent?: PlannerEvent;
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
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

    const { pendingDeleteItems } = useDeleteScheduler();

    const toggleTimeModal = () => {
        setIsTimeModalOpen(!isTimeModalOpen);
    };

    const handleSave = async (updatedEvent: PlannerEvent) => {
        await saveEvent(updatedEvent);
        toggleTimeModal();
    };

    const isPendingDelete = planEvent &&
        pendingDeleteItems.some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // The deleting event is the end event
            (deleteItem as PlannerEvent).timeConfig?.multiDayEnd
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
                    <TouchableOpacity onPress={() => toggleTimeModal()}>
                        <ChipContent />
                    </TouchableOpacity>

                    <TimeModal
                        toggleModalOpen={toggleTimeModal}
                        open={isTimeModalOpen}
                        onSave={handleSave}
                        item={planEvent}
                    />
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