import React from 'react';
import { FolderItem, FolderItemTypes } from '../../checklists/types';
import Modal from '../../../foundation/components/Modal';
import { Palette } from '../../../foundation/theme/colors';
import CustomText from '../../../foundation/components/text/CustomText';
import { ListItemUpdateComponentProps } from '../../../foundation/sortedLists/types';

export interface DeleteModalProps extends ListItemUpdateComponentProps<FolderItem> {
    open: boolean;
    toggleModalOpen: () => void;
    parentFolderName: string;
}

const DeleteModal = ({
    item,
    onSave,
    open,
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
                color: !!item.childrenCount ? 'red' : Palette.BLUE
            }}
            iconConfig={{
                type: 'trash',
                color: 'red'
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
                <CustomText type='standard' style={{ color: Palette.GREY }}>
                    This {itemType} has {item.childrenCount} items. Deleting is irreversible and will lose all inner contents.
                </CustomText>
            ) : (
                <CustomText type='standard' style={{ color: Palette.GREY }}>
                    Would you like to delete this {itemType}?
                </CustomText>
            )}
        </Modal>
    );
};

export default DeleteModal;
