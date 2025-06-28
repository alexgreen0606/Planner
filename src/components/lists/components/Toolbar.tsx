import GenericIcon, { GenericIconProps } from '@/components/icon';
import { TOOLBAR_HEIGHT } from '@/lib/constants/layout';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { InputAccessoryView, PlatformColor, StyleSheet, TouchableOpacity, View } from 'react-native';

export interface ToolbarIcon<T extends IListItem> extends GenericIconProps<T> {
    customIcon?: React.ReactNode;
}

export interface ToolbarProps<T extends IListItem> {
    iconSets: ToolbarIcon<T>[][];
    accessoryKey?: string;
}

const Toolbar = <T extends IListItem>({
    iconSets,
    accessoryKey
}: ToolbarProps<T>) => {
    return (
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
                                onPress={() => iconConfig.onClick?.()}
                            >
                                {iconConfig.customIcon}
                            </TouchableOpacity>
                        ) : (
                            <GenericIcon
                                key={`toolbar-icon-set-${setIndex}-icon-${iconIndex}`}
                                platformColor={iconConfig.platformColor || 'label'}
                                {...iconConfig}
                                size='l'
                                onClick={() => iconConfig.onClick?.()}
                            />
                        ))}
                    </View>
                ))}
            </View>
        </InputAccessoryView>
    )
}

export default Toolbar;