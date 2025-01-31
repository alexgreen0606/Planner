import React from 'react';
import { View, StyleSheet } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../../../foundation/components/icon/GenericIcon';
import ThinLine from '../../../../foundation/components/separator/ThinLine';
import { FolderItem } from '../../utils';
import { ListItemUpdateComponentProps } from '../../../../foundation/sortedLists/utils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import { Color, SelectableColor } from '../../../../foundation/theme/colors';

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
                    type={item.color === color ? 'circle-filled' : 'circle'}
                    size={20}
                    color={color}
                />
            )}
        </View>
    </View>

const styles = StyleSheet.create({
    popup: {
        backgroundColor: Color.BACKGROUND,
        padding: 12,
    },
});

export default Popover;
