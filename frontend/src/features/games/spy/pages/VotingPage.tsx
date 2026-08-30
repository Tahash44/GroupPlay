import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { spyService } from '../services/spyService';
import type { SessionPlayer } from '../types/spy.types';
import Icon from '../../../../shared/components/Icon/Icon';
import { Button, PageHeader, StatePanel } from '../../../../shared/components/ui';
import { useAuth } from '../../../../shared/context/AuthContext';
import { useGuest } from '../../../../shared/context/GuestContext';
import AuthPromptModal from '../../../../shared/components/auth/AuthPromptModal';
import './VotingPage.css';

type Phase = 'loading' | 'error' | 'voting' | 'spy_guess' | 'result';
type WinnerSide = 'spy' | 'civilians';
type ResultReason = 'wrong_vote' | 'correct_guess' | 'wrong_guess' | 'finished';

function VotingHeader({ onExit, showExit = true }: { onExit: () => void; showExit?: boolean }) {
  return (
    <header className="voting-header">
      <div className="voting-header-brand">
        {showExit && (
          <button type="button" className="voting-icon-btn" onClick={onExit} aria-label="برگشت">
            <Icon name="arrow_forward" />
          </button>
        )}
        <button type="button" className="voting-brand" onClick={onExit} aria-label="بازگشت به صفحهٔ بازی‌ها">
          بازی‌گردان
        </button>
      </div>
      <details className="voting-help">
        <summary className="voting-icon-btn" aria-label="راهنمای این مرحله"><Icon name="help" /></summary>
        <div className="voting-help__popover">در رأی‌گیری یک نفر را انتخاب و رأی را ثبت کنید. در مرحلهٔ حدس مکان، درست یا اشتباه بودن پاسخ جاسوس را مشخص کنید</div>
      </details>
    </header>
  );
}

