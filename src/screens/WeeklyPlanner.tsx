import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import globalStyles from '../theme/globalStyles';
import SortablePlanner from '../feature/planners/components/SortablePlanner';
import { ScrollView } from 'react-native-gesture-handler';
import Modal from '../foundation/ui/modal/Modal';
import { RECURRING_WEEKDAY_PLANNER } from '../feature/planners/enums';
import { generateNextSevenDayTimestamps } from '../feature/planners/utils';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { StorageIds } from '../enums';
import { getPlannerStorageKey } from '../feature/planners/storage/plannerStorage';
import SortableRecurringPlanner from '../feature/planners/components/SortableRecurringPlanner';
import GenericIcon from '../foundation/ui/icons/GenericIcon';

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
  const [saveRecurringTrigger, setSaveRecurringTrigger] = useState('TRIGGER');

  useEffect(() => {
    const buildWeeklyPlanner = () => {
      const timestamps = generateNextSevenDayTimestamps();
      setTimestamps(timestamps);
    };

    buildWeeklyPlanner();
  }, []);

  const storage = useMMKV({ id: StorageIds.PLANNER_STORAGE });

  // Reload the planner when the recurring planner changes
  useMMKVListener((key) => {
    if (key === getPlannerStorageKey(RECURRING_WEEKDAY_PLANNER)) {
      setPlannerListKey(curr => (`${curr}_RERENDER`));
    }
  }, storage)

  const toggleWeekdayPlanner = () => setWeekdayPlannerOpen(!weekdayPlannerOpen);

  return (
    <View style={{ flex: 1, backgroundColor: colors.backdrop }}>
      <SafeAreaView>
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            <View style={styles.label}>
              <GenericIcon
                type='Ionicons'
                name='calendar-number-sharp'
                size={26}
                color={colors.primary}
              />
              <Text adjustsFontSizeToFit style={styles.labelText} numberOfLines={2}>
                Planner
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleWeekdayPlanner}
            >
              <GenericIcon
                type='MaterialCommunityIcons'
                name='calendar-sync'
                size={20}
                color={colors.outline}
              />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          key={plannerListKey}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', width: '100%'}}
        >
          {timestamps.map((timestamp) =>
            <View style={{ width: '90%', alignItems: 'center', marginBottom: 80 }} key={`${timestamp}-planner`}>
              <SortablePlanner
                timestamp={timestamp}
              />
            </View>
          )}
        </ScrollView>
        <Modal
          title='Recurring Weekday Planner'
          open={weekdayPlannerOpen}
          primaryButtonConfig={{
            onClick: () => {
              setSaveRecurringTrigger(`${saveRecurringTrigger}_AGAIN`);
              toggleWeekdayPlanner();
            },
            label: 'Save'
          }}
          toggleModalOpen={toggleWeekdayPlanner}
        >
          <SortableRecurringPlanner
            manualSaveTrigger={saveRecurringTrigger}
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
    paddingBottom: 20
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
    color: theme.colors.secondary,
  },
});

export default WeeklyPlanner;
