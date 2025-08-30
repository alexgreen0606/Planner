import { View } from "react-native";
import GenericIcon from ".";

// ✅ 

const TransferFolderIcon = () =>
    <View className='relative'>
        <GenericIcon
            type='transfer'
            size='m'
            hideRipple
            className='-left-2'
            platformColor='label'
        />
        <GenericIcon
            type='folder'
            size='xs'
            hideRipple
            className='-bottom-2 right-0 absolute'
            platformColor='secondaryLabel'
        />
        <GenericIcon
            type='folder'
            size='s'
            hideRipple
            className='-top-1 -right-3 absolute'
            platformColor='label'
        />
    </View>;

export default TransferFolderIcon;