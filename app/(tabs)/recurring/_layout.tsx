import RecurringPlannerPage from '@/components/RecurringPlannerPage';
import { Slot } from 'expo-router';

// ✅ 

const Layout = () => (
    <RecurringPlannerPage>
        <Slot />
    </RecurringPlannerPage>
);

export default Layout;