import React from 'react';
import { ListItemUpdateComponentProps } from '../../../../foundation/sortedLists/utils';
import { FolderItem, FolderItemType } from '../../utils';
import Modal from '../../../../foundation/components/modal/Modal';
import CustomText from '../../../../foundation/components/text/CustomText';
import { Color } from '../../../../foundation/theme/colors';

export interface DeleteModalProps extends ListItemUpdateComponentProps<FolderItem> {
    open: boolean;
    toggleModalOpen: () => void;
}

const DeleteModal = ({
    item,
    onSave,
    open,
    toggleModalOpen
}: DeleteModalProps) => {
    const getItemType = (item: FolderItem) => item.type === FolderItemType.FOLDER ? 'folder' : 'list';

    return (
        <Modal
            title={`${!!item.childrenCount ? 'Force delete' : 'Delete'} ${getItemType(item)}?`}
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
            {!!item.childrenCount ? (
                <CustomText type='standard'>
                    This {getItemType(item)} has {item.childrenCount} items. Deleting is irreversible and will lose all inner contents.
                </CustomText>
            ) : (
                <CustomText type='standard'>
                    Would you like to delete this {getItemType(item)}?
                </CustomText>
            )}
        </Modal>
    );
};

export default DeleteModal;
