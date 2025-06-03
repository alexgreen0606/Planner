import PlannersNavbar from '@/components/PlannersNavbar';
import { Slot } from 'expo-router';

export default function PlannersLayout() {
    return (
        <PlannersNavbar>
            <Slot />
        </PlannersNavbar>
    )
}
