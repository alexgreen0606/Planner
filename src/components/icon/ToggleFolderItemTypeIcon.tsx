import { EFolderItemType } from "@/lib/enums/EFolderItemType";
import { View } from "react-native";
import GenericIcon from ".";

// ✅ 

type TToggleFolderItemTypeIconProps = {
    currentType: EFolderItemType;
};

const ToggleFolderItemTypeIcon = ({ currentType }: TToggleFolderItemTypeIconProps) =>
    <View className='gap-1'>
        <View className='flex-row gap-1'>
            <GenericIcon
                type='folder'
                size='s'
                hideRipple
                platformColor={currentType === EFolderItemType.FOLDER ? 'label' : 'tertiaryLabel'}
            />
            <GenericIcon
                type='turnDown'
                size='ms'
                hideRipple
                platformColor='tertiaryLabel'
            />
        </View>
        <View className='flex-row gap-1'>
            <GenericIcon
                type='turnUp'
                size='ms'
                hideRipple
                className='mb-1'
                platformColor='tertiaryLabel'
            />
            <GenericIcon
                type='list'
                size='s'
                hideRipple
                platformColor={currentType === EFolderItemType.FOLDER ? 'tertiaryLabel' : 'label'}
            />

        </View>
    </View>;

export default ToggleFolderItemTypeIcon;