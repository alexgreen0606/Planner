import GenericIcon, { GenericIconProps } from '@/components/icon';
import { TOOLBAR_HEIGHT } from '@/lib/constants/miscLayout';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { InputAccessoryView, PlatformColor, StyleSheet, TouchableOpacity, View } from 'react-native';

// ✅ 

type TListToolbarProps<T extends TListItem> = {
    item: T;
    iconSets: IToolbarIconConfig<T>[][];
    accessoryKey?: string;
};

export interface IToolbarIconConfig<T extends TListItem> extends GenericIconProps<T> {
    customIcon?: React.ReactNode;
}

const ListToolbar = <T extends TListItem>({
    item,
    iconSets,
    accessoryKey
}: TListToolbarProps<T>) =>
    <InputAccessoryView nativeID={accessoryKey}>
        <View
            className='gap-4 w-screen flex-row justify-evenly'
            style={{
                height: TOOLBAR_HEIGHT,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderColor: PlatformColor('systemGray2'),
                backgroundColor: PlatformColor('systemGray6')
            }}>
            {iconSets.map((iconSet, setIndex) => (
                <View
                    key={`toolbar-icon-set-${setIndex}`}
                    className='flex-row gap-2 items-center'
                >
                    {iconSet.map((iconConfig, iconIndex) => iconConfig.customIcon ? (
                        <TouchableOpacity
                            key={`${setIndex}-toolbar-set-${iconConfig.type}-${iconIndex}`}
                            onPress={() => iconConfig.onClick?.(item)}
                        >
                            {iconConfig.customIcon}
                        </TouchableOpacity>
                    ) : (
                        <GenericIcon
                            key={`toolbar-icon-set-${setIndex}-icon-${iconIndex}`}
                            platformColor={iconConfig.platformColor || 'label'}
                            {...iconConfig}
                            size='l'
                            onClick={() => iconConfig.onClick?.(item)}
                        />
                    ))}
                </View>
            ))}
        </View>
    </InputAccessoryView>;

export default ListToolbar;