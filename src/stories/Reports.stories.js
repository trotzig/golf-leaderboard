import '../../styles.css';

import React from 'react';

import ReportPage from '../ReportPage.js';
import ReportsIndexPage from '../ReportsIndexPage.js';
import { seasonSummaryReport, tournamentReports } from './mockData.js';
import withNav from './withNav.js';

// Same shape as the list built in pages/reports/index.js.
function toBlurb(report) {
  return {
    slug: report.slug,
    competitionName: report.competitionName,
    endDate: report.endDate,
    headline: report.headline,
    blurb: report.blurb,
    winnerName: report.winnerName || null,
    winnerPlayerId: report.winnerPlayerId || null,
    winnerImage: report.winnerImage || null,
    isSeriesReport: report.isSeriesReport || false,
  };
}

export default {
  title: 'Reports',
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Index = () => (
  <ReportsIndexPage
    reports={[...tournamentReports, seasonSummaryReport].map(toBlurb)}
  />
);

export const TournamentReport = () => (
  <ReportPage report={tournamentReports[0]} />
);

export const SeasonSummaryReport = () => (
  <ReportPage report={seasonSummaryReport} />
);
