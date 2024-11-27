import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Planner from '../feature/planner/components/Planner';
import { usePlannersContext } from '../feature/planner/services/PlannersProvider';

const WeeklyPlanner = () => {
  const { colors } = useTheme();
  const { errors, clearErrors } = usePlannersContext();
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [snackbarVisible, setSnackbarVisible] = useState(false);

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

  useEffect(() => {
    // Watch for errors change
    if (errors.length > 0) {
      setError(errors[errors.length - 1].message);  // Save the most recent error
      setSnackbarVisible(true);  // Show snackbar
      clearErrors();  // Clear errors from context
    }
  }, [errors, clearErrors]);

  const handleSnackbarDismiss = () => {
    setSnackbarVisible(false);  // Hide snackbar
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'space-between' }}>
      <SafeAreaView key={errors.length}>
        {timestamps.map((timestamp) =>
          <Planner
            key={`${timestamp}-planner`}
            timestamp={timestamp}
          />
        )}
      </SafeAreaView>

      {/* Snackbar for displaying the error */}
      {error && (
        <Snackbar
          visible={snackbarVisible}
          onDismiss={handleSnackbarDismiss}
          duration={Snackbar.DURATION_SHORT}
        >
          {error}
        </Snackbar>
      )}
    </View>
  );
};

export default WeeklyPlanner;
