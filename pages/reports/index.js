import ReportsIndexPage from '../../src/ReportsIndexPage.js';
import fs from 'fs';
import path from 'path';

export default ReportsIndexPage;

export async function getServerSideProps() {
  const reportsDir = path.join(process.cwd(), 'src', 'reports');
  let reports = [];
  if (fs.existsSync(reportsDir)) {
    reports = fs
      .readdirSync(reportsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(reportsDir, f), 'utf8'));
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
      .map(a => ({
        slug: a.slug,
        competitionName: a.competitionName,
        endDate: a.endDate,
        headline: a.headline,
        blurb: a.blurb,
        winnerName: a.winnerName || null,
        winnerPlayerId: a.winnerPlayerId || null,
        winnerImage: a.winnerImage || null,
        isSeriesReport: a.isSeriesReport || false,
      }));
  }
  return { props: { reports } };
}
