import { View } from "react-native";
import GenericIcon from "../";

// ✅ 

type TTransferFolderIconProps = {
    disabled: boolean;
};

const TransferFolderIcon = ({ disabled }: TTransferFolderIconProps) => (
    <View className='relative scale-[0.8]'>
        <GenericIcon
            type='transfer'
            size='m'
            hideRipple
            className='-left-2'
            platformColor={disabled ? 'tertiaryLabel' : 'label'}
        />
        <GenericIcon
            type='folderThin'
            size='xs'
            hideRipple
            className='-bottom-2 right-0 absolute'
            platformColor={disabled ? 'tertiaryLabel' : 'label'}
        />
        <GenericIcon
            type='folder'
            size='s'
            hideRipple
            className='-top-1 -right-3 absolute'
            platformColor={disabled ? 'tertiaryLabel' : 'label'}
        />
    </View>
);

export default TransferFolderIcon;