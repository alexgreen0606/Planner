import React from 'react';
import colors from '../../../foundation/theme/colors';
import { FolderItem, FolderItemType } from '../utils';
import Modal from '../../../foundation/components/modal/Modal';
import CustomText from '../../../foundation/components/text/CustomText';
import { ItemStatus } from '../../../foundation/sortedLists/utils';

interface PopoverProps {
    item: FolderItem;
    deleteItem: () => void;
    toggleModalOpen: () => void;
}

const DeleteModal = ({
    item,
    deleteItem,
    toggleModalOpen
}: PopoverProps) => {
    const getItemType = (item: FolderItem) => item.type === FolderItemType.FOLDER ? 'folder' : 'list';

    return (
        <Modal
            title={`${!!item.childrenCount ? 'Force delete' : 'Delete'} ${getItemType(item)}?`}
            open={item.status === ItemStatus.DELETE}
            toggleModalOpen={toggleModalOpen}
            primaryButtonConfig={{
                label: !!item.childrenCount ? 'Force Delete' : 'Delete',
                onClick: deleteItem,
                color: !!item.childrenCount ? 'red' : colors.blue
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
