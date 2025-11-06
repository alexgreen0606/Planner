import { TouchableOpacity, View } from 'react-native';

import Icon from '../Icon';

// ✅

type TTransferFolderIconProps = {
  disabled: boolean;
  onClick: () => void;
};

const TransferFolderIcon = ({ disabled, onClick }: TTransferFolderIconProps) => (
  <TouchableOpacity activeOpacity={0.5} onPress={onClick} disabled={disabled} className="relative">
    <View className="-left-2 -top-1">
      <Icon name="arrow.uturn.right" size={16} disabled={disabled} color="label" />
    </View>
    <View className="-bottom-1 right-0 absolute">
      <Icon name="folder" size={12} disabled={disabled} color="label" />
    </View>
    <View className="-top-2 -right-3 absolute">
      <Icon name="folder.fill" size={16} disabled={disabled} color="label" />
    </View>
  </TouchableOpacity>
);

export default TransferFolderIcon;
