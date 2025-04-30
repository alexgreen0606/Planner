import { Slot } from 'expo-router';
import TopNavbar from '../../../src/foundation/components/TopNavbar';

export default function PlannersLayout() {
    return (
        <TopNavbar>
            <Slot />
        </TopNavbar>
    )
}
