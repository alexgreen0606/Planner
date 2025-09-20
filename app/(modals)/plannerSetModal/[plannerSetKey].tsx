import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import Form from '@/components/form';
import Modal from '@/components/modal';
import { NULL } from '@/lib/constants/generic';
import { EFormFieldType } from '@/lib/enums/EFormFieldType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TFormField } from '@/lib/types/form/TFormField';
import { TPlannerSet } from '@/lib/types/planner/TPlannerSet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import { DateTime } from 'luxon';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { deletePlannerSet, upsertPlannerSet } from '../../../src/storage/plannerSetsStorage';

// ✅ 

type TPendingPlannerSet = {
    title: string;
    start: DateTime;
    end: DateTime;
};

const todayDate = DateTime.local().startOf('day');

const emptyFormData: TPendingPlannerSet = {
    title: '',
    start: todayDate,
    end: todayDate
};

const PlannerSetModal = () => {
    const { plannerSetKey } = useLocalSearchParams<{ plannerSetKey: string }>();
    const storage = useMMKV({ id: EStorageId.PLANNER_SETS });
    const router = useRouter();

    const setPlannerSetKey = useSetAtom(plannerSetKeyAtom);

    const [plannerSet] = useMMKVObject<TPlannerSet>(plannerSetKey, storage);

    const {
        control,
        handleSubmit: onSubmit,
        reset,
        formState: { isValid }
    } = useForm<TPendingPlannerSet>({
        defaultValues: {
            ...emptyFormData,
            ...plannerSet,
            start: plannerSet?.startDatestamp ?? todayDate,
            end: plannerSet?.endDatestamp ?? todayDate
        },
        mode: 'onChange'
    });

    const isEditMode = plannerSetKey !== NULL;

    const formFields: TFormField[][] = [
        [{
            name: 'title',
            label: 'Title',
            type: EFormFieldType.TEXT,
            focusTrigger: !isEditMode,
            autoCapitalizeWords: true,
            rules: {
                required: 'Title is required.',
                validate: (value: string) => value.trim() !== ''
            }
        }],
        [{
            name: 'start',
            label: 'Start',
            type: EFormFieldType.DATE
        },
        {
            name: 'end',
            label: 'End',
            type: EFormFieldType.DATE
        }]
    ];

    // Populate the form in edit mode
    useEffect(() => {
        reset({
            ...emptyFormData,
            ...plannerSet,
            start: plannerSet?.startDatestamp ?? todayDate,
            end: plannerSet?.endDatestamp ?? todayDate
        });
    }, [plannerSet, reset]);

    // ================
    //  Event Handlers
    // ================

    function handleSubmit(data: TPendingPlannerSet) {
        const { start, end, title } = data;
        const newTitle = title.trim();

        upsertPlannerSet({
            title: newTitle,
            startDatestamp: start.toISODate()!,
            endDatestamp: end.toISODate()!
        });

        setPlannerSetKey(newTitle);
        router.back();
    }

    function handleDelete() {
        if (plannerSet) {
            deletePlannerSet(plannerSet);
            setPlannerSetKey('Next 7 Days');
        }

        router.back();
    }

    // ================
    //  User Interface
    // ================

    return (
        <Modal
            title={isEditMode ? 'Edit Planner Set' : 'Create Planner Set'}
            primaryButtonConfig={{
                label: 'Save',
                onClick: onSubmit(handleSubmit),
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
                fieldSets={formFields}
                control={control}
            />
        </Modal>
    )
};

export default PlannerSetModal;