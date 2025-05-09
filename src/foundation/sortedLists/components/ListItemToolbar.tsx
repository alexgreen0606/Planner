import { View, StyleSheet, PlatformColor, Dimensions, TouchableOpacity } from 'react-native';
import globalStyles from '../../../theme/globalStyles';
import GenericIcon, { GenericIconProps } from '../../components/GenericIcon';
import { ListItem, ListItemUpdateComponentProps } from '../types';
import { LIST_ITEM_TOOLBAR_HEIGHT } from '../constants';

interface IconSet<T extends ListItem> extends GenericIconProps<T> {
    customIcon?: React.ReactNode;
}

export interface ToolbarProps<T extends ListItem> extends ListItemUpdateComponentProps<T> {
    iconSets: IconSet<T>[][];
    open: boolean;
};

const Toolbar = <T extends ListItem>({
    item,
    iconSets,
    open,
}: ToolbarProps<T>) => open &&
    <View style={styles.toolbar}>
        {iconSets.map((iconSet, setIndex) => (
            <View key={`${item.value}-${setIndex}-toolbar-set-${open}-${item.id}`} style={globalStyles.verticallyCentered}>
                {iconSet.map((iconConfig, iconIndex) => iconConfig.customIcon ? (
                    <TouchableOpacity key={`${item.value}-${setIndex}-toolbar-set-${iconConfig.type}-${iconIndex}`} onPress={() => iconConfig.onClick?.()}>
                        {iconConfig.customIcon}
                    </TouchableOpacity>
                ) : (
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