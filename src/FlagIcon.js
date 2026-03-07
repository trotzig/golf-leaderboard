import React from 'react';
import AM from 'country-flag-icons/react/3x2/AM';
import AR from 'country-flag-icons/react/3x2/AR';
import AT from 'country-flag-icons/react/3x2/AT';
import AU from 'country-flag-icons/react/3x2/AU';
import BE from 'country-flag-icons/react/3x2/BE';
import CA from 'country-flag-icons/react/3x2/CA';
import CH from 'country-flag-icons/react/3x2/CH';
import CZ from 'country-flag-icons/react/3x2/CZ';
import DE from 'country-flag-icons/react/3x2/DE';
import DK from 'country-flag-icons/react/3x2/DK';
import EE from 'country-flag-icons/react/3x2/EE';
import ES from 'country-flag-icons/react/3x2/ES';
import FI from 'country-flag-icons/react/3x2/FI';
import FR from 'country-flag-icons/react/3x2/FR';
import GB from 'country-flag-icons/react/3x2/GB';
import GbSct from 'country-flag-icons/react/3x2/GB-SCT';
import HR from 'country-flag-icons/react/3x2/HR';
import HU from 'country-flag-icons/react/3x2/HU';
import IE from 'country-flag-icons/react/3x2/IE';
import IS from 'country-flag-icons/react/3x2/IS';
import IT from 'country-flag-icons/react/3x2/IT';
import JP from 'country-flag-icons/react/3x2/JP';
import KR from 'country-flag-icons/react/3x2/KR';
import LT from 'country-flag-icons/react/3x2/LT';
import LV from 'country-flag-icons/react/3x2/LV';
import NL from 'country-flag-icons/react/3x2/NL';
import NO from 'country-flag-icons/react/3x2/NO';
import NZ from 'country-flag-icons/react/3x2/NZ';
import PL from 'country-flag-icons/react/3x2/PL';
import PT from 'country-flag-icons/react/3x2/PT';
import RO from 'country-flag-icons/react/3x2/RO';
import RS from 'country-flag-icons/react/3x2/RS';
import SE from 'country-flag-icons/react/3x2/SE';
import SK from 'country-flag-icons/react/3x2/SK';
import UA from 'country-flag-icons/react/3x2/UA';
import US from 'country-flag-icons/react/3x2/US';
import ZA from 'country-flag-icons/react/3x2/ZA';

const FLAGS = {
  AM, AR, AT, AU, BE, CA, CH, CZ, DE, DK, EE, ES, FI, FR, GB,
  HR, HU, IE, IS, IT, JP, KR, LT, LV, NL, NO, NZ, PL, PT, RO,
  RS, SE, SK, UA, US, ZA,
};

// GolfBox uses non-standard "SQ" for Scotland
const CODE_MAP = { SQ: GbSct };

const COUNTRY_NAMES = {
  AM: 'Armenia',
  AR: 'Argentina',
  AT: 'Austria',
  AU: 'Australia',
  BE: 'Belgium',
  CA: 'Canada',
  CH: 'Switzerland',
  CZ: 'Czech Republic',
  DE: 'Germany',
  DK: 'Denmark',
  EE: 'Estonia',
  ES: 'Spain',
  FI: 'Finland',
  FR: 'France',
  GB: 'Great Britain',
  HR: 'Croatia',
  HU: 'Hungary',
  IE: 'Ireland',
  IS: 'Iceland',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  LT: 'Lithuania',
  LV: 'Latvia',
  NL: 'Netherlands',
  NO: 'Norway',
  NZ: 'New Zealand',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  RS: 'Serbia',
  SE: 'Sweden',
  SK: 'Slovakia',
  SQ: 'Scotland',
  UA: 'Ukraine',
  US: 'United States',
  ZA: 'South Africa',
};

export function getCountryName(nationality) {
  return COUNTRY_NAMES[nationality] || null;
}

export default function FlagIcon({ nationality }) {
  if (!nationality) return null;
  const FlagComponent = CODE_MAP[nationality] || FLAGS[nationality];
  if (!FlagComponent) return null;
  return <FlagComponent className="flag-icon" />;
}
