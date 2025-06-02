import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { deletePlannerSet, getPlannerSetTitles, savePlannerSet } from '../../../src/storage/plannerSetsStorage';
import { PLANNER_SETS_STORAGE_ID } from '@/constants/storageIds';
import Modal from '@/components/modal';
import Form from '@/components/form';
import { IFormField } from '@/types/form/IFormField';
import { TPlannerSet } from '@/types/planner/TPlannerSet';
import { EFormFieldType } from '@/enums/EFormFieldType';
import { NULL } from '@/constants/generic';

export const PLANNER_SET_MODAL_PATHNAME = '(modals)/plannerSetModal/';

type PendingPlannerSet = {
    title: string;
    dates: {
        startTime: string | null,
        endTime: string | null
    }
}

const emptyFormData: PendingPlannerSet = {
    title: '',
    dates: {
        startTime: null,
        endTime: null
    }
};

const PlannerSetModal = () => {
    const { plannerSetKey } = useLocalSearchParams<{ plannerSetKey: string }>();
    const existingPlannerTitles = getPlannerSetTitles();

    const router = useRouter();

    const storage = useMMKV({ id: PLANNER_SETS_STORAGE_ID });
    const [plannerSet] = useMMKVObject<TPlannerSet>(plannerSetKey, storage);

    const isEditMode = plannerSetKey !== NULL;

    const {
        control,
        handleSubmit,
        reset,
        formState: { isValid }
    } = useForm<PendingPlannerSet>({
        defaultValues: {
            ...emptyFormData,
            ...plannerSet
        },
        mode: 'onChange'
    });

    // Create form fields configuration
    const formFields: IFormField[][] = [
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            placeholder: 'Title',
            trigger: !isEditMode,
            rules: {
                required: 'Title is required.',
                validate: (value: string) =>
                    existingPlannerTitles.indexOf(value.trim()) === -1 ||
                    plannerSet?.title === value.trim()
            }
        }],
        [{
            name: 'dates',
            type: EFormFieldType.DATE_RANGE,
            rules: {
                required: 'Date range is required',
                validate: (val) => Boolean(val.startTime) && Boolean(val.endTime)
            }
        }]
    ];

    // Populate the form in edit mode
    useEffect(() => {
        reset({
            ...emptyFormData,
            ...plannerSet,
            dates: {
                startTime: plannerSet?.startDate ?? null,
                endTime: plannerSet?.endDate ?? null
            }
        });
    }, [plannerSet, reset]);

    // ------------- Utility Functions -------------

    function onSubmit(data: PendingPlannerSet) {
        data.title = data.title.trim();
        if (!data.dates.startTime || !data.dates.endTime) return;
        savePlannerSet({
            title: data.title,
            startDate: data.dates.startTime,
            endDate: data.dates.endTime
        });
        router.back();
    }

    function handleDelete() {
        if (plannerSet) deletePlannerSet(plannerSet);
        router.back();
    }

    return (
        <Modal
            title={isEditMode ? 'Edit Planner Set' : 'Create Planner Set'}
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