import { THIN_LINE_HEIGHT } from '@/constants/layout';
import { MenuView } from '@react-native-menu/menu';
import React from 'react';
import { Platform, PlatformColor, StyleSheet, View } from 'react-native';
import ButtonText from './text/ButtonText';

const Test = () => {
  return (
    <View>
      <MenuView
        title="Menu Title"
        onPressAction={({ nativeEvent }) => {
          console.warn(JSON.stringify(nativeEvent));
        }}
        actions={[
          {
            id: 'add',
            title: 'Add',
            titleColor: '#2367A2',
            image: Platform.select({
              ios: 'plus',
              android: 'ic_menu_add',
            }),
            imageColor: '#2367A2',
            subactions: [
              {
                id: 'nested1',
                title: 'Nested action',
                titleColor: 'rgba(250,180,100,0.5)',
                subtitle: 'State is mixed',
                image: Platform.select({
                  ios: 'heart.fill',
                  android: 'ic_menu_today',
                }),
                imageColor: 'rgba(100,200,250,0.3)',
                state: 'mixed',
              },
              {
                id: 'nestedDestructive',
                title: 'Destructive Action',
                attributes: {
                  destructive: true,
                },
                image: Platform.select({
                  ios: 'trash',
                  android: 'ic_menu_delete',
                }),
              },
            ],
          },
          {
            id: 'share',
            title: 'Share Action',
            titleColor: '#46F289',
            subtitle: 'Share action on SNS',
            image: Platform.select({
              ios: 'square.and.arrow.up',
              android: 'ic_menu_share',
            }),
            imageColor: '#46F289',
            state: 'on',
          },
          {
            id: 'destructive',
            title: 'Destructive Action',
            attributes: {
              destructive: true,
            },
            image: Platform.select({
              ios: 'trash',
              android: 'ic_menu_delete',
            }),
          },
        ]}
        shouldOpenOnLongPress={false}
      >
        <View>
          <ButtonText onClick={() => null}>Test</ButtonText>
        </View>
      </MenuView>
    </View>
  )
}

const styles = StyleSheet.create({
    lineContainer: {
        width: '100%',
        height: THIN_LINE_HEIGHT,
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    thinLine: {
        width: '100%',
        height: StyleSheet.hairlineWidth,
        backgroundColor: PlatformColor('systemGray'),
    },
});

export default Test;
