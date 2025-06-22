import GenericIcon, { GenericIconProps } from '@/components/icon';
import { TOOLBAR_HEIGHT } from '@/lib/constants/layout';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { PlatformColor, StyleSheet, TouchableOpacity, View } from 'react-native';

interface IconSet<T extends IListItem> extends GenericIconProps<T> {
    customIcon?: React.ReactNode;
}

export interface ToolbarProps<T extends IListItem> {
    item: T;
    iconSets: IconSet<T>[][];
    open: boolean;
}

const Toolbar = <T extends IListItem>({
    item,
    iconSets,
    open,
}: ToolbarProps<T>) => open &&
    <View
        className='gap-4 w-screen flex-row justify-evenly'
        style={{
            height: TOOLBAR_HEIGHT,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: PlatformColor('systemGray2'),
            backgroundColor: PlatformColor('systemGray6')
        }}
    >
        {iconSets.map((iconSet, setIndex) => (
            <View
                key={`${item.value}-${setIndex}-toolbar-set-${open}-${item.id}`}
                className='flex-row gap-2 items-center'
            >
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

export default Toolbar;