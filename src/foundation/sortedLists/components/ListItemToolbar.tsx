import { View, StyleSheet, PlatformColor, Dimensions } from 'react-native';
import globalStyles from '../../theme/globalStyles';
import GenericIcon, { GenericIconProps } from '../../components/GenericIcon';
import { ListItem, ListItemUpdateComponentProps } from '../types';
import { LIST_ITEM_TOOLBAR_HEIGHT } from '../constants';

export interface ToolbarProps<T extends ListItem> extends ListItemUpdateComponentProps<T> {
    iconSets: GenericIconProps<T>[][];
    open: boolean;
};

const Toolbar = <T extends ListItem>({
    item,
    iconSets,
    // formatItemAndSave: saveItemToList,
    open
}: ToolbarProps<T>) => open &&
    <View style={styles.toolbar}>
        {iconSets.map((iconSet, setIndex) => (
            <View key={`icon-set-${setIndex}`} style={globalStyles.verticallyCentered}>
                {iconSet.map((iconConfig, iconIndex) => (
                    <GenericIcon
                        key={`${item.value}-${setIndex}-toolbar-set-${iconConfig.type}-${iconIndex}`}
                        platformColor={iconConfig.platformColor || 'label'}
                        {...iconConfig}
                        size='l'
                        onClick={() => iconConfig.onClick?.()}
                    />
                ))}
            </View>
        ))}
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