import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import globalStyles from '../theme/globalStyles';
import SortablePlanner from '../feature/planners/components/SortablePlanner';

/**
 * Recurring modal includes:
 * 
 *  - A sortable planner
 *  - A label: Week Day Routine
 *  - A description of what this is for:
 *    - "All events below will be automatically added to every weekday in your planner."
 *  - need to disable the ability to add these events to calendar
 */

const WeeklyPlanner = () => {
  const { colors } = useTheme();
  const [timestamps, setTimestamps] = useState<string[]>([]);

  useEffect(() => {
    const buildWeeklyPlanner = () => {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      const timestamps = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return date.toISOString().split('T')[0];
      });
      setTimestamps(timestamps);
    };

    buildWeeklyPlanner();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'space-between' }}>
      <SafeAreaView>
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            <View style={styles.label}>
              <FontAwesome
                name='book'
                size={26}
                color={colors.primary}
              />
              <Text adjustsFontSizeToFit style={styles.labelText} numberOfLines={2}>
                Coming this week
              </Text>
            </View>
            <MaterialCommunityIcons
              name='calendar-sync'
              size={18}
              color={colors.outline}
            />
          </View>
          <View style={styles.thinLine} />
        </View>
        {timestamps.map((timestamp) =>
          <SortablePlanner
            key={`${timestamp}-planner`}
            timestamp={timestamp}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  banner: {
    ...globalStyles.spacedApart,
    paddingHorizontal: 8,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelText: {
    fontSize: 25,
    color: theme.colors.primary,
  },
  thinLine: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.outline,
    marginTop: 8,
    marginBottom: 16
  },
});

export default WeeklyPlanner;
