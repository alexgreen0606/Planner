import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../components/GenericIcon';
import globalStyles from '../../theme/globalStyles';
import CustomText from '../../components/text/CustomText';
import TimeModal from './TimeModal';
import { PlannerEvent } from '../types';
import { saveEvent } from '../storage/plannerStorage';

export interface EventChipProps {
    planEvent?: PlannerEvent;
    iconConfig: GenericIconProps;
    color: string;
    label: string;
};

const EventChip = ({
    planEvent,
    label,
    iconConfig,
    color
}: EventChipProps) => {
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    
    const toggleTimeModal = () => {
        setIsTimeModalOpen(!isTimeModalOpen);
    };
    
    const handleSave = (updatedEvent: PlannerEvent) => {
        saveEvent(updatedEvent);

        // TODO: reload the lists?
        
        toggleTimeModal();
    };
    
    const ChipContent = () => (
        <View style={{ ...styles.chip, borderColor: color }}>
            <GenericIcon
                {...iconConfig}
                platformColor={color}
                size='xs'
            />
            <CustomText
                type='soft'
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{ color }}
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