import Form from '@/components/form';
import Modal from '@/components/Modal';
import { NULL } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EFormFieldType } from '@/lib/enums/EFormFieldType';
import { EPopupActionType } from '@/lib/enums/EPopupActionType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TFormField } from '@/lib/types/form/TFormField';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { TPopupAction } from '@/lib/types/TPopupAction';
import { deleteFolderItemAndChildren } from '@/utils/checklistUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

// ✅ 

type TFormData = {
    title: string;
    type: string;
    color: string;
};

const folderTypeBiMap: Record<string, string> = {
    [EFolderItemType.FOLDER]: "Folder",
    [EFolderItemType.CHECKLIST]: "Checklist",
    Folder: EFolderItemType.FOLDER,
    Checklist: EFolderItemType.CHECKLIST
} as const;

const FolderItemModal = () => {
    const { folderItemId } = useLocalSearchParams<{ folderItemId: string }>();
    const itemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const router = useRouter();

    const [folderItem, setFolderItem] = useMMKVObject<IFolderItem>(folderItemId, itemStorage);

    const {
        control,
        handleSubmit: onSubmit,
        formState: { isValid }
    } = useForm<TFormData>({
        defaultValues: {
            title: folderItem?.value ?? '',
            type: folderItem ? folderTypeBiMap[folderItem.type] ?? 'Folder' : 'Folder',
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
            options: ['Folder', 'Checklist'],
            floating: true,
            invisible: hasChildren,
            width: 300
        }],
    ];

    // ================
    //  Delete Actions
    // ================

    const deleteActions = useMemo<TPopupAction[]>(() => [
        {
            type: EPopupActionType.BUTTON,
            title: hasChildren ? 'Force Delete' : 'Delete',
            systemImage: 'trash',
            destructive: true,
            onPress: handleDelete
        }
    ], [hasChildren, folderItem]);

    // ================
    //  Event Handlers
    // ================

    function handleSubmit(data: TFormData) {
        if (!folderItem) return;

        const { title, type } = data;
        const newTitle = title.trim();
        const folderItemType = (folderTypeBiMap[type] ?? EFolderItemType.FOLDER) as EFolderItemType;

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
            deleteButtonConfig={{ actions: deleteActions }}
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