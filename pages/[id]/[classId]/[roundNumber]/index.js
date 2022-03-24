import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CompetitionPage() {
  const router = useRouter();
  const { id } = router.query;
  useEffect(() => {
    router.replace(`/competitions/${id}`);
  }, [id]);
  return null;
}
