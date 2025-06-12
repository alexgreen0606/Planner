import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import Form from '@/components/form';
import Modal from '@/components/modal';
import { NULL } from '@/lib/constants/generic';
import { PLANNER_SETS_STORAGE_ID } from '@/lib/constants/storage';
import { EFormFieldType } from '@/lib/enums/EFormFieldType';
import { IFormField } from '@/lib/types/form/IFormField';
import { TPlannerSet } from '@/lib/types/planner/TPlannerSet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { deletePlannerSet, getPlannerSetTitles, savePlannerSet } from '../../../src/storage/plannerSetsStorage';

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

    const setPlannerSetKey = useSetAtom(plannerSetKeyAtom);

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
        setPlannerSetKey(data.title);
        router.back();
    }

    function handleDelete() {
        if (plannerSet) {
            deletePlannerSet(plannerSet);
            setPlannerSetKey('Next 7 Days');
        }
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
                hidden: !isEditMode,
                optionLabels: ['Delete Planner'],
                optionHandlers: [handleDelete],
                message: 'Events in the planner will not be deleted.'
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