import ContentoresView from '@/components/ContentoresView';
import { readDb } from '@/lib/db';
import { contentoresData } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <ContentoresView data={contentoresData((await readDb()).contentores)} />;
}
