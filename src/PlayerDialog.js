import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import FlagIcon from './FlagIcon';
import PlayerPhoto from './PlayerPhoto';
import fixParValue from './fixParValue';
import generateSlug from './generateSlug.mjs';

function getRounds(entry) {
  if (!entry.Rounds) return [];
  return Object.keys(entry.Rounds)
    .map(key => entry.Rounds[key])
    .reverse();
}

function getToParClass(score) {
  if (!score) return 'unknown';
  if (score.Score.Value === 1) return 'hio';
  if (score.Score.Value < score.Par - 1) return 'eagle';
  if (score.Score.Value < score.Par) return 'birdie';
  if (score.Score.Value > score.Par + 1) return 'bogey-plus';
  if (score.Score.Value > score.Par) return 'bogey';
  return 'on-par';
}

function calcHalfTotals(holeKeys, holeScores) {
  let par = 0;
  let score = 0;
  let hasScore = false;
  for (const key of holeKeys) {
    const s = holeScores?.[key];
    if (s?.Par) par += s.Par;
    if (s?.Score?.Value > 0) {
      score += s.Score.Value;
      hasScore = true;
    }
  }
  return { par: par || null, score: hasScore ? score : null };
}

function ScorecardHalf({ holeKeys, holeScores, totals = [] }) {
  return (
    <div className="player-round-scorecard">
      <div>
        <div className="player-round-scorecard-label">Hole</div>
        <div className="player-round-scorecard-label">Par</div>
        <div className="player-round-scorecard-label">Result</div>
      </div>
      {holeKeys.map((holeKey, i) => {
        const score = holeScores?.[holeKey];
        const isLast = i === holeKeys.length - 1;
        return (
          <div
            key={holeKey}
            className={isLast ? 'player-round-scorecard-hole-last' : undefined}
          >
            <div className="player-round-scorecard-val">
              {holeKey.replace(/^H-?/, '')}
            </div>
            <div className="player-round-scorecard-val">{score?.Par}</div>
            <div
              className={`player-round-scorecard-val round-score ${getToParClass(
                score,
              )}`}
            >
              {score?.Score.Value > 0 ? score.Score.Value : null}
            </div>
          </div>
        );
      })}
      {totals.map(({ label, par, score }, i) =>
        label ? (
          <div key={label} className="player-round-scorecard-total">
            <div className="player-round-scorecard-label">{label}</div>
            <div className="player-round-scorecard-val">{par ?? ''}</div>
            <div
              className={`player-round-scorecard-val${
                score !== null && par !== null && score < par
                  ? ' under-par'
                  : ''
              }`}
            >
              {score ?? ''}
            </div>
          </div>
        ) : (
          <div key={i} />
        ),
      )}
    </div>
  );
}

function DialogRound({ round, colors }) {
  if (!round.Holes || !round.HoleScores) return null;

  const color = Object.values(colors || {}).find(
    c => c.CourseID === round.CourseRefID,
  );
  const courseNameClasses = ['player-round-course'];
  if (color) courseNameClasses.push(color.CssName);

  const holeKeys = Object.keys(round.Holes).sort(
    (a, b) =>
      parseInt(a.replace(/^H-?/, ''), 10) - parseInt(b.replace(/^H-?/, ''), 10),
  );
  const front9 = holeKeys.filter(k => parseInt(k.replace(/^H-?/, ''), 10) <= 9);
  const back9 = holeKeys.filter(k => parseInt(k.replace(/^H-?/, ''), 10) > 9);

  const frontTotals = calcHalfTotals(front9, round.HoleScores);
  const backTotals = calcHalfTotals(back9, round.HoleScores);
  const totalPar = (frontTotals.par ?? 0) + (backTotals.par ?? 0) || null;
  const totalScore =
    frontTotals.score !== null && backTotals.score !== null
      ? frontTotals.score + backTotals.score
      : frontTotals.score ?? backTotals.score;

  return (
    <div className="player-round page-margin">
      <div className="player-round-number">
        <span>Round {round.Number}</span>
        {round.CourseName && (
          <span className={courseNameClasses.join(' ')}>
            {round.CourseName}
          </span>
        )}
      </div>
      <ScorecardHalf
        holeKeys={front9}
        holeScores={round.HoleScores}
        totals={[
          { label: 'Out', par: frontTotals.par, score: frontTotals.score },
          { label: null },
        ]}
      />
      {back9.length > 0 && (
        <ScorecardHalf
          holeKeys={back9}
          holeScores={round.HoleScores}
          totals={[
            { label: 'In', par: backTotals.par, score: backTotals.score },
            { label: 'Total', par: totalPar, score: totalScore },
          ]}
        />
      )}
    </div>
  );
}

