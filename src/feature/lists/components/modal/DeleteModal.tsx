import React from 'react';
import { ListItemUpdateComponentProps } from '../../../../foundation/sortedLists/utils';
import { FolderItem, FolderItemType } from '../../utils';
import Modal from '../../../../foundation/components/modal/Modal';
import CustomText from '../../../../foundation/components/text/CustomText';
import { Color } from '../../../../foundation/theme/colors';

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
    const itemType = item.type === FolderItemType.FOLDER ? 'folder' : 'list';

    return (
        <Modal
            title={`${!!item.childrenCount ? 'Force delete' : 'Delete'} ${itemType}?`}
            open={open}
            toggleModalOpen={toggleModalOpen}
            primaryButtonConfig={{
                label: !!item.childrenCount ? 'Force Delete' : 'Delete',
                onClick: () => onSave(item),
                color: !!item.childrenCount ? 'red' : Color.BLUE
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
                <CustomText type='standard' style={{ color: Color.GREY }}>
                    This {itemType} has {item.childrenCount} items. Deleting is irreversible and will lose all inner contents.
                </CustomText>
            ) : (
                <CustomText type='standard' style={{ color: Color.GREY }}>
                    Would you like to delete this {itemType}?
                </CustomText>
            )}
        </Modal>
    );
};

export default DeleteModal;
