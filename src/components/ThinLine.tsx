import React from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';

import { EListLayout } from '@/lib/enums/EListLayout';

const ThinLine = () => (
  <View className="w-full justify-center" style={{ height: EListLayout.NEW_ITEM_TRIGGER_HEIGHT }}>
    <View
      className="w-full"
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: PlatformColor('systemGray')
      }}
    />
  </View>
);

export default ThinLine;
