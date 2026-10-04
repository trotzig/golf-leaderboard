# GolfBox API data structures

A field guide to the GolfBox livescoring feeds this app reads from
`https://scores.golfbox.dk/Handlers/...`.

**There is no official documentation.** These are the undocumented handlers
behind GolfBox's own livescoring web pages. GolfBox only documents its
embeddable widgets (`scores.golfbox.dk/api/js/...`); for anything else its
support pages point to `support@golfbox.dk`. Everything below comes from:

- the real recorded responses in `src/stories/testData/*.json` (see
  [Fixtures](#fixtures)), and
- the code that reads each field (file references are given throughout).

Field lists cover what we have seen or use. GolfBox returns many more
settings fields than we need, and those are only summarized here.

## Contents

- [General conventions](#general-conventions)
- [Endpoints at a glance](#endpoints-at-a-glance)
- [Schedule](#schedule--schedulehandlergetschedule)
- [Competition](#competition--competitionhandlergetcompetition)
- [Shared `CompetitionData` object](#shared-competitiondata-object)
- [Leaderboard](#leaderboard--leaderboardhandlergetleaderboard)
  - [Individual entry](#individual-leaderboard-entry)
  - [Round and hole scores](#round-object-and-hole-scores)
  - [Team competitions](#team-competitions-leaderboardteams)
- [Tee times](#tee-times--teetimeshandlergetteetimes)
- [Players / entry list](#players--playershandlergetplayers)
- [Match play](#match-play--matchplayhandlergetmatchplay)
- [Order of Merit](#order-of-merit--orderofmeritshandler)
- [How competition state is derived](#how-competition-state-is-derived)
- [Fixtures](#fixtures)
- [Open questions](#open-questions)

---

## General conventions

### Transport: JSON vs JSONP

- **In the browser** the app loads these feeds as JSONP, by adding
  `?callback=<fn>&_=<timestamp>` (`src/fetchJsonP.js`). GolfBox doesn't send
  CORS headers, so plain `fetch` from the browser won't work.
- **On the server** (cron jobs, scripts, `getServerSideProps`) the app calls
  plain `fetch` and parses the body with `scripts/utils/parseJson.mjs`.
  The body is JavaScript-flavoured JSON that can contain minified booleans
  (`!0` / `!1`). That helper swaps them for `true` / `false` (as JavaScript
  evaluates them) before calling `JSON.parse`.
- The body is the same either way: adding `?callback` only wraps it in
  `<fn>(…)`. Both variants contain `!0` / `!1`, never `true` / `false`.

### URL shape

```
https://scores.golfbox.dk/Handlers/<Handler>/<Method>/<Param>/<value>/.../language/2057/
```

Parameters are path segments given as name/value pairs. `language/2057` is the
Windows LCID for English (UK), which gives English round names and labels.
Always keep the trailing `/`.

### IDs and keyed maps

GolfBox usually returns collections as **objects keyed by a prefixed ID**, not
as arrays. Iterate them with `Object.values(...)`. The order of the keys matches
GolfBox's display order (for leaderboards, that is position order).

| Prefix | Meaning                    | Example key                               |
| ------ | -------------------------- | ----------------------------------------- |
| `C`    | Class, or Course           | `C3066464`                                |
| `CS`   | Course start (round setup) | `CS4699776`                               |
| `E`    | Entry (a player's entry)   | `E27393779`                               |
| `T`    | Team, or Tee (GUID)        | `T16343208`, `T97CADC93-AA9A-...`         |
| `R`    | Round (by number)          | `R1`, `R2` (`R0` before tee times exist)  |
| `S`    | Start list                 | `S2402467`                                |
| `H`    | Hole (by number)           | `H1` … `H18`, plus `H-OUT`, `H-IN`, `H-TOTAL` |

There are a few exceptions. `CompetitionData.Classes`, `RoundSetup`,
`CompetitionData.CourseColours`, start-list `Entries` and match-play
`Entries` are real arrays. The top-level `CourseColours` is an object keyed
by the course name in **lower case**.

Other ID fields:

- `RefID` / `RefId` / `Id` / `ID`: GolfBox's internal numeric IDs. The casing
  differs between handlers, and `fetchCompetitions.mjs` reads `e.ID || e.Id`.
- `MemberID`: a **string** player ID, the stable key for a player across
  competitions. It is `Player.id` in our DB. Formats vary by federation, for
  example `"47-4286"` (DK), `"890401-013"` (SE) and `"138099"`.
- `EntryId` / `EntryID` / entry `RefID`: one player's entry in **one**
  competition. These are not stable across competitions.

### Dates

- Format is `yyyyMMdd'T'HHmmss`, for example `"20220218T094500"`, with no
  timezone.
- Tee times and start times are **local course time**. The tours are Nordic
  and European, so the app treats them as CET/CEST (`src/parseCET.js`).
  `CompetitionData.TimeZoneInfo` / `UtcOffsetString` carry the real zone.
- Competition `StartDate`/`EndDate` are date-only (`T000000`).
  `fetchCompetitions.mjs` parses them as UTC midnight.
- `"00010101T000000"` means "no date" (.NET `DateTime.MinValue`).
- The `Loaded` field at the top level is the server timestamp of the response.

### Numbers and sentinel values

- **Scores are scaled by 10 000.** `ToParValue: -130000` means −13, and
  `ActualValue: 2010000` means 201 strokes. `HCP: "-53000"` (a string!)
  means a handicap of +5.3. Divide by 10 000 before use (`cutUtils.mjs`,
  `writeReport.mjs`, `PlayerStatsChart.js`). `PlayerCompetitionScore.score`
  in our DB keeps this ×10 000 scale.
- The exceptions are per-hole values (`HoleScores.H1.Par`, `Score.Value`,
  `Result.ToParValue`). Those are plain integers.
- `-2147483648` (`Int32.MinValue`) means "null / not set". It shows up in
  `ClassificationId`, `Category` and `ScoringToPar.HoleValue`.
- `ScoringToPar.HoleValue` can be a **large negative number** (for example
  `-1647853501`) when the player has not started the current round. It looks
  like an encoded tee time. Never treat it as holes played; clamp it to `0`
  (`src/cutUtils.mjs`).
- `ScoringToPar.TodayValue: 10000000` together with `TodayText: ""` means "not
  playing today" (for example, a player who missed the cut).
- `*Text` fields are what GolfBox would display, and `*Value` fields are
  numbers you can sort or compare. Display texts include `"Par"` (even par
  on a hole) and `"E"` (even on a total). `src/fixParValue.mjs` turns
  `"Par"` into `"E"`.
- In **Stableford** events, `ToParText` ends in `p` (`"+4p"`), and
  `Result.ToParValue` on holes is in *points* space. Use
  `Score.Value - Par` for strokes (`src/holeScore.mjs`,
  `src/competitionFormat.mjs`).

### Strings

Names often have **trailing whitespace** (`FirstName: "John "`). Always
`.trim()`. `ClubName` can be `""`, and `CompanyName` / `Picture` /
`Wagr` are often `null`.

### Customer, tours and categories

- `CustomerId` (`NEXT_PUBLIC_GOLFBOX_CUSTOMER_ID`) is the organizer. `1` =
  "Nordic Golf League", which runs several men's pro tours.
- Each schedule entry has `Categories: number[]` that tell you which tour it
  belongs to. `13350` = Cutter & Buck Tour, `13360` = ECCO Tour
  (`src/getCompetitionTour.mjs`).
- Regular tour events carry two categories: the tour one plus `13361`
  (meaning unknown), e.g. `[13350, 13361]`. Finnish events have
  `[13361, 14118]`.
- Q-School (qualifying for next season) has no flag or category of its own.
  It shows up with a single category that differs between years (`[13350]`
  in 2025, `[13361]` in 2026), so we detect it by name
  (`src/isQualifyingEvent.mjs`) and leave it out of the sync, the schedule
  and player results.
- GolfBox may list next season's event under last season's name before
  renaming it (seen with "NGL Q-School Final Stage 2026"), and may replace
  an event with a new ID.
- `CompetitionData.Type` is `"StrokePlay"` or `"MatchPlay"`.

---

## Endpoints at a glance

| Handler / method                                 | Params                                   | Used for                                       | Read in                                                         |
| ------------------------------------------------ | ---------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| `ScheduleHandler/GetSchedule`                    | `CustomerId`, `Season`, `CompetitionId/0`| List of the season's competitions               | `scripts/utils/fetchCompetitions.mjs`                            |
| `CompetitionHandler/GetCompetition`              | `CompetitionId`                          | Single competition: venue, `DefaultAction`, settings | `fetchCompetitions.mjs`, `syncData.mjs`, `notifySubscribers.mjs`, `CompetitionPage.js` |
| `LeaderboardHandler/GetLeaderboard`              | `CompetitionId`                          | Positions, scores, hole-by-hole data            | `syncData.mjs`, `syncCompetitionStats.mjs`, `notifySubscribers.mjs`, `CompetitionPage.js`, `TeeTimesPage.js`, `writeReport.mjs` |
| `TeeTimesHandler/GetTeeTimes`                    | `CompetitionId`                          | Start lists per round                           | `CompetitionPage.js`, `TeeTimesPage.js`, `notifySubscribers.mjs` |
| `PlayersHandler/GetPlayers`                      | `CompetitionId`                          | Entry list before tee times exist               | `syncData.mjs`, `CompetitionPage.js`                             |
| `MatchplayHandler/GetMatchplay`                  | `CompetitionId`                          | Knockout bracket (only when `Type === "MatchPlay"`) | `CompetitionPage.js`, `writeReport.mjs`                     |
| `OrderOfMeritsHandler/GetOrderOfMerit`           | `CustomerId`, `OrderOfMeritID`           | Season OOM standings                            | `syncData.mjs`, `OrderOfMeritPage.js`                            |
| `OrderOfMeritsHandler/GetOrderOfMerits`          | `CustomerId`                             | All OOMs, used to find a season's `OrderOfMeritID` | `scripts/find-oom-id.mjs`                                    |

---

## Schedule — `ScheduleHandler/GetSchedule`

```
/Handlers/ScheduleHandler/GetSchedule/CustomerId/{customerId}/Season/{year}/CompetitionId/0/language/2057/
```

Competitions are nested by year, then by month:

```jsonc
{
  "ErrorMessage": null,            // set on failure: check this, the HTTP status can still be 200
  "CompetitionData": {
    "<year key>": {
      "Months": {
        "<month key>": {
          "Entries": {
            "<key>": {
              "ID": 3176088,        // sometimes "Id"
              "Name": "GolfStar Winter Series I",
              "StartDate": "20220218T000000",
              "EndDate":   "20220220T000000",
              "Categories": [13350, ...], // identifies the tour, may be missing
              "Venue": { "Name": "..." }   // used by slug generation when NEXT_PUBLIC_INCLUDE_VENUE_IN_SLUG is set
              // ...more fields we don't use
            }
          }
        }
      }
    }
  }
}
```

We flatten this to `{ id, name, slug, start, end, categories }`
(`entryToCompetition` in `fetchCompetitions.mjs`). Setting
`NEXT_PUBLIC_GOLFBOX_COMPETITION_IDS` (comma-separated) skips the schedule
and calls `GetCompetition` for each ID.

## Competition — `CompetitionHandler/GetCompetition`

```
/Handlers/CompetitionHandler/GetCompetition/CompetitionId/{id}/language/2057/
```

```jsonc
{
  "CompetitionData": { /* see "Shared CompetitionData object" */ },
  "DefaultAction": "finalresults" // which tab GolfBox opens by default. "finalresults" means
                                  // results are published. Other values: tee times or leaderboard
}
```

`DefaultAction === "finalresults"` is the main signal that a competition is
finished. See [How competition state is derived](#how-competition-state-is-derived).

## Shared `CompetitionData` object

Every handler includes a `CompetitionData` block. How much it contains
depends on the handler. The leaderboard and competition handlers return all
of it. The tee times handler leaves out the settings. An upcoming
leaderboard returns only the basic fields.

| Field | Type | Notes |
| ----- | ---- | ----- |
| `Id` | number | Competition ID (= `Competition.id`) |
| `CustomerId`, `CustomerName` | number, string | `1`, `"Nordic Golf League"` |
| `Name` | string | |
| `Type` | `"StrokePlay"` \| `"MatchPlay"` | |
| `StartDate`, `EndDate` | date string | |
| `Logo` | URL | `cdn.golfbox.dk/...` |
| `IsFieldSelected` | bool | `false` until the field has been drawn |
| `Venue` | `{ Name, Address, Latitude, Longitude, ... }` | Usually only `Name` is set. **Can be missing**. Venue → `Competition.venue` |
| `Classes[]` | array | Class **setup**: `{ Id, Name, ShortName, MaxPlayers, ClassType, Cut, OrderOfMerits }` |
| `Classes[].Cut` | object | Cut **rules**: `{ Enabled, Limit, LimitType: "Players", AfterRound, ExcludeAmateurs, IncludeScore, LimitMethod }`. "Top `Limit` and ties after round `AfterRound`" (`CutInfo.js`, `cutUtils.mjs`) |
| `RoundSetup[]` | array | `{ Number, Name, StartDate, Class_RID, CourseStart_RID, IsHcpQualifying }`. In match play, `Name` gives the round labels ("Quarter Final", …) |
| `CourseColours[]` | array | `{ CourseID, CssName: "course-1", Name }` |
| `SignUpInformation` | object | Entry and payment windows |
| `ClassSetup` | object | Class rules, not used |
| `LivescoringSettings` | object | Display toggles, mostly `{ ShowOnPlayerList, ShowOnStartList, ShowOnLeaderboard }` per column. Only `ClassSettings` matters to us (below) |
| `LivescoringSettings.ClassSettings[]` | array | `{ ClassReferenceID, ClassName, StatusType, StatusText, ShowOOMRank, OOMRID, ... }` |
| `TimeZoneInfo`, `UtcOffsetString` | object, string | .NET `TimeZoneInfo` dump. `"(UTC+01:00)"` |
| `Status`, `MainCompetition`, `InterclubTournament`, `Sponsors` | | Always `null` in our data |

**`ClassSettings[0].StatusType` / `StatusText`.** When `StatusType === 4`,
the organizer has posted a status message. `StatusText` holds free text that
can include a YouTube link to the final-round highlights
(`getFinishedResult` in `CompetitionPage.js`). `StatusText` containing
"stableford" is also one way we detect the Stableford format
(`competitionFormat.mjs`).

---

## Leaderboard — `LeaderboardHandler/GetLeaderboard`

```
/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/{id}/language/2057/
```

This is the main feed. Top-level shape:

```jsonc
{
  "ScoringMethod": 0,
  "CompetitionData": { ... },
  "Classes": {
    "C3066464": {                       // one class per competition for us. Code takes Object.values(Classes)[0]
      "RefId": 3066464,
      "Name": "Professionals", "ShortName": "P",
      "Cut": { "IsPerformed": true, "Position": 49, "AfterRound": 2 }, // cut *state*, see below
      "OrderOfMerit": { "RefID": 157709, "HasOrderOfMeritResults": true, ... },
      "Leaderboard": {
        "ActiveRoundNumber": 3,         // current or last round. 0/undefined before start
        "IsScoringOpen": false,
        "RoundNames": ["R1", "R2", "R3"],
        "Entries": { "E27393779": { /* individual entry */ }, ... },  // stroke play
        "Teams":   { "T16343208": { /* team entry */ }, ... }         // team events, instead of Entries
      },
      "CourseHandicapAdjustments": { "C1419638": { CourseName, CourseParValues, CBARounds, CSSTees, ... } }
    }
  },
  "Courses": {
    "C1419638": {
      "RefId": 1419638, "Name": "Empordá Golf - Links Course", "MeasureUnit": "Meters",
      "Holes": {
        "H1": {
          "Number": 1, "Index": 9,       // stroke index
          "IdealTime": 17,
          "ParText": "71",               // course par, repeated on each hole
          "Tees": { "T<TeeGUID>": { "TeeID": "<GUID>", "Par": 4, "Length": 380 } }
        }
      }
    }
  },
  "CourseStarts": { "CS4699776": { CourseStartRID, CourseRID, IsActive, Status, ScoringInputMethod, HandicapAdjustment } },
  "CourseColours": { "<lowercase course name>": { "CourseID", "Name", "CssName" } },
  "Loaded": "20220228T185428"
}
```

The leaderboard has **two different `Cut` objects**:

- `CompetitionData.Classes[0].Cut` holds the cut **rules** (`Enabled`, `Limit`,
  `AfterRound`).
- `Classes.{C…}.Cut` holds the cut **result** (`IsPerformed`, `Position`,
  meaning how many players made it, and `AfterRound`).

In an **upcoming** competition the response is only
`{ CompetitionData, Loaded }`, with no `Classes`. Code must handle a missing
`Classes`. **Match play** competitions return no leaderboard entries; use
`GetMatchplay` instead.

### Individual leaderboard entry

`Classes.{C…}.Leaderboard.Entries.{E…}`:

| Field | Example | Notes |
| ----- | ------- | ----- |
| `MemberID` | `"47-4286"` | Stable player ID. **Join key to our `Player` table** |
| `RefID` | `27393779` | Entry ID (the same number as the `E…` key) |
| `FirstName`, `LastName` | `"John "`, `"Axelsen"` | Trim them |
| `ClubName`, `CompanyName` | | |
| `Nationality`, `Country` | `"DK"`, `"Denmark"` | ISO-2 code and English name |
| `Gender` | `1` | |
| `Picture` | URL \| `null` | Uploaded entry photo |
| `Number` | `125` | Entry or bib number |
| `PlayerStatus` | `0`/`1`/`2` | `1` = accepted into the field (see [Players](#players--playershandlergetplayers)) |
| `HCP` | `"-53000"` | **String**, ×10 000, negative = plus handicap |
| `HCPStatus`, `PHCP`, `TeamName`, `IsAnonymous`, `Wagr`, `OOMRank`, `ResultType` | | Not used |
| `Position.Actual` | `1` | Numeric rank. Ties get the same number. MC/WD players still get a number past the field |
| `Position.Calculated` | `"1"`, `"T2"`, `"MC"`, `"RTD"`, `"DQ"`, `"WD"`, `"DNS"` | Text to display. This is how we detect a missed cut or a withdrawal (`writeReport.mjs` `MISSED_CUT_STATUSES`) |
| `Position.ChangedPositions` | `{ Text: "4", Value: -4 }` | Movement since the previous round. `Text` is the unsigned size of the move, and the sign of `Value` gives the direction (not confirmed which sign means up). `Text: "-"` = no change |
| `Position.UsedDecisionMethod`, `DecisionHole` | | Tie-break info |
| `ScoringToPar.ToParText` / `ToParValue` | `"-13"` / `-130000` | **Live** total to par. This is what the leaderboard shows |
| `ScoringToPar.TodayText` / `TodayValue` | `"-4"` / `-40000` | Today's round to par. `""` / `10000000` when not playing today |
| `ScoringToPar.HoleText` | `"F(1)"`, `"F(10)"`, `"7(10)"`, `""` | Thru: `F` = finished, a number = holes played. In brackets: the starting hole (1 or 10). `""` before the player starts |
| `ScoringToPar.HoleValue` | `18`, `7` | Holes played. **Can be huge and negative** when not started, see [sentinels](#numbers-and-sentinel-values) |
| `ResultSum` | `{ ActualText: "201", ActualValue: 2010000, ToParText, ToParValue }` | Total strokes and to-par |
| `CompletedResultSum` | same shape | Total over **completed** rounds only |
| `OrderOfMeritResult` | `{ OrderOfMeritRefID, ResultText: "10404", ResultValue: 104041800 }` | OOM points earned in this event |
| `ScoreStats` | `{ EaglesOrBetter, Birdies, Pars, Bogeys, DoubleBogeysOrWorse }` | Whole-event totals |
| `ScoreAvg` / `ScoreAvgOther` | `{ Par3, Par4, Par5 }` | The player's average vs the field's average |
| `Rounds` | `{ R1: {...}, R2: {...} }` | See below. Only rounds that have started appear |

### Round object and hole scores

`Entry.Rounds.{R…}`:

| Field | Notes |
| ----- | ----- |
| `Number`, `RefID` | Round number and internal ID |
| `StartDateTime` | Tee time (local course time) |
| `StartHoleNumber` | `1` or `10` |
| `MatchNumber`, `StartListEntryRID` | Group number and start-list link |
| `CourseRefID`, `CourseName` | Joins to `Courses.C{CourseRefID}` and `CourseColours[].CourseID` |
| `TeeID` | GUID. Joins to `Courses.*.Holes.*.Tees.T{TeeID}` for par and length |
| `ClassRefID` | |
| `ScoringMethod`, `StrokeAllowance` | `0` |
| `ScoringStatus` | Seen: `0`, `30`, `50`, `70`. Meaning not mapped, so prefer `IsCompleted`/`IsActive` |
| `IsActive` | This is the round currently being played or shown |
| `IsCompleted` | The player has finished this round |
| `Holes` | `{ H1: { Number: 1 }, ... }`, the holes in the order played |
| `HoleScores` | Per-hole results, see below |
| `ResultSum` | `{ ActualText: "67", ActualValue: 670000, ToParText: "-4", ToParValue: -40000 }` |
| `ScoreStats`, `ScoreAvg`, `ScoreAvgOther` | Same as the entry level, but for this round only |

`HoleScores` uses keys `H1`…`H18` for individual holes, plus three **aggregate
keys with a different shape**:

```jsonc
"H1": {                                  // individual hole
  "Par": 4,
  "Score":  { "Text": "4", "Value": 4 },  // raw strokes
  "Result": { "ToParValue": 0, "ToParText": "Par", "ActualValue": 4, "ActualText": "4" },
  "IsCounting": true                      // team events: whether this ball counted
},
"H-OUT":   { "Par": 35, "Score": 32, "PickedUp": false, "Result": { "ToPar": "-3", "Actual": "32" } },
"H-IN":    { "Par": 36, "Score": 35, ... },
"H-TOTAL": { "Par": 71, "Score": 67, ... }
//          ^ Score is a plain number here, and Result uses ToPar/Actual (no Text/Value suffix)
```

Players who miss the cut have no round object for the rounds after it, and a
player who retires or is disqualified mid-round keeps that round with
`IsCompleted: false` and only the holes played. Summing `Score.Value` and
`Par` over `H1`…`H18` matches `ResultSum` and the entry's `ScoreStats`
(`src/seasonStats.mjs`).

Holes that haven't been played are missing or `null`. In unit-test fixtures
an aggregate can be `null` too (`cutUtils.test.mjs`).

### Team competitions (`Leaderboard.Teams`)

In team events (for example the Max Matthiessen Team Trophy) the leaderboard
has `Teams` and **no** `Entries` (fixture: `team.json`, code:
`getTeamEntries` in `CompetitionPage.js`, `writeReport.mjs`). Each team
`T…` has:

- `Name` (`"A Høst / C Jacobsen"`), `RefID`, `Country`, `CountryIsoCode`,
  `HCP` (a number here, not a string), `PHCP` (a string here!)
- `Position`, `ScoringToPar`, `ResultSum`, `CompletedResultSum`, with the
  same shapes as an individual entry
- `Entries: { E…: member }`: members with the player fields (`MemberID`,
  names, `ClubName`, `Nationality`, `Picture`, `HCP`, …) but **no scores**
- `Rounds.{R…}`: like an individual round, plus:
  - `Format` (`2`, `4`, …: the team format per round, for example
    foursomes or four-ball), `CountingResults`, `CountingResultMethod`
  - `HoleScores`: the team's score per hole. `IsCounting` / `PickedUp` mark
    which ball counted
  - `EntryRounds.{E…}`: each member's own round
    `{ EntryID, HoleScores, ResultSum, IsCounting, CourseRefID, ... }`
  - **No `Holes` map.** `getTeamEntries` builds one from the `HoleScores`
    keys

---

## Tee times — `TeeTimesHandler/GetTeeTimes`

```
/Handlers/TeeTimesHandler/GetTeeTimes/CompetitionId/{id}/language/2057/
```

```jsonc
{
  "CompetitionData": { ... },            // no settings blocks
  "ActiveRoundNumber": 3,                // 0 before any start list is published
  "ActiveStartlistId": 2403936,
  "Rounds": {
    "R1": {
      "Number": 1, "Name": "Round 1",
      "StartLists": {                    // one per course or starting tee
        "S2402467": {
          "Id": 2402467, "CourseID": 1419642, "CourseName": "...", "CourseStart_RID": 4699775,
          "StartTime": "20220218T085000", "GroupSizeType": 1, "ShowTeams": false,
          "RoundInfos": [{ "RoundNumber": 1, "RoundName": "Round 1", "ClassRID": 3066464 }],
          "Entries": [                   // ARRAY, one item per player, grouped by MatchNo
            {
              "MatchNo": 1, "OrderNo": 1,          // group number, order within the group
              "StartTime": "20220218T085000",
              "Hole": 1, "HoleName": null,         // starting hole
              "MemberID": "72-2074", "EntryId": 101297293, "EntryNumber": 183,
              "FirstName": "Sander ", "LastName": "Andreassen",
              "ClubName": "...", "Nationality": "NO", "Country": "Norway",
              "HCP": "-17000", "PHCP": 0, "Tee": "SYSTEM_WHITE",
              "CourseName": "...", "PlayerStatus": 1,
              "Team": "", "TeamID": "", "TeamPHCP": null,
              "Classes": [{ "ClassRID": 3066464, "Name": "Professionals", "ShortName": "P", "IsMain": true }]
            }
          ]
        }
      }
    }
  },
  "CourseNames": ["...", "..."],
  "CourseColours": { "<lowercase course name>": { CourseID, Name, CssName } },
  "HasCountryIsoCode": false,
  "Loaded": "..."
}
```

- Before the draw, `Rounds` is `{ "R0": ... }` and `ActiveRoundNumber` is `0`
  (`upcoming.json`).
- The number of keys in `Rounds` is the total number of rounds in the
  competition. We use it to decide whether the event is finished.
- The fixtures also contain `Entries[].Rounds`, `ResultSum` and
  `activeRoundNumber`. **GolfBox doesn't send these.** `CompetitionPage.js`
  (`getIndexedEntriesFromTimesData`) adds them to the objects after loading,
  and the fixtures were recorded after that. The same goes for
  `isFavorite` / `activeRoundNumber` on leaderboard entries.

## Players — `PlayersHandler/GetPlayers`

```
/Handlers/PlayersHandler/GetPlayers/CompetitionId/{id}/language/2057/
```

This is the entry list. We use it during the ~5 days before a competition
starts, while the leaderboard is still empty (`fetchPlayersFromEntriesList`
in `syncData.mjs`, `getIndexedEntriesFromPlayersData` in `CompetitionPage.js`).

```jsonc
{
  "CompetitionData": { "Venue": { "Name": "..." }, ... },
  "Classes": {
    "C…": {
      "Entries": {                       // read with Object.values()
        "E…": { "MemberID", "FirstName", "LastName", "ClubName", "Nationality", "PlayerStatus", ... }
      }
    }
  }
}
```

**`PlayerStatus`**: `1` = accepted into the field. Other values (`0`, `2`)
seem to be reserve-list or pending entries. Only `1` is shown or synced.

## Match play — `MatchplayHandler/GetMatchplay`

```
/Handlers/MatchplayHandler/GetMatchplay/CompetitionId/{id}/language/2057/
```

Only fetched when `CompetitionData.Type === "MatchPlay"`. There is no fixture
in the repo, so the shape below comes from `getMatchPlayRounds` /
`getMatchDisplay` in `CompetitionPage.js` and `fetchMatchplay` in
`writeReport.mjs`.

```jsonc
{
  "CompetitionData": { "RoundSetup": [{ "Number": 1, "Name": "Round of 16" }, ...], ... },
  "Matchplay": {
    "<class key>": {
      "NumberOfRounds": 4,               // the "real" rounds. Rounds after this are placement
                                         // or consolation rounds and should be ignored
      "IsCompleted": true,
      "Rounds": {
        "<round key>": {
          "Number": 1,
          "Matches": {
            "<match key>": {
              "MatchNo": 1, "OrderNo": 1,          // bracket order
              "StartTime": "20250612T081000",
              "IsBye": false,
              "HoleText": "F",                     // "F" = final; "HH:MM" or "-" = not started
                                                   // or pairing unknown; otherwise the hole the match stands through
              "Result": "3&2",                     // final margin: "3&2", "1 Hole", "19th"
              "Entries": [                         // ARRAY of 2. An entry can be a placeholder with no EntryId
                {
                  "EntryId": 123, "MemberID": "...", "FirstName": "...", "LastName": "...",
                  "ClubName": "...", "Nationality": "SE", "Country": "Sweden",
                  "IsLead": true,                  // winner (completed) or current leader (in progress)
                  "MatchResult": { "ActualText": "2UP" } // live status. Missing or empty = all square
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

## Order of Merit — `OrderOfMeritsHandler`

### `GetOrderOfMerit` (one OOM)

```
/Handlers/OrderOfMeritsHandler/GetOrderOfMerit/CustomerId/{customerId}/language/2057/OrderOfMeritID/{oomId}/
```

The season ranking (for example "Road to Europe 2026"). `oomId` comes from
`NEXT_PUBLIC_GOLFBOX_OOM_ID` and **changes every season** (look it up with
`node scripts/find-oom-id.mjs [year]`). There's no fixture.
`src/stories/mockData.js` (`orderOfMerit`) copies the shape:

```jsonc
{
  "OrderOfMeritData": { "Name": "Road to Europe 2026", ... },
  "Entries": {                            // missing early in the season: guard against it
    "E…": {
      "MemberID": "...",
      "FirstName": "...", "LastName": "...", "ClubName": "...", "Nationality": "SE",
      "Position": "T3",                   // display text: "1", "T3"
      "ActualPosition": 3,                // numeric, used for sorting
      "CalculatedResult": 45678.5,        // points. Round before display
      "Results": {                        // one per counted competition
        "R<competitionId>": { "CompetitionID": 3176088, "Position": "T5", "Result": 1234 }
                                          // Result 0 / Position "" = did not earn points
      }
    }
  }
}
```

`Position` → `Player.oomPosition`. Players missing from the OOM get `"-"`
(`fillOOM` in `syncData.mjs`).

### `GetOrderOfMerits` (all OOMs)

```
/Handlers/OrderOfMeritsHandler/GetOrderOfMerits/CustomerId/{customerId}/language/2057/
```

```jsonc
{ "OrderOfMeritData": { "<season key>": { "Entries": { "<key>": { "ID": 157709, "Name": "Road to Europe 2026", "Season": 2026 } } } } }
```

---

## How competition state is derived

GolfBox has no single "status" field, so the app combines several signals:

| State | Signal |
| ----- | ------ |
| Upcoming | Leaderboard has no `Classes`, and tee times have `ActiveRoundNumber: 0` / `Rounds.R0` |
| Field known | `PlayersHandler` entries with `PlayerStatus === 1` |
| Tee times out | `TeeTimes.Rounds.R{n}.StartLists` filled in |
| Started | `Leaderboard.ActiveRoundNumber >= 1` **and** some entry has `ScoringToPar.HoleValue > 0`. GolfBox sets round 1 as active before anyone tees off (`CutInfo.js`) |
| Player on course | Their `Rounds.R{n}.IsActive && !IsCompleted`, and `HoleText` isn't `F(...)` |
| Cut made | `Classes.{C…}.Cut.IsPerformed`, or `ActiveRoundNumber > Cut.AfterRound` |
| Finished | `GetCompetition.DefaultAction === "finalresults"` **and** `Leaderboard.ActiveRoundNumber >= Object.keys(TeeTimes.Rounds).length` (`isCompetitionFinished` in `CompetitionPage.js`, `fetchIsFinished` in `notifySubscribers.mjs`) |

---

## Fixtures

Real recorded responses, used by Storybook (`src/stories/Competition.stories.js`):

| File | Contains | Competition |
| ---- | -------- | ----------- |
| `src/stories/testData/finished.json` | `initialData` (leaderboard), `initialTimesData` (tee times) | GolfStar Winter Series I 2022, finished, 3 rounds, two courses |
| `src/stories/testData/ongoing.json` | same | ECCO Tour Spanish Masters 2022, in progress (leaderboard on round 2 of 3) |
| `src/stories/testData/upcoming.json` | same | Barncancerfonden Open 2022, before the draw |
| `src/stories/testData/team.json` | `initialData` with `Leaderboard.Teams` (trimmed: `CompetitionData` only has `Type`), minimal tee times | Max Matthiessen Team Trophy 2026 |

These files are 0.5–8 MB, so don't open them whole. Explore them with a
quick script instead, for example:

```bash
node -e "const d=require('./src/stories/testData/finished.json').initialData;
const e=Object.values(Object.values(d.Classes)[0].Leaderboard.Entries)[0];
console.log(JSON.stringify(e.Rounds.R1.HoleScores.H1, null, 2))"
```

`src/stories/mockData.js` has smaller hand-made versions of the leaderboard,
tee times and OOM shapes.

## Open questions

Things we haven't confirmed. Update this section when you find out.

- ~~Minified booleans.~~ Resolved 2026-10-04. Raw responses (no `?callback`)
  do contain `!0` / `!1`, byte for byte the same as the JSONP body, and they
  mean what they mean in JavaScript: `!0` is `true`, `!1` is `false`. Checked
  against `GetMatchplay` for competition 5403939: in all 63 completed matches
  the `"IsLead":!0` entry is the one that shows up in the next round.
  `parseJson.mjs` had the mapping inverted until then, so server-side
  booleans read before that date were flipped. The only server code that
  reads one is the match play part of `scripts/writeReport.mjs`
  (`IsLead` / `IsCompleted`), which swapped winner and loser.
- `ScoringStatus` values (`0`/`30`/`50`/`70`), `CourseStarts.*.Status`,
  `ClassSettings.StatusType` values other than `4`, and `PlayerStatus` values
  other than `1` are unmapped.
- Team round `Format` codes (`2`, `4`) are unmapped.
- The exact encoding behind negative `HoleValue` (it looks like a tee-time
  timestamp).
