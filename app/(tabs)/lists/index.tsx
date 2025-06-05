import { StorageKey } from '@/constants/storage';
import { Redirect } from 'expo-router';

export default function IndexPage() {

    return <Redirect href={`/lists/folder/NULL/NULL/${StorageKey.ROOT_CHECKLIST_FOLDER_KEY}`} />;
}
