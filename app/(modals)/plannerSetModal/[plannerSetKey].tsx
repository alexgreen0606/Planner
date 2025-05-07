import React, { useEffect } from 'react';
import Modal from '../../../src/foundation/components/Modal';
import { useForm } from 'react-hook-form';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { PLANNER_SETS_STORAGE_ID, PlannerSet } from '../../../src/feature/plannerCard/types';
import { deletePlannerSet, getPlannerSetTitles, savePlannerSet } from '../../../src/feature/plannerSets/plannerSetsStorage';
import { EFieldType, IFormField } from '../../../src/foundation/forms/types';
import Form from '../../../src/foundation/forms/Form';

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

    // Create form fields configuration
    const formFields: IFormField[] = [
        {
            name: 'title',
            type: EFieldType.TEXT,
            label: 'Title',
            focusTrigger: isModalOpen && !isEditMode,
            rules: {
                required: 'Title is required',
                validate: (value: string) =>
                    existingPlannerTitles.indexOf(value.trim()) === -1 ||
                    plannerSet?.title === value.trim()
            }
        },
        {
            name: 'dates',
            type: EFieldType.DATE,
            rules: {
                validate: (value: string[]) => value.length > 0
            }
        }
    ];

    // Populate the form in edit mode
    useEffect(() => {
        reset({
            ...emptyFormData,
            ...plannerSet
        });
    }, [plannerSet, reset]);

    // ------------- Utility Functions -------------

    function onSubmit(data: PlannerSet) {
        data.title = data.title.trim();
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
            <Form
                options={formFields}
                control={control}
            />
        </Modal>
    );
};

export default PlannerSetModal;