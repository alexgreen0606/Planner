import { Slot } from 'expo-router';
import TopNavbar from '../../../src/foundation/navigation/components/TopNavbar';

export default function PlannersLayout() {
    return (
        <TopNavbar>
            <Slot />
        </TopNavbar>
    )
}
