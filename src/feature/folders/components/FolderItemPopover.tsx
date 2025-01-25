import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import globalStyles from '../../../foundation/theme/globalStyles';
import GenericIcon, { GenericIconProps } from '../../../foundation/components/icons/GenericIcon';
import colors from '../../../foundation/theme/colors';
import ThinLine from '../../../foundation/components/separators/ThinLine';
import { FolderItem, selectableColors } from '../utils';
import { ListItemUpdateComponentProps } from '../../../foundation/sortedLists/utils';
import { Portal } from 'react-native-paper';

export interface IconConfig {
    onClick: (item: FolderItem) => FolderItem; // return the updated item
    icon: GenericIconProps;
}

export interface PopoverProps extends ListItemUpdateComponentProps<FolderItem> {
    icons: IconConfig[][];
    open: boolean;
}

const Popover = ({
    item,
    icons,
    open,
    onSave,
}: PopoverProps) => open &&
    <View style={styles.popup}>
        {icons.map((iconRow, i) =>
            <View key={`${item.value}-${i}-popover-row`} style={{ alignSelf: 'stretch' }}>
                <View style={styles.popoverRow}>
                    {iconRow.map(iconConfig =>
                        <TouchableOpacity key={iconConfig.icon.type} onPress={() => onSave(iconConfig.onClick(item))}>
                            <GenericIcon
                                {...iconConfig.icon}
                            />
                        </TouchableOpacity>
                    )}
                </View>
                <ThinLine style={{ alignSelf: 'stretch', width: undefined, marginVertical: 8 }} />
            </View>
        )}
        <View style={styles.popoverRow}>
            {selectableColors.map(color =>
                <TouchableOpacity key={color} onPress={() => onSave({ ...item, color })}>
                    <GenericIcon
                        type={item.color === color ? 'circle-filled' : 'circle'}
                        size={20}
                        color={colors[color as keyof typeof colors]}
                    />
                </TouchableOpacity>
            )}
        </View>
    </View>

const styles = StyleSheet.create({
    popup: {
        ...globalStyles.blackFilledSpace,
        flex: undefined,
        padding: 12,
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
        position: 'absolute',
        top: '50%',
        left: '50%'
    },
    popoverRow: {
        flexDirection: 'row',
        gap: 16
    }
});

export default Popover;
