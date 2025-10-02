import Form from '@/components/form';
import Modal from '@/components/Modal';
import { NULL } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EFormFieldType } from '@/lib/enums/EFormFieldType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TFormField } from '@/lib/types/form/TFormField';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { deleteFolderItemAndChildren } from '@/utils/checklistUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

// ✅ 

type TPendingFolderItem = {
    title: string;
    type: string;
    color: string;
};

const emptyFormData: TPendingFolderItem = {
    title: '',
    type: 'Folder',
    color: 'systemBrown'
};

// Map enum values to display strings
const folderTypeOptions = ['Folder', 'Checklist'];

// Helper functions to convert between display strings and enum values
const typeToDisplay = (type: EFolderItemType): string => {
    return type === EFolderItemType.FOLDER ? 'Folder' : 'Checklist';
};

const displayToType = (display: string): EFolderItemType => {
    return display === 'Folder' ? EFolderItemType.FOLDER : EFolderItemType.CHECKLIST;
};

const FolderItemModal = () => {
    const { folderItemId } = useLocalSearchParams<{ folderItemId: string }>();
    const itemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const router = useRouter();

    const [folderItem, setFolderItem] = useMMKVObject<IFolderItem>(folderItemId, itemStorage);

    const {
        control,
        handleSubmit: onSubmit,
        formState: { isValid }
    } = useForm<TPendingFolderItem>({
        defaultValues: {
            ...emptyFormData,
            title: folderItem?.value ?? '',
            type: folderItem ? typeToDisplay(folderItem.type) : 'Folder',
            color: folderItem?.platformColor ?? 'systemBrown'
        },
        mode: 'onChange'
    });

    const isEditMode = folderItemId !== NULL;
    const hasChildren = (folderItem?.itemIds.length ?? 0) > 0;

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
            name: 'color',
            label: 'Color',
            type: EFormFieldType.COLOR_PICKER,
            floating: true,
        }],
        [{
            name: 'type',
            type: EFormFieldType.PICKER,
            options: folderTypeOptions,
            floating: true,
            invisible: hasChildren,
            width: 200
        }],
    ];

    // ================
    //  Event Handlers
    // ================

    function handleSubmit(data: TPendingFolderItem) {
        if (!folderItem) return;

        const { title, type } = data;
        const newTitle = title.trim();
        const folderItemType = displayToType(type);

        setFolderItem((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                value: newTitle,
                type: folderItemType
            };
        });

        router.back();
    }

    function handleDelete() {
        if (!folderItem) return;

        deleteFolderItemAndChildren(folderItem, true);
        router.back();
    }

    // ================
    //  User Interface
    // ================

    return (
        <Modal
            title=''
            primaryButtonConfig={{
                onClick: onSubmit(handleSubmit),
                disabled: !isValid
            }}
            deleteButtonConfig={{
                label: `Delete ${folderItem?.type ?? 'Item'}`,
                hidden: !isEditMode,
                optionLabels: [hasChildren ? 'Force Delete' : 'Delete'],
                optionHandlers: [handleDelete],
                message: hasChildren ? 'All inner contents will be lost.' : undefined
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

export default FolderItemModal;