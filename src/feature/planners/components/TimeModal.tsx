import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Checkbox, useTheme } from 'react-native-paper';
import globalStyles from '../../../theme/globalStyles';
import Modal from '../../../foundation/ui/modal/Modal';
import { TimeDialog } from '../types';
import TimeDropdown from '../../../foundation/ui/input/TimeDropdown';
import { generateTimeOptions } from '../utils';
import CustomText from '../../../foundation/ui/text';

interface TimeModalProps {
    toggleModalOpen: () => void;
    open: boolean;
    onSave: (data: TimeDialog) => void;
}

const TimeModal = ({ toggleModalOpen, open }: TimeModalProps) => {
    const { colors } = useTheme();
    const [timeModalData, setTimeModalData] = useState<TimeDialog>({
        syncCalendar: false,
        allDay: true,
        startTime: '',
        endTime: ''
    });

    return (
        <Modal
            title='Manage event time'
            toggleModalOpen={toggleModalOpen}
            open={open}
            primaryButtonConfig={{
                label: 'Save',
                onClick: () => { }
            }}
        >
            <View style={styles.container}>
                <View style={globalStyles.spacedApart}>
                    <View style={{ width: '46%' }}>
                        <CustomText type='collapseText'>Calendar Event</CustomText>
                        <Checkbox
                            status={timeModalData.syncCalendar ? 'checked' : 'unchecked'}
                            onPress={() => {
                                setTimeModalData({ ...timeModalData, syncCalendar: !timeModalData.syncCalendar })
                            }}
                            color={colors.primary}
                            uncheckedColor={colors.outline}
                        />
                    </View>
                    <View style={{ width: '46%' }}>
                        <CustomText type='collapseText'>Start Time</CustomText>
                        <TimeDropdown
                            value={generateTimeOptions()[0]}
                            onChange={() => { }}
                            options={generateTimeOptions()}
                            placeholder='Start Time'
                        />
                    </View>
                </View>
                <View style={globalStyles.spacedApart}>
                    <View style={{ width: '46%' }}>
                        {timeModalData.syncCalendar && (
                            <>
                                <CustomText type='collapseText'>All Day</CustomText>
                                <Checkbox
                                    status={timeModalData.allDay ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        setTimeModalData({ ...timeModalData, allDay: !timeModalData.allDay })
                                    }}
                                    color={colors.primary}
                                    uncheckedColor={colors.outline}
                                />
                            </>
                        )}
                    </View>
                    <View style={{ width: '46%' }}>
                        {!timeModalData.allDay && timeModalData.syncCalendar && (
                            <>
                                <CustomText type='collapseText'>End Time</CustomText>
                                <TimeDropdown
                                    value={generateTimeOptions()[0]}
                                    onChange={() => { }}
                                    options={generateTimeOptions()}
                                    placeholder='End Time'
                                />
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 150
    }
});

export default TimeModal;