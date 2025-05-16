import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { deletePlannerSet, getPlannerSetTitles, savePlannerSet } from '../../../src/storage/plannerSetsStorage';

import { PLANNER_SETS_STORAGE_ID } from '@/constants/storageIds';
import Modal from '@/components/modal';
import Form from '@/components/modal/components/form';
import { IFormField } from '@/types/form/IFormField';
import { TPlannerSet } from '@/types/planner/TPlannerSet';
import { EFormFieldType } from '@/enums/EFormFieldType';

export const PLANNER_SET_MODAL_PATHNAME = '(modals)/plannerSetModal/';

type PendingPlannerSet = {
    title: string;
    startDate: string | null;
    endDate: string | null;
}

const emptyFormData: PendingPlannerSet = {
    title: '',
    startDate: null,
    endDate: null
};

const PlannerSetModal = () => {
    const { plannerSetKey } = useLocalSearchParams<{ plannerSetKey: string }>();
    const existingPlannerTitles = getPlannerSetTitles();

    const router = useRouter();
    const pathname = usePathname();
    const isModalOpen = pathname.includes(PLANNER_SET_MODAL_PATHNAME);

    const storage = useMMKV({ id: PLANNER_SETS_STORAGE_ID });
    const [plannerSet] = useMMKVObject<TPlannerSet>(plannerSetKey, storage);

    const isEditMode = !!plannerSetKey;

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { isValid }
    } = useForm<PendingPlannerSet>({
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
            type: EFormFieldType.TEXT,
            placeholder: 'Title',
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
            type: EFormFieldType.DATE_RANGE,
            rules: {
                validate: ({ startDate, endDate }: { startDate: string, endDate: string }) => startDate && endDate
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

    function onSubmit(data: PendingPlannerSet) {
        data.title = data.title.trim();
        if (!data.startDate || !data.endDate) return;
        savePlannerSet(data as TPlannerSet);
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
                fields={formFields}
                control={control}
            />
        </Modal>
    );
};

export default PlannerSetModal;