import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Planner from '../feature/planner/components/Planner';

const WeeklyPlanner = () => {
  const { colors } = useTheme();
  const [currentListInEdit, setCurrentListInEdit] = useState<string | undefined>();
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


  const handleUpdateCurrentListInEdit = (timestamp: string) => setCurrentListInEdit(timestamp);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'space-between' }}>
      <SafeAreaView>
        {timestamps.map((timestamp) =>
          <Planner
            key={`${timestamp}-planner`}
            timestamp={timestamp}
            currentOpenTextfield={currentListInEdit}
            handleUpdateCurrentListInEdit={handleUpdateCurrentListInEdit}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default WeeklyPlanner;