import { Redirect } from 'expo-router';
import { ROOT_FOLDER_KEY } from '../../src/feature/checklists/constants';

export default function IndexPage() {

    return <Redirect href={`/lists/folder/NULL/${ROOT_FOLDER_KEY}`} />;
}
