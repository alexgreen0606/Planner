import React from 'react';
import { View, StyleSheet } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../../foundation/components/icons/GenericIcon';
import colors from '../../../foundation/theme/colors';
import ThinLine from '../../../foundation/components/separators/ThinLine';
import { FolderItem, selectableColors } from '../utils';
import { ListItemUpdateComponentProps } from '../../../foundation/sortedLists/utils';

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
            <View key={`${item.value}-${i}-popover-row`} style={styles.stretch}>
                <View style={styles.popoverRow}>
                    {iconRow.map(iconConfig =>
                        <GenericIcon
                            key={iconConfig.icon.type}
                            onClick={() => onSave(iconConfig.onClick(item))}
                            {...iconConfig.icon}
                        />
                    )}
                </View>
                <ThinLine/>
            </View>
        )}
        <View style={styles.popoverRow}>
            {selectableColors.map(color =>
                <GenericIcon
                    key={color}
                    onClick={() => onSave({ ...item, color })}
                    type={item.color === color ? 'circle-filled' : 'circle'}
                    size={20}
                    color={colors[color as keyof typeof colors]}
                />
            )}
        </View>
    </View>

const styles = StyleSheet.create({
    stretch: {
        alignSelf: 'stretch'
    },
    popup: {
        backgroundColor: colors.background,
        padding: 12,
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    popoverRow: {
        flexDirection: 'row',
        gap: 16
    }
});

export default Popover;
