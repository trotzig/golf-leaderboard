import '../../styles.css';

import React from 'react';

import CompetitionPage from '../CompetitionPage.js';
import emailTemplates from '../emails/emailTemplates.mjs';
import Nav from '../Menu.js';
import StartPage from '../StartPage.js';
import * as competitionStories from './Competition.stories.js';
import EmailFrame from './EmailFrame.js';
import * as startPageStories from './StartPage.stories.js';
import dormyLogo from './sponsorLogos/dormy.svg';
import golfGameBookLogo from './sponsorLogos/golf-gamebook.svg';
import golfPlaisirLogo from './sponsorLogos/golf-plaisir.svg';
import hboMaxLogo from './sponsorLogos/hbo-max.webp';
import indoorGolfGroupLogo from './sponsorLogos/indoor-golf-group.png';
import nordicGolfersLogo from './sponsorLogos/nordic-golfers.webp';
import onTeeLogo from './sponsorLogos/ontee.webp';
import trackmanLogo from './sponsorLogos/trackman.svg';
import viaplayLogo from './sponsorLogos/viaplay.webp';

// Mockups of the sponsor placements, for showing prospective sponsors what
// their brand would look like on the site. The logos in `sponsorLogos/` were
// downloaded from the sponsors' own sites.
const onTee = {
  name: 'OnTee',
  href: 'https://www.ontee.com/',
  logoSrc: onTeeLogo,
  color: '#8cc63f',
  onColor: '#16250a',
  headline: 'Play where the pros play.',
  pitch: venue =>
    venue
      ? `Book your own tee time at ${venue} on OnTee.`
      : 'Book your next tee time on OnTee.',
  shortPitch: venue =>
    venue ? `Play ${venue} yourself` : 'Book your next tee time',
  cta: 'Book a tee time',
};

// Dormy sells equipment, so its pitch is about gear rather than the venue.
const dormy = {
  name: 'Dormy',
  href: 'https://www.dormy.com/sv',
  logoSrc: dormyLogo,
  color: '#cc0000',
  onColor: '#ffffff',
  headline: 'Play what the pros play.',
  pitch: () => 'Clubs, balls and clothing from the brands on tour, at Dormy.',
  shortPitch: () => 'Play what the pros play',
  cta: 'Shop at Dormy',
};

// Golf Plaisir doesn't travel to the tour's venues, so it promotes one of its
// own destinations that hosts a tour event instead.
const golfPlaisir = {
  name: 'Golf Plaisir',
  href: 'https://golfplaisir.se/golfresor/forenade-arabemiraten/ras-al-khaimah/al-hamra-residence',
  logoSrc: golfPlaisirLogo,
  color: '#a00000',
  onColor: '#ffffff',
  headline: 'Next stop: Al Hamra.',
  pitch: () =>
    'Play the home of the DP World Tour\u2019s Ras Al Khaimah Championship with Golf Plaisir.',
  shortPitch: () => 'Play Al Hamra, a DP World Tour venue',
  cta: 'See the trip',
};

const trackman = {
  name: 'Trackman',
  href: 'https://www.trackman.com/',
  logoSrc: trackmanLogo,
  logoBackground: '#141414',
  color: '#ec691a',
  onColor: '#1f0f04',
  headline: 'Know your numbers.',
  pitch: () => 'Tour-proven launch monitors and golf simulators from Trackman.',
  shortPitch: () => 'Know your numbers like the pros',
  cta: 'Explore Trackman',
};

const viaplay = {
  name: 'Viaplay',
  href: 'https://viaplay.se/sport/golf',
  logoSrc: viaplayLogo,
  logoBackground: '#1b1b24',
  color: '#e40050',
  onColor: '#ffffff',
  headline: 'Watch the next step.',
  pitch: () => 'The DP World Tour and all four majors, live on Viaplay.',
  shortPitch: () => 'The DP World Tour, live on Viaplay',
  cta: 'Watch golf on Viaplay',
};

const indoorGolfGroup = {
  name: 'Indoor Golf Group',
  href: 'https://indoorgolfgroup.se/',
  logoSrc: indoorGolfGroupLogo,
  color: '#f28349',
  onColor: '#24100a',
  headline: 'Love golf. All year round.',
  pitch: () => 'Keep playing indoors when the season ends, at Indoor Golf Group.',
  shortPitch: () => 'Keep playing all winter, indoors',
  cta: 'Find a venue',
};

const golfGameBook = {
  name: 'Golf GameBook',
  href: 'https://www.golfgamebook.com/',
  logoSrc: golfGameBookLogo,
  color: '#0bb163',
  onColor: '#032615',
  headline: 'Your round, live.',
  pitch: () =>
    'Give your own game a live leaderboard with the Golf GameBook app.',
  shortPitch: () => 'Get a live leaderboard for your own round',
  cta: 'Get the app',
};

