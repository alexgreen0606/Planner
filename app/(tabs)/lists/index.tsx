import { ROOT_CHECKLIST_FOLDER_KEY } from '@/constants/storageIds';
import { Redirect } from 'expo-router';

export default function IndexPage() {

    return <Redirect href={`/lists/folder/NULL/NULL/${ROOT_CHECKLIST_FOLDER_KEY}`} />;
}
