import useAppPlatformColors from '@/hooks/useAppPlatformColors';
import { TOOLBAR_HEIGHT } from '@/lib/constants/miscLayout';
import { ReactNode } from 'react';
import { InputAccessoryView, PlatformColor, StyleSheet, View } from 'react-native';

// ✅ 

type TListToolbarProps = {
    iconSet: ReactNode[][];
    accessoryKey: string;
};

const ListToolbar = ({ iconSet: icons, accessoryKey }: TListToolbarProps) => {
    const { toolbar: { background, border } } = useAppPlatformColors();
    return (
        <InputAccessoryView nativeID={accessoryKey}>
            <View
                className='gap-4 w-screen flex-row justify-evenly'
                style={{
                    height: TOOLBAR_HEIGHT,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderColor: PlatformColor(border),
                    backgroundColor: PlatformColor(background)
                }}>
                {icons.map((iconSet, setIndex) => (
                    <View
                        key={`toolbar-icon-set-${setIndex}`}
                        className='flex-row gap-1 items-center'
                    >
                        {iconSet.map((iconConfig, iconIndex) => (
                            <View
                                key={`${setIndex}-toolbar-set-${iconIndex}`}
                            >
                                {iconConfig}
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </InputAccessoryView>
    );
}

export default ListToolbar;