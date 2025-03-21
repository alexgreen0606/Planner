import React from 'react';
import { View, StyleSheet, PlatformColor, Dimensions } from 'react-native';
import globalStyles from '../../../foundation/theme/globalStyles';
import { FolderItem } from '../../checklists/types';
import GenericIcon, { GenericIconProps } from '../../../foundation/components/GenericIcon';
import ThinLine from '../../../foundation/components/ThinLine';
import { ListItemUpdateComponentProps } from '../../../foundation/sortedLists/types';
import { selectableColors } from '../../../foundation/theme/colors';
import { LIST_ITEM_TOOLBAR_HEIGHT } from '../../../foundation/sortedLists/constants';

export interface ToolbarProps extends ListItemUpdateComponentProps<FolderItem> {
    iconRows: GenericIconProps<FolderItem>[][];
    open: boolean;
};

const Toolbar = ({
    item,
    iconRows: iconRows,
    onSave,
    open
}: ToolbarProps) => open &&
    <View style={styles.toolbar}>

        {/* First Icon Set */}
        <View style={globalStyles.verticallyCentered}>
            {iconRows[0]?.map(iconConfig =>
                <GenericIcon
                    key={`${item.value}-0-toolbar-set-${iconConfig.type}`}
                    platformColor='label'
                    {...iconConfig}
                    size='l'
                    onClick={() => iconConfig.onClick && onSave(iconConfig.onClick())}
                />
            )}
        </View>

        {/* Colors Set*/}
        <View style={globalStyles.verticallyCentered}>
            {Object.values(selectableColors).map(color =>
                <GenericIcon
                    key={color}
                    size='l'
                    onClick={() => onSave({ ...item, platformColor: color })}
                    type={item.platformColor === color ? 'circleFilled' : 'circle'}
                    platformColor={color}
                />
            )}
        </View>

        {/* Second Icon Set */}
        {iconRows.length > 1 &&
            <View style={globalStyles.verticallyCentered}>
                {iconRows[1].map(iconConfig =>
                    <GenericIcon
                        key={`${item.value}-1-toolbar-set-${iconConfig.type}`}
                        platformColor='label'
                        {...iconConfig}
                        size='l'
                        onClick={() => iconConfig.onClick && onSave(iconConfig.onClick())}
                    />
                )}
            </View>
        }
    </View>

const styles = StyleSheet.create({
    toolbar: {
        backgroundColor: PlatformColor('systemGray6'),
        padding: 12,
        height: LIST_ITEM_TOOLBAR_HEIGHT,
        width: Dimensions.get('window').width,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        gap: 16
    },
});

export default Toolbar;