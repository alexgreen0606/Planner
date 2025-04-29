import React, { useEffect, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { PlannerSet } from '../types';
import Modal from '../../../foundation/components/Modal';
import ThinLine from '../../../foundation/sortedLists/components/list/ThinLine';
import CalendarSelect from '../../../foundation/calendarEvents/components/CalendarSelect';
import CustomText from '../../../foundation/components/text/CustomText';
import globalStyles from '../../../foundation/theme/globalStyles';
import DateValue from '../../../foundation/calendarEvents/components/values/DateValue';
import { datestampToMidnightDate } from '../../../foundation/calendarEvents/timestampUtils';
import { TIME_MODAL_INPUT_HEIGHT } from '../../../foundation/calendarEvents/constants';
import { LIST_CONTENT_HEIGHT } from '../../../foundation/sortedLists/constants';
import { deletePlannerSet, savePlannerSet } from '../storage/plannerSetsStorage';
import { uuid } from 'expo-modules-core';
import ModalInputField from '../../../foundation/components/ModalInputField';

type FormData = {
    title: string;
    dates: string[]
}

const initialFormData: FormData = {
    title: '',
    dates: []
};

export interface PlannerSetModalProps {
    initialPlannerSet?: PlannerSet;
    toggleModalOpen: () => void;
    open: boolean;
}

const PlannerSetModal = ({
    initialPlannerSet,
    toggleModalOpen,
    open
}: PlannerSetModalProps) => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const formDataFilled = formData.title.length > 0 && formData.dates.length > 0;
    const isEditMode = !!initialPlannerSet;

    // Populate the form for edit mode
    useEffect(() => {
        if (initialPlannerSet) {
            setFormData({
                title: initialPlannerSet.title,
                dates: initialPlannerSet.dates
            });
        }
    }, [initialPlannerSet]);

    // Clear the form when the modal closes
    useEffect(() => {
        if (!open) {
            setFormData(initialFormData);
        }
    }, [open]);

    // ------------- Utility Functions -------------

    function handleDatesChange(dates: string[]) {
        setFormData({ ...formData, dates });
    }

    function handleSave() {
        savePlannerSet({
            ...formData,
            id: uuid.v4(),
        })
        toggleModalOpen();
    }

    function handleDelete() {
        if (initialPlannerSet) {
            deletePlannerSet(initialPlannerSet);
        }
        toggleModalOpen();
    }

    return (
        <Modal
            open={open}
            toggleModalOpen={toggleModalOpen}
            title={isEditMode ? 'Edit Planner' : 'Create Planner'}
            primaryButtonConfig={{
                label: 'Save',
                onClick: handleSave,
                disabled: !formDataFilled
            }}
            deleteButtonConfig={{
                label: 'Delete Planner',
                onClick: handleDelete,
                hidden: !isEditMode
            }}
            customStyle={{ gap: 4 }}
        >

            <ModalInputField
                label='Title'
                value={formData.title}
                onChange={(newVal) => {
                    setFormData({ ...formData, title: newVal });
                }}
                focusTrigger={open && !isEditMode}
            />

            <ThinLine />

            <CalendarSelect clearSelection={!open} handleDatesChange={handleDatesChange} />

            <ThinLine />

            <View style={{ alignItems: 'center', height: TIME_MODAL_INPUT_HEIGHT }}>
                <View style={globalStyles.spacedApart}>
                    <CustomText type='standard' style={{ color: PlatformColor('secondaryLabel') }}>Start Date</CustomText>
                    <View style={{ flex: 1 }} />
                    {formData.dates.length > 0 && (
                        <View style={{ ...globalStyles.verticallyCentered, transform: 'scale(1.1)', paddingRight: 16, height: LIST_CONTENT_HEIGHT }}>
                            <DateValue date={datestampToMidnightDate(formData.dates[0])} />
                        </View>
                    )}
                </View>
            </View>

            <ThinLine />

            <View style={{ alignItems: 'center', height: TIME_MODAL_INPUT_HEIGHT }}>
                <View style={globalStyles.spacedApart}>
                    <CustomText type='standard' style={{ color: PlatformColor('secondaryLabel') }}>End Date</CustomText>
                    <View style={{ flex: 1 }} />
                    {formData.dates.length > 0 && (
                        <View style={{ ...globalStyles.verticallyCentered, transform: 'scale(1.1)', paddingRight: 16, height: LIST_CONTENT_HEIGHT }}>
                            <DateValue date={datestampToMidnightDate(formData.dates[formData.dates.length - 1])} />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default PlannerSetModal;