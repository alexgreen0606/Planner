import React from 'react';
import { FolderItem, FolderItemTypes } from '../../checklists/types';
import Modal from '../../../foundation/components/Modal';
import CustomText from '../../../foundation/components/text/CustomText';
import { ListItemUpdateComponentProps } from '../../../foundation/sortedLists/types';
import { PlatformColor } from 'react-native';

export interface DeleteModalProps extends ListItemUpdateComponentProps<FolderItem> {
    open: boolean;
    parentFolderName: string;
    onSave: (item: FolderItem) => void;
    toggleModalOpen: () => void;
}

const DeleteModal = ({
    item,
    open,
    onSave,
    toggleModalOpen,
    parentFolderName
}: DeleteModalProps) => {
    const itemType = item.type === FolderItemTypes.FOLDER ? 'folder' : 'list';

    return (
        <Modal
            title={`${!!item.childrenCount ? 'Force delete' : 'Delete'} ${itemType}?`}
            open={open}
            toggleModalOpen={toggleModalOpen}
            primaryButtonConfig={{
                label: !!item.childrenCount ? 'Force Delete' : 'Delete',
                onClick: () => onSave(item),
                platformColor: !!item.childrenCount ? 'systemRed' : 'systemTeal'
            }}
            iconConfig={{
                type: 'trash',
                platformColor: 'systemRed'
            }}
        >

            {/* Item Details */}
            <CustomText type='standard'>
                {item.value}
            </CustomText>
            <CustomText type='soft' style={{ marginBottom: 16 }}>
                from {parentFolderName}
            </CustomText>

            {/* Warning Message */}
            {!!item.childrenCount ? (
                <CustomText type='standard' style={{ color: PlatformColor('secondaryLabel') }}>
                    This {itemType} has {item.childrenCount} items. Deleting is irreversible and will lose all inner contents.
                </CustomText>
            ) : (
                <CustomText type='standard' style={{ color: PlatformColor('secondaryLabel') }}>
                    Would you like to delete this {itemType}?
                </CustomText>
            )}
        </Modal>
    );
};

export default DeleteModal;
