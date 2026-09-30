import '../../styles.css';

import React from 'react';

import ReportPage from '../ReportPage.js';
import ReportsIndexPage from '../ReportsIndexPage.js';
import folksam from '../reports/folksam-championship-2026.json';
import moregolf from '../reports/moregolf-mastercard-stockholm-2026.json';
import samso from '../reports/samso-festival-pro-am---by-united-tickets-2026.json';
import seasonSummary from '../reports/season-summary-2026.json';
import sollerod from '../reports/sollerod-championship-2026.json';
import trustForsikring from '../reports/trust-forsikring-championship-2026.json';
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
    reports={[
      folksam,
      sollerod,
      moregolf,
      samso,
      trustForsikring,
      seasonSummary,
    ].map(toBlurb)}
  />
);

export const TournamentReport = () => <ReportPage report={folksam} />;

export const SeasonSummaryReport = () => <ReportPage report={seasonSummary} />;
