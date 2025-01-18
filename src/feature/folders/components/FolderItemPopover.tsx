import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import globalStyles from '../../../foundation/theme/globalStyles';
import GenericIcon, { GenericIconProps } from '../../../foundation/components/icons/GenericIcon';
import colors from '../../../foundation/theme/colors';
import ThinLine from '../../../foundation/components/separators/ThinLine';
import { FolderItem, selectableColors } from '../utils';

interface PopoverProps {
    item: FolderItem;
    icons: IconConfig[][];
    saveNewColor: (color: string) => void;
}

export interface IconConfig {
    onClick: () => void;
    icon: GenericIconProps;
}

const Popover = ({
    item,
    icons,
    saveNewColor
}: PopoverProps) => {

    const styles = StyleSheet.create({
        popup: {
            ...globalStyles.background,
            padding: 12,
            alignSelf: 'flex-start',
            alignItems: 'flex-start'
        },
        popoverRow: {
            flexDirection: 'row',
            gap: 16
        }
    });

    return (
        <View style={styles.popup}>
            {icons.map((iconRow, i) =>
                <View key={`${item.value}-${i}-popover-row`} style={{ alignSelf: 'stretch' }}>
                    <View style={styles.popoverRow}>
                        {iconRow.map(iconConfig =>
                            <TouchableOpacity key={iconConfig.icon.type} onPress={iconConfig.onClick}>
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
                    <TouchableOpacity key={color} onPress={() => saveNewColor(color)}>
                        <GenericIcon
                            type={item.color === color ? 'circle-filled' : 'circle'}
                            size={20}
                            color={colors[color as keyof typeof colors]}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default Popover;