export default function PlayerDialog({ entry, competition, data, onClose }) {
  const dialogRef = useRef(null);
  const mainRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/t/${competition.slug}?player=${generateSlug(entry)}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // user cancelled or share failed — ignore
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [entry, competition.slug]);

  const handleClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open) return;
    dialog.classList.add('closing');
    dialog.addEventListener(
      'animationend',
      () => {
        dialog.classList.remove('closing');
        dialog.close();
      },
      { once: true },
    );
  }, []);

  // Open dialog when entry is set; scroll main back to top on each new entry
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (entry && !dialog.open) {
      dialog.showModal();
    }
    if (entry && mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [entry]);

  // Intercept ESC so it also animates
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleCancel(e) {
      e.preventDefault();
      handleClose();
    }
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [handleClose]);

  // Swipe to dismiss on mobile (right swipe)
  useEffect(() => {
    if (!entry) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let swiping = false;
    let swipeConfirmed = false;

    function onTouchStart(e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      currentX = startX;
      swiping = true;
      swipeConfirmed = false;
      dialog.style.transition = 'none';
      dialog.style.transform = '';
    }

    function onTouchMove(e) {
      if (!swiping) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (!swipeConfirmed) {
        if (Math.abs(dy) > Math.abs(dx)) {
          swiping = false; // vertical scroll wins
          dialog.style.transition = '';
          return;
        }
        if (Math.abs(dx) > 8) {
          swipeConfirmed = true;
        }
      }

      if (swipeConfirmed) {
        e.preventDefault();
        currentX = e.touches[0].clientX;
        const x = Math.max(0, currentX - startX);
        dialog.style.transform = `translateX(${x}px)`;
      }
    }

    function onTouchEnd() {
      if (!swiping) return;
      swiping = false;
      const dx = currentX - startX;

      if (swipeConfirmed && dx > 80) {
        // Animate out from current drag position (don't reset to 0 first)
        dialog.style.transition = 'transform 220ms ease-in';
        requestAnimationFrame(() => {
          dialog.style.transform = `translateX(${window.innerWidth}px)`;
          let closed = false;
          function doClose() {
            if (closed) return;
            closed = true;
            dialog.style.transform = '';
            dialog.style.transition = '';
            dialog.close();
          }
          function onTransitionEnd(e) {
            if (e.propertyName === 'transform') {
              dialog.removeEventListener('transitionend', onTransitionEnd);
              doClose();
            }
          }
          dialog.addEventListener('transitionend', onTransitionEnd);
          // Fallback in case transitionend never fires
          setTimeout(doClose, 300);
        });
      } else {
        // Snap back with a spring feel
        dialog.style.transition =
          'transform 300ms cubic-bezier(0.34, 1.2, 0.64, 1)';
        dialog.style.transform = '';
        dialog.addEventListener(
          'transitionend',
          () => {
            dialog.style.transition = '';
          },
          { once: true },
        );
      }
    }

    dialog.addEventListener('touchstart', onTouchStart, { passive: true });
    dialog.addEventListener('touchmove', onTouchMove, { passive: false });
    dialog.addEventListener('touchend', onTouchEnd);

    return () => {
      dialog.removeEventListener('touchstart', onTouchStart);
      dialog.removeEventListener('touchmove', onTouchMove);
      dialog.removeEventListener('touchend', onTouchEnd);
    };
  }, [entry, handleClose]);

  // Close on backdrop click
  function handleDialogClick(e) {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  }

  const rounds = entry ? getRounds(entry) : [];

  return (
    <dialog
      ref={dialogRef}
      className="player-dialog"
      onClick={handleDialogClick}
      onClose={onClose}
    >
      <div className="player-dialog-inner">
        <div className="player-dialog-header">
          <button
            type="button"
            className="player-dialog-back"
            onClick={handleClose}
            aria-label="Back"
          >
            ← {competition.name}
          </button>
          <h3 className="player-dialog-title">{competition.name}</h3>
          <button
            type="button"
            className="player-dialog-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="player-dialog-main" ref={mainRef}>
          {entry && (
            <div className="player-profile">
              <div className="player-profile-top page-margin">
                <PlayerPhoto player={entry} />
                <div>
                  <b>Player</b>
                  <Link
                    href={`/${generateSlug(entry)}`}
                    className="player-profile-name"
                    onClick={handleClose}
                  >
                    {entry.FirstName} {entry.LastName}
                  </Link>
                  <div className="player-profile-club">
                    <FlagIcon nationality={entry.Nationality} />
                    <span>{entry.ClubName}</span>
                  </div>
                  <div className="player-profile-actions">
                    <Link
                      href={`/${generateSlug(entry)}`}
                      className="icon-button"
                      onClick={handleClose}
                    >
                      View player profile
                    </Link>
                  </div>
                </div>
                {entry.ResultSum && (
                  <>
                    <span className="player-profile-position">
                      <b>Pos</b>
                      <span>{entry.Position?.Calculated}</span>
                    </span>
                    <span
                      className={`player-profile-topar${
                        entry.ResultSum.ToParValue < 0 ? ' under-par' : ''
                      }`}
                    >
                      <b>Score</b>
                      <span>{fixParValue(entry.ResultSum.ToParText)}</span>
                    </span>
                  </>
                )}
              </div>
              <div className="player-profile-share page-margin">
                <button
                  type="button"
                  className="player-dialog-share"
                  onClick={handleShare}
                  aria-label="Share scorecard"
                >
                  {copied ? (
                    '✓'
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.58582L18.2071 8.79292L16.7929 10.2071L13 6.41424V16H11V6.41424L7.20711 10.2071L5.79289 8.79292L12 2.58582ZM3 18V14H5V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V14H21V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18Z"></path></svg>
                  )}
                  {copied ? 'Copied!' : 'Share scorecard'}
                </button>
              </div>
              <div className="player-profile-rounds">
                {rounds.map(round => (
                  <DialogRound
                    key={round.StartDateTime}
                    round={round}
                    colors={data?.CourseColours}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
