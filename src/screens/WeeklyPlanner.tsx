import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import globalStyles from '../theme/globalStyles';
import SortablePlanner from '../feature/planners/components/SortablePlanner';
import { ScrollView } from 'react-native-gesture-handler';
import Modal from '../foundation/ui/modal/Modal';
import { RECURRING_WEEKDAY_PLANNER } from '../feature/planners/enums';
import { getNextSevenDayTimestamps } from '../feature/planners/utils';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { StorageIds } from '../enums';
import { getPlannerKey } from '../feature/planners/storage/plannerStorage';
import ThinLine from '../foundation/ui/separators/ThinLine';

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
  const [weekdayPlannerOpen, setWeekdayPlannerOpen] = useState(false);
  const [plannerListKey, setPlannerListKey] = useState('PLANNER_LIST_KEY');
  const [saveRecurring, setSaveRecurring] = useState(false);

  useEffect(() => {
    const buildWeeklyPlanner = () => {
      const timestamps = getNextSevenDayTimestamps();
      setTimestamps(timestamps);
    };

    buildWeeklyPlanner();
  }, []);

  const storage = useMMKV({ id: StorageIds.PLANNER_STORAGE });

  // Reload the planner when the recurring planner changes
  useMMKVListener((key) => {
    if (key === getPlannerKey(RECURRING_WEEKDAY_PLANNER)) {
      console.log('RECURRING CHNAGED.');
      setPlannerListKey(curr => (`${curr}_RERENDER`));
    }
  }, storage)

  const toggleWeekdayPlanner = () => setWeekdayPlannerOpen(!weekdayPlannerOpen);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
              size={20}
              color={colors.outline}
              onPress={toggleWeekdayPlanner}
            />
          </View>
          <ThinLine style={{
            marginTop: 8,
            marginBottom: 16
          }}
          />
        </View>
        <ScrollView
          key={plannerListKey}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', width: '100%' }}
        >
          {timestamps.map((timestamp) =>
            <View style={{ width: '85%', alignItems: 'center' }} key={`${timestamp}-planner`}>
              <SortablePlanner
                plannerId={timestamp}
              />
            </View>
          )}
        </ScrollView>
        <Modal
          title='Recurring Weekday Planner'
          open={weekdayPlannerOpen}
          primaryButtonConfig={{
            onClick: () => {
              setSaveRecurring(true);
              toggleWeekdayPlanner();
            },
            label: 'Save'
          }}
          toggleModalOpen={toggleWeekdayPlanner}
        >
          <SortablePlanner
            plannerId={RECURRING_WEEKDAY_PLANNER}
            manualSaveTrigger={saveRecurring}
          />
        </Modal>
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
});

export default WeeklyPlanner;
