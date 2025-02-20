import React from 'react';
import { View, StyleSheet } from 'react-native';
import globalStyles from '../../../foundation/theme/globalStyles';
import { Palette, SelectableColor } from '../../../foundation/theme/colors';
import { FolderItem } from '../../checklists/types';
import GenericIcon, { GenericIconProps } from '../../../foundation/components/GenericIcon';
import ThinLine from '../../../foundation/components/ThinLine';
import { ListItemUpdateComponentProps } from '../../../foundation/sortedLists/types';

export interface PopoverProps extends ListItemUpdateComponentProps<FolderItem> {
    iconRows: GenericIconProps<FolderItem>[][];
    open: boolean;
};

const Popover = ({
    item,
    iconRows,
    open,
    onSave,
}: PopoverProps) => open &&
    <View style={styles.popup}>
        {iconRows.map((iconRow, i) =>
            <View key={`${item.value}-${i}-popover-row`}>
                <View style={globalStyles.verticallyCentered}>
                    {iconRow.map(iconConfig =>
                        <GenericIcon
                            key={`${item.value}-${i}-popover-row-${iconConfig.type}`}
                            {...iconConfig}
                            onClick={() => iconConfig.onClick && onSave(iconConfig.onClick())}
                        />
                    )}
                </View>
                <ThinLine />
            </View>
        )}
        <View style={globalStyles.verticallyCentered}>
            {Object.values(SelectableColor).map(color =>
                <GenericIcon
                    key={color}
                    onClick={() => onSave({ ...item, color })}
                    type={item.color === color ? 'circleFilled' : 'circle'}
                    color={color}
                />
            )}
        </View>
    </View>

const styles = StyleSheet.create({
    popup: {
        backgroundColor: Palette.BACKGROUND,
        padding: 12,
    },
});

export default Popover;