// Nordic Golfers sells stays at some of the tour's venues, so its mockups use
// one of those.
const nordicGolfers = {
  name: 'NordicGolfers.com',
  logoSrc: nordicGolfersLogo,
  href: 'https://www.nordicgolfers.com/se/barsebaeck-resort/',
  color: '#ff0066',
  // White on this pink falls short of the 4.5:1 contrast the button text
  // needs, so the button text is dark.
  onColor: '#1f000c',
  headline: 'Play where the pros play.',
  pitch: venue => `Stay and play at ${venue} with NordicGolfers.com.`,
  shortPitch: venue => `Stay and play at ${venue}`,
  cta: 'See the package',
};
const nordicGolfersCompetition = {
  name: 'Folksam Championship',
  venue: 'Barsebäck Resort',
  slug: 'folksam-championship',
};

const hboMax = {
  name: 'HBO Max',
  href: 'https://www.hbomax.com/se/sv',
  logoSrc: hboMaxLogo,
  logoBackground: '#000000',
  // HBO Max's brand is black and white. A mid grey stands in for it so the
  // card still shows up in dark mode.
  color: '#5b5b66',
  onColor: '#ffffff',
  headline: 'Watch the PGA Tour.',
  pitch: () => 'Every round of the PGA Tour, live on HBO Max.',
  shortPitch: () => 'The PGA Tour, live on HBO Max',
  cta: 'Watch on HBO Max',
};

export default {
  title: 'Sponsors',
  decorators: [
    (Story, { parameters }) => (
      <div>
        {parameters.nav !== false && <Nav activeHref="/" />}
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

const visbyCompetition = {
  name: 'SGT Open Visby',
  venue: 'Visby GK',
  slug: 'sgt-open-visby',
};

function startPageWith(sponsor, competition = visbyCompetition) {
  const { props } = startPageStories.WithLeaderboard();
  const currentCompetition = { ...props.currentCompetition, ...competition };
  return (
    <StartPage
      {...props}
      currentCompetition={currentCompetition}
      sponsor={sponsor}
    />
  );
}

function leaderboardWith(sponsor, competition) {
  const { props } = competitionStories.Ongoing();
  return (
    <CompetitionPage
      {...props}
      competition={{ ...props.competition, ...competition }}
      sponsor={sponsor}
    />
  );
}

export const OnTeeStartPage = () => startPageWith(onTee);
export const OnTeeLeaderboard = () => leaderboardWith(onTee);

// The sponsor block at the end of a "finished round" notification email.
function emailWith(sponsor, competition = visbyCompetition) {
  const { element } = emailTemplates['player-update']({
    result: {
      competitionName: competition.name,
      competitionSlug: competition.slug,
      roundNumber: 2,
      firstName: 'Anders',
      lastName: 'Lindqvist',
      slug: 'anders-lindqvist',
      scoreToPar: '-5',
      totalScoreToPar: '-8',
      position: '1',
      holesPlayed: 18,
    },
    notificationType: 'finished',
    unsubscribeUrl: 'https://nordicgolftour.app/api/unsubscribe?token=abc',
    sponsor: { ...sponsor, pitch: sponsor.pitch(competition.venue) },
  });
  return <EmailFrame element={element} />;
}

export const OnTeeEmail = () => emailWith(onTee);
OnTeeEmail.parameters = { nav: false };

export const DormyStartPage = () => startPageWith(dormy);
export const DormyLeaderboard = () => leaderboardWith(dormy);
export const DormyEmail = () => emailWith(dormy);
DormyEmail.parameters = { nav: false };

export const GolfPlaisirStartPage = () => startPageWith(golfPlaisir);
export const GolfPlaisirLeaderboard = () => leaderboardWith(golfPlaisir);
export const GolfPlaisirEmail = () => emailWith(golfPlaisir);
GolfPlaisirEmail.parameters = { nav: false };

export const TrackmanStartPage = () => startPageWith(trackman);
export const TrackmanLeaderboard = () => leaderboardWith(trackman);
export const TrackmanEmail = () => emailWith(trackman);
TrackmanEmail.parameters = { nav: false };

export const ViaplayStartPage = () => startPageWith(viaplay);
export const ViaplayLeaderboard = () => leaderboardWith(viaplay);
export const ViaplayEmail = () => emailWith(viaplay);
ViaplayEmail.parameters = { nav: false };

export const IndoorGolfGroupStartPage = () => startPageWith(indoorGolfGroup);
export const IndoorGolfGroupLeaderboard = () =>
  leaderboardWith(indoorGolfGroup);
export const IndoorGolfGroupEmail = () => emailWith(indoorGolfGroup);
IndoorGolfGroupEmail.parameters = { nav: false };

export const GolfGameBookStartPage = () => startPageWith(golfGameBook);
export const GolfGameBookLeaderboard = () => leaderboardWith(golfGameBook);
export const GolfGameBookEmail = () => emailWith(golfGameBook);
GolfGameBookEmail.parameters = { nav: false };

export const NordicGolfersStartPage = () =>
  startPageWith(nordicGolfers, nordicGolfersCompetition);
export const NordicGolfersLeaderboard = () =>
  leaderboardWith(nordicGolfers, nordicGolfersCompetition);
export const NordicGolfersEmail = () =>
  emailWith(nordicGolfers, nordicGolfersCompetition);
NordicGolfersEmail.parameters = { nav: false };

export const HboMaxStartPage = () => startPageWith(hboMax);
export const HboMaxLeaderboard = () => leaderboardWith(hboMax);
export const HboMaxEmail = () => emailWith(hboMax);
HboMaxEmail.parameters = { nav: false };
