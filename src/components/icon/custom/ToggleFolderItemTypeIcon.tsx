import { EFolderItemType } from "@/lib/enums/EFolderItemType";
import { View } from "react-native";
import GenericIcon from "../";

// ✅ 

type TToggleFolderItemTypeIconProps = {
    currentType: EFolderItemType;
    disabled: boolean;
};

const ToggleFolderItemTypeIcon = ({ currentType, disabled }: TToggleFolderItemTypeIconProps) => (
    <View className='gap-1 scale-[0.8]'>
        <View className='flex-row gap-1'>
            <GenericIcon
                type='folder'
                size='s'
                hideRipple
                platformColor={disabled ? 'tertiaryLabel' : currentType === EFolderItemType.FOLDER ? 'label' : 'tertiaryLabel'}
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
                type='checklist'
                size='s'
                hideRipple
                platformColor={disabled ? 'tertiaryLabel' : currentType === EFolderItemType.FOLDER ? 'tertiaryLabel' : 'label'}
            />

        </View>
    </View>
);

export default ToggleFolderItemTypeIcon;