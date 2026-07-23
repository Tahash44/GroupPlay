import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { spyService } from '../services/spyService';
import type { SessionPlayer } from '../types/spy.types';
import './VotingPage.css';

type Phase = 'loading' | 'error' | 'voting' | 'spy_guess' | 'result';
type WinnerSide = 'spy' | 'civilians';

export default function VotingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [votedPlayerName, setVotedPlayerName] = useState<string | null>(null);
  const [winnerSide, setWinnerSide] = useState<WinnerSide | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // منبع واحد برای اسم جاسوس — از players[].role میاد، صرف‌نظر از مسیر ورود به این فاز
  const spyPlayer = players.find(p => p.role === 'جاسوس') ?? null;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const detail = await spyService.getSessionDetail(id);
        if (cancelled) return;

        setPlayers(detail.players);

        if (detail.status === 'VOTING') {
          setPhase('voting');
        } else if (detail.status === 'SPY_GUESS') {
          setPhase('spy_guess');
        } else if (detail.status === 'FINISHED') {
          const foundSpy = detail.players.find(p => p.role === 'جاسوس');
          const spyWon = !!(foundSpy && detail.winner && detail.winner.includes(foundSpy.id));
          setWinnerSide(spyWon ? 'spy' : 'civilians');
          setPhase('result');
        } else {
          setError('این بازی هنوز آماده‌ی رأی‌گیری نیست.');
          setPhase('error');
        }
      } catch {
        if (!cancelled) {
          setError('گرفتن اطلاعات بازی با خطا مواجه شد. صفحه رو رفرش کن.');
          setPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmitVote = async () => {
    if (!id || selectedPlayerId === null || actionLoading) return;
    setActionLoading(true);
    try {
      const result = await spyService.submitVote(id, selectedPlayerId);
      setVotedPlayerName(result.voted_player);

      if (result.result === 'spy_caught') {
        setPhase('spy_guess');
      } else {
        setWinnerSide('spy');
        setPhase('result');
      }
    } catch {
      toast.error('ثبت رأی با خطا مواجه شد. دوباره تلاش کن.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSpyGuess = async (isCorrect: boolean) => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      const result = await spyService.submitSpyGuess(id, isCorrect);
      setWinnerSide(result.correct ? 'spy' : 'civilians');
      setPhase('result');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(
        status === 409
          ? 'این مرحله دیگه معتبر نیست. صفحه رو رفرش کن.'
          : 'ثبت نتیجه‌ی حدس با خطا مواجه شد.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const goHome = () => navigate('/dashboard');
  const playAgain = () => navigate('/games/spy/new');

  if (phase === 'loading') {
    return (
      <div className="voting-page voting-page-center">
        <p className="voting-status">در حال بارگذاری...</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="voting-page voting-page-center">
        <p className="voting-status voting-status-error">{error}</p>
      </div>
    );
  }

  if (phase === 'voting') {
    return (
      <div className="voting-page">
        <header className="voting-header">
          <button type="button" className="voting-icon-btn" onClick={goHome} aria-label="برگشت">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <h1 className="voting-brand">بازی‌گردان</h1>
          <span className="voting-icon-btn-spacer" />
        </header>

        <main className="voting-main">
          <h2 className="voting-title">رأی‌گیری</h2>
          <p className="voting-subtitle">به نظرتون جاسوس کیه؟</p>

          <div className="voting-players-list">
            {players.map(player => (
              <button
                key={player.id}
                type="button"
                className={`voting-player-item sketch-hover ${
                  selectedPlayerId === player.id ? 'voting-player-item-selected' : ''
                }`}
                onClick={() => setSelectedPlayerId(player.id)}
              >
                <span className="material-symbols-outlined">
                  {selectedPlayerId === player.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
                <span>{player.name}</span>
              </button>
            ))}
          </div>
        </main>

        <footer className="voting-footer">
          <button
            type="button"
            className="voting-submit-btn sketch-border"
            onClick={handleSubmitVote}
            disabled={selectedPlayerId === null || actionLoading}
          >
            {actionLoading ? 'در حال ثبت...' : 'ثبت رأی'}
          </button>
        </footer>
      </div>
    );
  }

  if (phase === 'spy_guess') {
    const displayName = spyPlayer?.name ?? votedPlayerName ?? 'نامشخص';

    return (
      <div className="voting-page">
        <header className="voting-header">
          <button type="button" className="voting-icon-btn" onClick={goHome} aria-label="برگشت">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <h1 className="voting-brand">بازی‌گردان</h1>
          <span className="voting-icon-btn-spacer" />
        </header>

        <main className="voting-main">
          <div className="voting-guess-heading-wrap">
            <h2 className="voting-guess-heading">جاسوس شناسایی شد!</h2>
          </div>
          <p className="voting-subtitle">حالا جاسوس باید مکان را حدس بزند.</p>

          <div className="voting-guess-card sketch-border">
            <p className="voting-guess-card-label">نتیجه رأی‌گیری نهایی</p>
            <div className="voting-guess-card-spy">
              <span className="material-symbols-outlined">person_search</span>
              <span>جاسوس: {displayName}</span>
            </div>
            <div className="voting-guess-card-divider" />
            <p className="voting-guess-card-hint">«کجا بودیم؟ فکر کن...»</p>
          </div>
        </main>

        <footer className="voting-footer voting-footer-double">
          <button
            type="button"
            className="voting-guess-correct-btn sketch-border"
            onClick={() => handleSpyGuess(true)}
            disabled={actionLoading}
          >
            <span className="material-symbols-outlined">check_circle</span>
            حدس درست بود
          </button>
          <button
            type="button"
            className="voting-guess-wrong-btn sketch-border"
            onClick={() => handleSpyGuess(false)}
            disabled={actionLoading}
          >
            <span className="material-symbols-outlined">cancel</span>
            حدس اشتباه بود
          </button>
        </footer>
      </div>
    );
  }

  // phase === 'result'
  const isSpyWinner = winnerSide === 'spy';
  const finalSpyName = spyPlayer?.name ?? votedPlayerName ?? 'نامشخص';
  const civilianPlayers = players.filter(p => p.id !== spyPlayer?.id);

  return (
    <div className="voting-page">
      <header className="voting-header">
        <div className="voting-header-spacer" />
        <h1 className="voting-brand">بازی‌گردان</h1>
        <div className="voting-header-spacer" />
      </header>

      <main className="voting-result-main">
        <div className="voting-result-title-wrap">
          <h1 className="voting-result-title">
            {isSpyWinner ? 'جاسوس پیروز شد!' : 'شهروندان پیروز شدند!'}
          </h1>
        </div>
        <p className="voting-result-subtitle">
          {isSpyWinner
            ? 'جاسوس تونست هویتش رو مخفی نگه داره یا مکان رو درست حدس بزنه.'
            : 'عملیات شناسایی جاسوس با موفقیت پایان یافت.'}
        </p>

        <div className="voting-result-illustration-card">
          <svg
            className={`voting-result-illustration ${isSpyWinner ? 'voting-result-illustration-spy' : ''}`}
            viewBox="0 0 200 200"
          >
            <path
              d="M70,60 L130,60 L125,120 Q100,140 75,120 Z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path
              d="M70,75 Q50,75 55,95 Q60,110 72,105"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <path
              d="M130,75 Q150,75 145,95 Q140,110 128,105"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <path
              d="M90,140 L110,140 M100,140 L100,160 M80,165 L120,165"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3"
            />
            {isSpyWinner ? (
              <path
                d="M75,95 L125,105 M125,95 L75,105"
                fill="none"
                stroke="#262626"
                strokeLinecap="round"
                strokeWidth="5"
              />
            ) : (
              <path
                d="M85,100 L95,115 L115,85"
                fill="none"
                stroke="#262626"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
              />
            )}
          </svg>

          <div className="voting-result-team-label">
            {isSpyWinner ? 'جاسوس' : `تیم شهروندان (${civilianPlayers.length} نفر)`}
            <div className="voting-result-chips">
              {isSpyWinner ? (
                <span className="voting-result-chip">{finalSpyName}</span>
              ) : (
                civilianPlayers.map(p => (
                  <span key={p.id} className="voting-result-chip">
                    {p.name}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="voting-result-report-card sketch-border">
          <h3 className="voting-result-report-title">گزارش نهایی</h3>
          <p className="voting-result-report-text">
            {isSpyWinner
              ? `جاسوس بازی (${finalSpyName}) شناسایی نشد یا مکان را درست حدس زد.`
              : `جاسوس بازی (${finalSpyName}) توسط شهروندان شناسایی شد.`}
          </p>
        </div>

        <div className="voting-result-actions">
          <button type="button" className="voting-result-replay-btn sketch-border" onClick={playAgain}>
            <span>بازی مجدد</span>
            <span className="material-symbols-outlined">replay</span>
          </button>
          <button type="button" className="voting-result-home-btn sketch-border" onClick={goHome}>
            <span>خانه</span>
            <span className="material-symbols-outlined">home</span>
          </button>
        </div>
      </main>
    </div>
  );
}