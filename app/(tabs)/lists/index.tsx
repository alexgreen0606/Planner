import { EStorageKey } from '@/lib/enums/EStorageKey';
import { Redirect } from 'expo-router';

// ✅ 

const IndexPage = () => <Redirect href={`/lists/folder/NULL/NULL/${EStorageKey.ROOT_FOLDER_KEY}`} />;

export default IndexPage;