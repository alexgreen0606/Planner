import React, { useEffect, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import Modal from '../../../src/foundation/components/Modal';
import ModalInputField from '../../../src/foundation/components/ModalInputField';
import ThinLine from '../../../src/foundation/sortedLists/components/list/ThinLine';
import CalendarSelect from '../../../src/foundation/calendarEvents/components/CalendarSelect';
import CustomText from '../../../src/foundation/components/text/CustomText';
import { TIME_MODAL_INPUT_HEIGHT } from '../../../src/foundation/calendarEvents/constants';
import { LIST_CONTENT_HEIGHT } from '../../../src/foundation/sortedLists/constants';
import { datestampToMidnightDate } from '../../../src/foundation/calendarEvents/timestampUtils';
import globalStyles from '../../../src/foundation/theme/globalStyles';
import DateValue from '../../../src/foundation/calendarEvents/components/values/DateValue';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { PLANNER_SETS_STORAGE_ID, PlannerSet } from '../../../src/feature/plannerCard/types';
import { deletePlannerSet, savePlannerSet } from '../../../src/storage/plannerSetsStorage';

export const PLANNER_SET_MODAL_PATHNAME = '(modals)/plannerSetModal/';

type FormData = {
    title: string;
    dates: string[]
}

const initialFormData: FormData = {
    title: '',
    dates: []
};

const PlannerSetModal = () => {
    const { plannerSetKey } = useLocalSearchParams<{ plannerSetKey: string }>();

    const router = useRouter();
    const pathname = usePathname();
    const isModalOpen = pathname.includes(PLANNER_SET_MODAL_PATHNAME);

    const storage = useMMKV({ id: PLANNER_SETS_STORAGE_ID });
    const [plannerSet, setPlannerSet] = useMMKVObject<PlannerSet>(plannerSetKey, storage);

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const formDataFilled = formData.title.length > 0 && formData.dates.length > 0;
    const isEditMode = !!plannerSetKey;

    // Populate the form for edit mode
    useEffect(() => {
        if (plannerSet) {
            setFormData({
                title: plannerSet.title,
                dates: plannerSet.dates
            });
        }
    }, [plannerSet]);

    // Clear the form when the modal closes
    useEffect(() => {
        if (!isModalOpen) {
            setFormData(initialFormData);
        }
    }, [isModalOpen]);

    // ------------- Utility Functions -------------

    function handleDatesChange(dates: string[]) {
        setFormData({ ...formData, dates });
    }

    function handleSave() {
        if (plannerSet) {
            setPlannerSet(formData)
        } else {
            savePlannerSet(formData)
        }
        router.back();
    }

    function handleDelete() {
        if (plannerSet) {
            deletePlannerSet(plannerSet);
        }
        router.back();
    }

    return (
        <Modal
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
            onClose={() => router.back()}
            customStyle={{ gap: 4 }}
        >

            <ModalInputField
                label='Title'
                value={formData.title}
                onChange={(newVal) => {
                    setFormData({ ...formData, title: newVal });
                }}
                focusTrigger={isModalOpen && !isEditMode}
            />

            <ThinLine />

            <CalendarSelect clearSelection={!isModalOpen} handleDatesChange={handleDatesChange} />

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