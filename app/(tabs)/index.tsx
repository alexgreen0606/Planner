import { getTodayDatestamp } from '@/utils/dateUtils';
import { Redirect } from 'expo-router';

// ✅ 

export default function Index() {
    return <Redirect href={`/planners/${getTodayDatestamp()}`} />;
}