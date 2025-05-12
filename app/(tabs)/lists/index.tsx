import { Redirect } from 'expo-router';
import { ROOT_FOLDER_KEY } from '../../../src/feature/checklists/constants';

export const LISTS_STACK_ID = 'LISTS_STACK_ID';

export default function IndexPage() {

    return <Redirect href={`/lists/folder/NULL/NULL/${ROOT_FOLDER_KEY}`} />;
}
