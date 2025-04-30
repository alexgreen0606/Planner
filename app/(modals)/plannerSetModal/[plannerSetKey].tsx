import React, { useEffect } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import DateValue from '../../../src/foundation/calendarEvents/components/values/DateValue';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { PLANNER_SETS_STORAGE_ID, PlannerSet } from '../../../src/feature/plannerCard/types';
import { deletePlannerSet, getPlannerSetTitles, savePlannerSet } from '../../../src/feature/plannerSets/plannerSetsStorage';

export const PLANNER_SET_MODAL_PATHNAME = '(modals)/plannerSetModal/';

const emptyFormData: PlannerSet = {
    title: '',
    dates: []
};

const PlannerSetModal = () => {
    const { plannerSetKey } = useLocalSearchParams<{ plannerSetKey: string }>();
    const existingPlannerTitles = getPlannerSetTitles();

    const router = useRouter();
    const pathname = usePathname();
    const isModalOpen = pathname.includes(PLANNER_SET_MODAL_PATHNAME);

    const storage = useMMKV({ id: PLANNER_SETS_STORAGE_ID });
    const [plannerSet] = useMMKVObject<PlannerSet>(plannerSetKey, storage);

    const isEditMode = !!plannerSetKey;

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { isValid }
    } = useForm<PlannerSet>({
        defaultValues: {
            ...emptyFormData,
            ...plannerSet
        },
        mode: 'onChange'
    });

    const dates = watch('dates');
    const title = watch('title');

    // Populate the form in edit mode
    useEffect(() => {
        reset({
            ...emptyFormData,
            ...plannerSet
        });
    }, [plannerSet, reset]);

    // ------------- Utility Functions -------------

    function onSubmit(data: PlannerSet) {
        data.title = title.trim();
        savePlannerSet(data);
        router.back();
    }

    function handleDelete() {
        if (plannerSet) deletePlannerSet(plannerSet);
        router.back();
    }

    return (
        <Modal
            title={isEditMode ? 'Edit Planner' : 'Create Planner'}
            primaryButtonConfig={{
                label: 'Save',
                onClick: handleSubmit(onSubmit),
                disabled: !isValid
            }}
            deleteButtonConfig={{
                label: 'Delete Planner',
                onClick: handleDelete,
                hidden: !isEditMode
            }}
            onClose={() => router.back()}
        >

            <Controller
                control={control}
                name="title"
                rules={{
                    required: 'Title is required',
                    validate: (value) =>
                        existingPlannerTitles.indexOf(value.trim()) === -1 ||
                        plannerSet?.title === value.trim()
                }}
                render={({ field }) => (
                    <ModalInputField
                        label="Title"
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        focusTrigger={isModalOpen && !isEditMode}
                    />
                )}
            />

            <ThinLine />

            <Controller
                control={control}
                name="dates"
                rules={{
                    validate: (value) => value.length > 0
                }}
                render={({ field }) => (
                    <CalendarSelect
                        dates={dates}
                        onChange={(newDates) => field.onChange(newDates)}
                    />
                )}
            />

            <ThinLine />

            <View style={{ alignItems: 'center', height: TIME_MODAL_INPUT_HEIGHT }}>
                <View style={[globalStyles.spacedApart, globalStyles.verticallyCentered]}>
                    <CustomText type='standard' style={{ color: PlatformColor('secondaryLabel') }}>Start Date</CustomText>
                    <View style={{ flex: 1 }} />
                    {dates.length > 0 && (
                        <View style={{ ...globalStyles.verticallyCentered, transform: 'scale(1.1)', paddingRight: 16, height: LIST_CONTENT_HEIGHT }}>
                            <DateValue date={datestampToMidnightDate(dates[0])} />
                        </View>
                    )}
                </View>
            </View>

            <ThinLine />

            <View style={{ alignItems: 'center', height: TIME_MODAL_INPUT_HEIGHT }}>
                <View style={globalStyles.spacedApart}>
                    <CustomText type='standard' style={{ color: PlatformColor('secondaryLabel') }}>End Date</CustomText>
                    <View style={{ flex: 1 }} />
                    {dates.length > 0 && (
                        <View style={{ ...globalStyles.verticallyCentered, transform: 'scale(1.1)', paddingRight: 16, height: LIST_CONTENT_HEIGHT }}>
                            <DateValue date={datestampToMidnightDate(dates[dates.length - 1])} />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default PlannerSetModal;