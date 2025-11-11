import { View } from 'react-native';

import PlannerDateIcon from './PlannerDateIcon';

interface IPlannerCarouselWeekProps {
  datestamps: string[];
  currentDatestamp: string;
};

const PlannerCarouselWeek = ({ datestamps, currentDatestamp }: IPlannerCarouselWeekProps) => (
  <View className="flex-row justify-evenly">
    {datestamps.map((datestamp) => (
      <PlannerDateIcon
        datestamp={datestamp}
        isCurrentDatestamp={datestamp === currentDatestamp}
        key={`${datestamp}-icon`}
      />
    ))}
  </View>
);

export default PlannerCarouselWeek;
