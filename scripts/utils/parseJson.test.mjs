import { describe, expect, it } from 'vitest';

import parseJson from './parseJson.mjs';

describe('parseJson', () => {
  it('parses plain JSON', () => {
    expect(parseJson('{"Id":1,"Name":"SM Match","Done":true}')).toEqual({
      Id: 1,
      Name: 'SM Match',
      Done: true,
    });
  });

  it('maps minified booleans the way JavaScript evaluates them', () => {
    // !0 === true and !1 === false
    expect(parseJson('{"IsLead":!0,"IsBye":!1}')).toEqual({
      IsLead: true,
      IsBye: false,
    });
  });

  it('picks the match play winner from IsLead', () => {
    // Trimmed from MatchplayHandler/GetMatchplay for competition 5403939
    const raw =
      '{"Result":"3&1","IsFinal":!0,"IsConsolationMatch":!1,"Entries":[' +
      '{"LastName":"Syr","IsLead":!0},{"LastName":"Lilliedahl","IsLead":!1}]}';
    const match = parseJson(raw);
    expect(match.Entries.find(e => e.IsLead).LastName).toBe('Syr');
    expect(match.Entries.find(e => !e.IsLead).LastName).toBe('Lilliedahl');
  });

  it('handles minified booleans inside arrays', () => {
    expect(parseJson('{"Flags":[!0,!1]}')).toEqual({ Flags: [true, false] });
  });

  it('leaves string values alone', () => {
    expect(parseJson('{"Name":"Go:!0","Quote":"a \\" :!1"}')).toEqual({
      Name: 'Go:!0',
      Quote: 'a " :!1',
    });
  });
});
