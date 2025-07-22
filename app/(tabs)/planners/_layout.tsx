import PlannersNavbar from '@/components/PlannersNavbar';
import { Slot } from 'expo-router';

// ✅ 

const PlannersLayout = () =>
    <PlannersNavbar>
        <Slot />
    </PlannersNavbar>;

export default PlannersLayout;