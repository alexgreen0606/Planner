
import ListToolbar from '@/_deprecated/ListToolbar';

import IconButton from '../buttons/IconButton';

const PlannerEventToolbar = () => {
  return (
    <ListToolbar
      iconSet={[
        [
          <IconButton
            name="clock"
            onClick={() => null}
            // onClick={() => focusedEvent && openEditEventModal(focusedEvent.id, focusedEvent.listId)}
            color="label"
          />
        ]
      ]}
    />
  );
};

export default PlannerEventToolbar;
