import TopNavbar from '@/components/TopNavbar';
import { Slot } from 'expo-router';

export default function PlannersLayout() {
    return (
        <TopNavbar>
            <Slot />
        </TopNavbar>
    )
}
