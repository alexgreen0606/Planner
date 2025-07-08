import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import Form from '@/components/form';
import Modal from '@/components/modal';
import { NULL } from '@/lib/constants/generic';
import { EFormFieldType } from '@/lib/enums/EFormFieldType';
import { IFormField } from '@/lib/types/form/IFormField';
import { TPlannerSet } from '@/lib/types/planner/TPlannerSet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { deletePlannerSet, getPlannerSetTitles, savePlannerSet } from '../../../src/storage/plannerSetsStorage';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { ETimeSelectorMode } from '@/components/form/fields/TimeRangeSelector';
import { EStorageId } from '@/lib/enums/EStorageId';

export const PLANNER_SET_MODAL_PATHNAME = '(modals)/plannerSetModal/';

type PendingPlannerSet = {
    title: string;
    dates: {
        startDatestamp: string,
        endDatestamp: string
    }
}

const emptyFormData: PendingPlannerSet = {
    title: '',
    dates: {
        startDatestamp: getTodayDatestamp(),
        endDatestamp: getTodayDatestamp()
    }
};

const PlannerSetModal = () => {
    const { plannerSetKey } = useLocalSearchParams<{ plannerSetKey: string }>();
    const existingPlannerTitles = getPlannerSetTitles();

    const router = useRouter();

    const setPlannerSetKey = useSetAtom(plannerSetKeyAtom);

    const storage = useMMKV({ id: EStorageId.PLANNER_SETS });
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
            ...plannerSet,
            dates: {
                startDatestamp: plannerSet?.startDatestamp ?? getTodayDatestamp(),
                endDatestamp: plannerSet?.endDatestamp ?? getTodayDatestamp()
            }
        },
        mode: 'onChange'
    });

    // Create form fields configuration
    const formFields: IFormField[][] = [
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            trigger: !isEditMode,
            autoCapitalizeWords: true,
            rules: {
                required: 'Title is required.',
                validate: (value: string) => value.trim() !== ''
            }
        }],
        [{
            name: 'dates',
            type: EFormFieldType.DATE_RANGE,
            trigger: ETimeSelectorMode.START_DATE
        }]
    ];

    // Populate the form in edit mode
    useEffect(() => {
        const defaultDatestamp = getTodayDatestamp();
        reset({
            ...emptyFormData,
            ...plannerSet,
            dates: {
                startDatestamp: plannerSet?.startDatestamp ?? defaultDatestamp,
                endDatestamp: plannerSet?.endDatestamp ?? defaultDatestamp
            }
        });
    }, [plannerSet, reset]);

    // ------------- Utility Functions -------------

    function onSubmit(data: PendingPlannerSet) {
        const { startDatestamp, endDatestamp } = data.dates;
        data.title = data.title.trim();
        savePlannerSet({
            title: data.title,
            startDatestamp,
            endDatestamp
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