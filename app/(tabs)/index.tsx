import { Redirect } from 'expo-router';

import { getTodayDatestamp } from '@/utils/dateUtils';

const RerouteToTodayPlanner = () => <Redirect href={`/planners/${getTodayDatestamp()}`} />;

export default RerouteToTodayPlanner;
