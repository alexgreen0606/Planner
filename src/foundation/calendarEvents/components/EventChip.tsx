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
import { useReload } from '../../sortedLists/services/ReloadProvider';

export interface EventChipProps {
    planEvent?: PlannerEvent;
    iconConfig: GenericIconProps;
    backgroundPlatformColor?: string;
    color: string;
    label: string;
};

const EventChip = ({
    planEvent,
    label,
    iconConfig,
    backgroundPlatformColor = 'systemGray6',
    color
}: EventChipProps) => {
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

    const { isItemDeleting } = useDeleteScheduler();

    const toggleTimeModal = () => {
        setIsTimeModalOpen(!isTimeModalOpen);
    };

    const handleSave = async (updatedEvent: PlannerEvent) => {
        await saveEvent(updatedEvent);
        toggleTimeModal();
    };

    const isPendingDelete = planEvent && isItemDeleting(planEvent);
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