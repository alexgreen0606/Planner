import { Host, HStack } from '@expo/ui/swift-ui';
import { glassEffect } from '@expo/ui/swift-ui/modifiers';
import { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

import { TOOLBAR_HEIGHT } from '@/lib/constants/miscLayout';

interface IListToolbarProps {
  iconSet: ReactNode[][];
};

const ListToolbar = ({ iconSet }: IListToolbarProps) => {
  const { height: keyboardHeight } = useAnimatedKeyboard();

  const toolbarStyle = useAnimatedStyle(() => ({
    bottom: keyboardHeight.value + 8
  }));

  return (
    <Animated.View className="w-screen absolute px-4" style={toolbarStyle}>
      <Host>
        <HStack
          modifiers={[
            glassEffect({
              glass: {
                variant: 'regular'
              }
            })
          ]}
        >
          <View
            className="flex-row justify-evenly flex-1 gap-4 overflow-hidden"
            style={{
              height: TOOLBAR_HEIGHT
            }}
          >
            {iconSet.map((iconCluster, clusterIndex) => (
              <View key={`toolbar-cluster-${clusterIndex}`} className="flex-row gap-1 items-center">
                {iconCluster.map((icon, iconIndex) => (
                  <View key={`toolbar-cluster-${clusterIndex}-icon-${iconIndex}`}>{icon}</View>
                ))}
              </View>
            ))}
          </View>
        </HStack>
      </Host>
    </Animated.View>
  );
};

export default ListToolbar;
