import useAppTheme from '@/hooks/useAppTheme';
import { Stack } from 'expo-router';
import React from 'react';

// ✅ 

const PlannersLayout = () => {
    const { CssColor: { background } } = useAppTheme();
    return (
        <Stack screenOptions={{
            animation: 'fade',
            headerShown: false,
            contentStyle: {
                backgroundColor: background
            }
        }} />
    )
};

export default PlannersLayout;