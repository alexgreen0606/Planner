import { TouchableOpacity, View } from 'react-native';

import { PRESSABLE_OPACITY } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';

import Icon from '../Icon';

interface IToggleFolderItemTypeButtonProps {
  currentType: EFolderItemType;
  disabled: boolean;
  onClick: () => void;
}

const ToggleFolderItemTypeButton = ({
  currentType,
  disabled,
  onClick
}: IToggleFolderItemTypeButtonProps) => (
  <TouchableOpacity
    disabled={disabled}
    activeOpacity={PRESSABLE_OPACITY}
    onPress={onClick}
    className="gap-[0.1rem] items-center"
  >
    <View className="flex-row gap-[0.1rem] items-center">
      <Icon
        name="folder.fill"
        size={15}
        color={
          disabled
            ? 'tertiaryLabel'
            : currentType === EFolderItemType.FOLDER
              ? 'label'
              : 'tertiaryLabel'
        }
      />
      <Icon name="arrow.turn.right.down" size={12} color="tertiaryLabel" />
    </View>
    <View className="flex-row gap-[0.1rem] items-center">
      <Icon name="arrow.turn.left.up" size={12} color="tertiaryLabel" />
      <Icon
        name="list.bullet"
        size={15}
        color={
          disabled
            ? 'tertiaryLabel'
            : currentType === EFolderItemType.FOLDER
              ? 'tertiaryLabel'
              : 'label'
        }
      />
    </View>
  </TouchableOpacity>
);

export default ToggleFolderItemTypeButton;
