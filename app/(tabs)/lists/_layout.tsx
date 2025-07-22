import { Stack } from 'expo-router';

// ✅ 

const Layout = () =>
    <Stack
        screenOptions={{
            headerShown: false,
            animation: 'slide_from_right'
        }}
    />;

export default Layout;