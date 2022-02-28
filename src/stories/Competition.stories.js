import '../../styles.css';
import '../../loading.css';
import CompetitionPage from '../../pages/competitions/[competitionId]';
import ongoing from './testData/ongoing.json';
import finished from './testData/finished.json';
import upcoming from './testData/upcoming.json';

export default {
  title: 'CompetitionPage',
  component: CompetitionPage,
};

export const Empty = () => <CompetitionPage />;
export const Ongoing = () => (
  <CompetitionPage
    {...ongoing}
    initialLoading={false}
    now={new Date('2022-02-28 12:00')}
  />
);
export const Finished = () => (
  <CompetitionPage
    {...finished}
    initialLoading={false}
    now={new Date('2022-02-25 12:00')}
  />
);
export const Upcoming = () => (
  <CompetitionPage
    {...upcoming}
    initialLoading={false}
    now={new Date('2022-02-25 12:00')}
  />
);
