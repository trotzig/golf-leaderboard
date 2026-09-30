import ReportPage from '../../src/ReportPage.js';
import fs from 'fs';
import path from 'path';

export default ReportPage;

export async function getServerSideProps({ params, req }) {
  const reportsDir = path.join(process.cwd(), 'src', 'reports');
  const filePath = path.join(reportsDir, `${params.slug}.json`);

  if (!fs.existsSync(filePath)) {
    return { notFound: true };
  }

  const report = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${req.headers.host}`;
  return { props: { report, baseUrl } };
}
