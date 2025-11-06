import { uuid } from 'expo-modules-core';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

import Form from '@/components/Form/Form';
import Modal from '@/components/Modal';
import { NULL } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EFormFieldType } from '@/lib/enums/EFormFieldType';
import { EPopupActionType } from '@/lib/enums/EPopupActionType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TFormField } from '@/lib/types/form/TFormField';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { TFolderItemModalParams } from '@/lib/types/routeParams/TFolderItemModalParams';
import { TPopupAction } from '@/lib/types/TPopupAction';
import { getFolderItemFromStorageById, saveFolderItemToStorage } from '@/storage/checklistsStorage';
import { deleteFolderItemAndChildren } from '@/utils/checklistUtils';

type TFormData = {
  title: string;
  type: EFolderItemType;
  color: string;
};

const FolderItemModal = () => {
  const { folderItemId, parentFolderId } = useLocalSearchParams<TFolderItemModalParams>();
  const itemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
  const router = useRouter();

  const [folderItem, setFolderItem] = useMMKVObject<IFolderItem>(folderItemId, itemStorage);
  const {
    control,
    handleSubmit: onSubmit,
    formState: { isValid },
    watch
  } = useForm<TFormData>({
    defaultValues: {
      title: folderItem?.value ?? '',
      type: folderItem?.type ?? EFolderItemType.FOLDER,
      color: folderItem?.platformColor ?? 'systemBrown'
    },
    mode: 'onChange'
  });

  const type = watch('type');
  const color = watch('color');

  const hasChildren = (folderItem?.itemIds.length ?? 0) > 0;
  // TODO: enhance these. Need scatter delete and delete all
  const deleteActions = useMemo<TPopupAction[]>(
    () => [
      {
        type: EPopupActionType.BUTTON,
        title: hasChildren ? 'Force Delete' : 'Delete',
        systemImage: 'trash',
        destructive: true,
        onPress: handleDelete
      }
    ],
    [hasChildren, folderItem]
  );

  const isEditMode = folderItemId !== NULL;
  const formFields: TFormField[][] = [
    [
      {
        name: 'title',
        label: 'Title',
        type: EFormFieldType.TEXT,
        focusTrigger: !isEditMode,
        autoCapitalizeWords: true,
        iconName: type === EFolderItemType.FOLDER ? 'folder' : 'list.bullet',
        iconColor: color,
        rules: {
          required: 'Title is required.',
          validate: (value: string) => value.trim() !== ''
        }
      }
    ],
    [
      {
        name: 'color',
        label: 'Color',
        type: EFormFieldType.COLOR_PICKER,
        floating: true
      }
    ],
    [
      {
        name: 'type',
        type: EFormFieldType.PICKER,
        options: [
          {
            label: 'Folder',
            value: EFolderItemType.FOLDER
          },
          {
            label: 'Checklist',
            value: EFolderItemType.CHECKLIST
          }
        ],
        floating: true,
        invisible: hasChildren,
        width: 300
      }
    ]
  ];

  // Determine if we're in create or edit mode
  const isCreateMode = folderItemId === NULL;

  // Generate a new ID for create mode
  const [newItemId] = useState(() => isCreateMode ? uuid.v4() : folderItemId);


  // ================
  //  Event Handlers
  // ================

  // function handleSubmit(data: TFormData) {
  //   if (!folderItem) return;

  //   const { title, type, color } = data;
  //   const newTitle = title.trim();

  //   setFolderItem((prev) =>
  //     prev
  //       ? {
  //           ...prev,
  //           value: newTitle,
  //           type,
  //           platformColor: color
  //         }
  //       : prev
  //   );

  //   router.back();
  // }

  function handleSubmit(data: TFormData) {
    const { title, type, color } = data;
    const newTitle = title.trim();

    if (isCreateMode) {
      // Create mode: Create a new folder item and add it to parent
      createNewFolderItem(newTitle, type, color);
    } else {
      // Edit mode: Update existing folder item
      if (!folderItem) return;

      setFolderItem((prev) =>
        prev
          ? {
            ...prev,
            value: newTitle,
            type,
            platformColor: color
          }
          : prev
      );
    }

    router.back();
  }

  function createNewFolderItem(title: string, type: EFolderItemType, color: string) {
    if (!parentFolderId || parentFolderId === NULL) {
      console.error('Parent folder ID is required for creating new items');
      return;
    }

    // Create the new folder item
    const newFolderItem: IFolderItem = {
      id: newItemId,
      value: title,
      listId: parentFolderId,
      storageId: EStorageId.FOLDER_ITEM,
      platformColor: color,
      type,
      itemIds: []
    };

    // Save the new item to storage
    saveFolderItemToStorage(newFolderItem);

    // Update the parent folder to include this new item at the bottom
    const parentFolder = getFolderItemFromStorageById(parentFolderId);
    if (parentFolder) {
      parentFolder.itemIds.push(newItemId); // Append to bottom
      saveFolderItemToStorage(parentFolder);
    }
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
      primaryButtonConfig={{
        onClick: onSubmit(handleSubmit),
        disabled: !isValid,
        color
      }}
      deleteButtonConfig={{ actions: deleteActions }}
      onClose={() => router.back()}
    >
      <Form fieldSets={formFields} control={control} />
    </Modal>
  );
};

export default FolderItemModal;
