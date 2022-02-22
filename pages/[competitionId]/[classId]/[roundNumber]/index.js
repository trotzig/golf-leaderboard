import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CompetitionPage() {
  const router = useRouter();
  const { competitionId } = router.query;
  useEffect(() => {
    router.replace(`/competitions/${competitionId}`);
  }, [competitionId]);
  return null;
}