export default function VotingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearActiveGame } = useGuest();

  const [phase, setPhase] = useState<Phase>('loading');
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [spyCount, setSpyCount] = useState(1);
  const [votedPlayerName, setVotedPlayerName] = useState<string | null>(null);
  const [winnerSide, setWinnerSide] = useState<WinnerSide | null>(null);
  const [resultReason, setResultReason] = useState<ResultReason>('finished');
  const [gameLocation, setGameLocation] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // نقش‌ها فقط پس از پایان بازی از قرارداد جزئیات نشست دریافت می‌شوند.
  const spyPlayers = players.filter(player => player.role === 'جاسوس');

  useEffect(() => {
    if (phase === 'result' && !user) {
      clearActiveGame();
      setShowAuthPrompt(true);
    }
  }, [phase, user, clearActiveGame]);

  const hydrateFinishedDetail = async (fallbackWinner: WinnerSide) => {
    if (!id) return;
    const detail = await spyService.getSessionDetail(id);
    setPlayers(detail.players);
    setGameLocation(detail.location);
    setWinnerSide(detail.winner_side ?? fallbackWinner);
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const detail = await spyService.getSessionDetail(id);
        if (cancelled) return;

        setPlayers(detail.players);
        setSpyCount(detail.spy_count ?? 1);
        setGameLocation(detail.location);

        if (detail.status === 'VOTING') {
          setPhase('voting');
        } else if (detail.status === 'SPY_GUESS') {
          setPhase('spy_guess');
        } else if (detail.status === 'FINISHED') {
          setWinnerSide(detail.winner_side ?? 'civilians');
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
    if (!id || selectedPlayerIds.length !== spyCount || actionLoading) return;
    setActionLoading(true);
    try {
      const result = await spyService.submitVote(id, selectedPlayerIds);
      setVotedPlayerName(result.voted_player);

      if (result.result === 'spy_caught') {
        setPhase('spy_guess');
      } else {
        setResultReason('wrong_vote');
        await hydrateFinishedDetail('spy');
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
      setResultReason(result.correct ? 'correct_guess' : 'wrong_guess');
      await hydrateFinishedDetail(result.correct ? 'spy' : 'civilians');
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

  const goHome = () => {
    if (window.confirm('مطمئنی می‌خواهی از بازی خارج شوی؟')) navigate('/dashboard');
  };
  const goHomeDirect = () => navigate('/dashboard');
  const playAgain = () => navigate('/games/spy/new');
  const togglePlayer = (playerId: number) => {
    setSelectedPlayerIds(current => {
      if (current.includes(playerId)) return current.filter(item => item !== playerId);
      if (current.length >= spyCount) return current;
      return [...current, playerId];
    });
  };

  if (phase === 'loading') {
    return (
      <div className="voting-page voting-page-center">
        <StatePanel title="در حال دریافت وضعیت بازی" loading />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="voting-page voting-page-center">
        <StatePanel title={error ?? 'خطای غیرمنتظره'} tone="error" action={<Button onClick={() => navigate(0)}>تلاش دوباره</Button>} />
      </div>
    );
  }

  if (phase === 'voting') {
    return (
      <div className="voting-page">
        <VotingHeader onExit={goHome} />

        <main className="voting-main">
          <h2 className="voting-title">رأی‌گیری</h2>
          <p className="voting-subtitle">
            {spyCount === 1 ? 'به نظرتان جاسوس کیست؟' : `دقیقاً ${new Intl.NumberFormat('fa-IR').format(spyCount)} جاسوس را انتخاب کنید`}
          </p>

          <div className="voting-players-list">
            {players.map(player => (
              <button
                key={player.id}
                type="button"
                className={`voting-player-item sketch-hover ${
                  selectedPlayerIds.includes(player.id) ? 'voting-player-item-selected' : ''
                }`}
                onClick={() => togglePlayer(player.id)}
                aria-pressed={selectedPlayerIds.includes(player.id)}
              >
                <Icon name={selectedPlayerIds.includes(player.id) ? 'check_circle' : 'radio_button_unchecked'} />
                <span dir="auto">{player.name}</span>
              </button>
            ))}
          </div>
        </main>

        <footer className="voting-footer">
          <button
            type="button"
            className="voting-submit-btn sketch-border"
            onClick={handleSubmitVote}
            disabled={selectedPlayerIds.length !== spyCount || actionLoading}
          >
            {actionLoading ? 'در حال ثبت...' : 'ثبت رأی'}
          </button>
        </footer>
      </div>
    );
  }

  if (phase === 'spy_guess') {
    const displayName = spyPlayers.length > 0
      ? spyPlayers.map(player => player.name).join('، ')
      : votedPlayerName ?? 'نامشخص';

    return (
      <div className="voting-page">
        <VotingHeader onExit={goHome} />

        <main className="voting-main">
          <div className="voting-guess-heading-wrap">
            <h2 className="voting-guess-heading">جاسوس شناسایی شد!</h2>
          </div>
          <p className="voting-subtitle">حالا جاسوس باید مکان را حدس بزند.</p>

          <div className="voting-guess-card sketch-border">
            <p className="voting-guess-card-label">نتیجه رأی‌گیری نهایی</p>
            <div className="voting-guess-card-spy">
              <Icon name="person_search" />
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
            <Icon name="check_circle" />
            حدس درست بود
          </button>
          <button
            type="button"
            className="voting-guess-wrong-btn sketch-border"
            onClick={() => handleSpyGuess(false)}
            disabled={actionLoading}
          >
            <Icon name="cancel" />
            حدس اشتباه بود
          </button>
        </footer>
      </div>
    );
  }

  // phase === 'result'
  const isSpyWinner = winnerSide === 'spy';
  const spyPlayerIds = new Set(spyPlayers.map(player => player.id));
  const resultReasonText = resultReason === 'wrong_vote'
    ? 'بازیکنان نتوانستند همهٔ جاسوس‌ها را درست شناسایی کنند.'
    : resultReason === 'correct_guess'
      ? 'جاسوس مکان بازی را درست حدس زد.'
      : resultReason === 'wrong_guess'
        ? 'جاسوس نتوانست مکان بازی را درست حدس بزند.'
        : isSpyWinner
          ? 'جاسوس‌ها با مخفی نگه‌داشتن هویت یا حدس درست مکان برنده شدند.'
          : 'شهروندان جاسوس‌ها را شناسایی کردند و از مکان بازی محافظت شد.';

  return (
    <div className="voting-page">
      <VotingHeader onExit={goHomeDirect} showExit={false} />

      <main className="voting-result-main">
        <PageHeader title="نتیجه بازی" subtitle="نتیجه و نقش بازیکنان این دور" />

        <section className="voting-result-summary-card sketch-border" aria-labelledby="game-result-title">
          <div className="voting-result-summary-top">
            <div>
              <h2 id="game-result-title" className="voting-result-game-title">بازی جاسوس</h2>
              <p className="voting-result-game-status">این دور به پایان رسید</p>
            </div>
            {gameLocation && <span className="voting-result-location-chip" dir="auto">{gameLocation}</span>}
          </div>

          <div className="voting-result-final-row">
            <Icon className="voting-result-final-icon" name={isSpyWinner ? 'visibility_off' : 'check_circle'} />
            <div>
              <p className="voting-result-final-label">نتیجه نهایی</p>
              <p className="voting-result-final-value">
                برندهٔ بازی
                {' '}
                {isSpyWinner ? 'جاسوس‌ها' : 'شهروندان'}
              </p>
              <p className="voting-result-final-reason">{resultReasonText}</p>
            </div>
          </div>
        </section>

        <div className="voting-result-stats">
          <div className="voting-result-stat-card sketch-border">
            <Icon name="visibility_off" />
            <p className="voting-result-stat-label">جاسوس‌ها</p>
            <p className="voting-result-stat-value">{new Intl.NumberFormat('fa-IR').format(spyPlayers.length)} نفر</p>
          </div>
          <div className="voting-result-stat-card sketch-border">
            <Icon name="group" />
            <p className="voting-result-stat-label">بازیکنان</p>
            <p className="voting-result-stat-value">{new Intl.NumberFormat('fa-IR').format(players.length)} نفر</p>
          </div>
        </div>

        <section className="voting-result-roster" aria-labelledby="players-heading">
          <h2 id="players-heading" className="voting-result-players-title">نقش بازیکنان</h2>

          <ul className="voting-result-player-list">
            {players.map((player, index) => {
              const isSpy = spyPlayerIds.has(player.id);
              return (
                <li key={player.id} className={`voting-result-player sketch-border ${isSpy ? 'voting-result-player-spy' : ''}`}>
                  <div className="voting-result-player-copy">
                    <span className="voting-result-player-index">{new Intl.NumberFormat('fa-IR').format(index + 1)}</span>
                    <span className="voting-result-player-name" dir="auto">{player.name}</span>
                  </div>
                  <div className="voting-result-role">
                    <span>{isSpy ? 'جاسوس' : 'شهروند'}</span>
                    <Icon name={isSpy ? 'visibility_off' : 'person'} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="voting-result-actions">
          <button type="button" className="voting-result-replay-btn sketch-border" onClick={playAgain}>
            <span>بازی مجدد</span>
            <Icon name="replay" />
          </button>
          <button type="button" className="voting-result-home-btn sketch-border" onClick={goHomeDirect}>
            <span>خانه</span>
            <Icon name="home" />
          </button>
        </div>
      </main>
      {showAuthPrompt && <AuthPromptModal variant="post-result" onClose={() => setShowAuthPrompt(false)} />}
    </div>
  );
}
