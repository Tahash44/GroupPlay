import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { spyService } from '../services/spyService';
import type { TimerStatus } from '../types/spy.types';
import Icon from '../../../../shared/components/Icon/Icon';
import { Button, StatePanel } from '../../../../shared/components/ui';
import SpyAdaptiveMusic from '../audio/SpyAdaptiveMusic';
import { getAudioSettings, saveAudioSettings } from '../../../settings/audioSettings';
import './InGamePage.css';

const POLL_INTERVAL_MS = 2000;
const CIRCUMFERENCE = 2 * Math.PI * 45; // 282.74

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function InGamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [timesUp, setTimesUp] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(() => getAudioSettings().muted);
  const toggleMute = () => {
    const settings = getAudioSettings();
    const muted = !settings.muted;
    saveAudioSettings({ ...settings, muted });
    setIsMuted(muted);
  };
  const confirmExit = () => {
    if (window.confirm('مطمئنی می‌خواهی از بازی خارج شوی؟ روند فعلی بازی متوقف می‌شود.')) navigate('/dashboard');
  };

  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const applyStatus = useCallback((status: TimerStatus) => {
    setTimerDuration(status.timer_duration);
    setRemainingSeconds(status.remaining_time);
    setIsRunning(status.is_running);
    if (status.remaining_time <= 0) {
      setTimesUp(true);
    }
  }, []);

  const loadGame = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const status = await spyService.getTimer(id);
      applyStatus(status);
    } catch {
      setError('گرفتن اطلاعات بازی با خطا مواجه شد');
    } finally {
      setLoading(false);
    }
  }, [id, applyStatus]);

  // گرفتن وضعیت اولیه‌ی تایمر + لیست بازیکن‌ها
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    spyService.getTimer(id)
      .then(status => {
        if (cancelled) return;
        applyStatus(status);
      })
      .catch(() => {
        if (!cancelled) setError('گرفتن اطلاعات بازی با خطا مواجه شد');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, applyStatus]);

  // پولینگ سرور هر ۲ ثانیه (سرور همیشه source of truth هست)
  useEffect(() => {
    if (!id || loading || error || timesUp) return;

    pollRef.current = window.setInterval(async () => {
      try {
        const status = await spyService.getTimer(id);
        applyStatus(status);
      } catch {
        // خطای موقت پولینگ نادیده گرفته میشه؛ تلاش بعدی خودکار انجام میشه
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [id, loading, error, timesUp, applyStatus]);

  // شمارش معکوس محلی و نرم بین دو پولینگ
  useEffect(() => {
    if (loading || error || timesUp || !isRunning) return;

    tickRef.current = window.setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev === null) return prev;
        const next = prev - 1;
        if (next <= 0) {
          setTimesUp(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [loading, error, timesUp, isRunning]);

  const handleToggle = async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      const result = isRunning
        ? await spyService.pauseTimer(id)
        : await spyService.resumeTimer(id);
      setTimerDuration(result.timer_duration);
      setRemainingSeconds(result.remaining_time);
      setIsRunning(result.is_running);
    } catch {
      toast.error(isRunning ? 'توقف تایمر با خطا مواجه شد.' : 'ادامه‌ی تایمر با خطا مواجه شد.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmStop = async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      await spyService.stopTimer(id);
      navigate(`/games/spy/sessions/${id}/vote`);
    } catch {
      toast.error('پایان زودهنگام بازی با خطا مواجه شد.');
      setActionLoading(false);
      setShowStopConfirm(false);
    }
  };

  const handleSpyEarlyGuess = async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      await spyService.startSpyGuess(id);
      navigate(`/games/spy/sessions/${id}/vote`);
    } catch {
      toast.error('ثبت درخواست حدس زودهنگام با خطا مواجه شد.');
      setActionLoading(false);
    }
  };

  const handleGoToVoting = async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      await spyService.stopTimer(id);
      navigate(`/games/spy/sessions/${id}/vote`);
    } catch {
      toast.error('ورود به رأی‌گیری با خطا مواجه شد. دوباره تلاش کن.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ingame-page ingame-page-center">
        <StatePanel title="در حال دریافت وضعیت بازی" loading />
      </div>
    );
  }

  if (error || remainingSeconds === null || timerDuration === null) {
    return (
      <div className="ingame-page ingame-page-center">
        <StatePanel title={error ?? 'خطای غیرمنتظره'} tone="error" action={<Button onClick={loadGame}>تلاش دوباره</Button>} />
      </div>
    );
  }

  const progress = Math.min(1, Math.max(0, remainingSeconds / timerDuration));
  const dashOffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  return (
    <div className={`ingame-page ${!isRunning && !timesUp ? 'ingame-page-paused' : ''}`}>
      <SpyAdaptiveMusic
        remainingSeconds={remainingSeconds}
        durationSeconds={timerDuration}
        isRunning={isRunning}
        timesUp={timesUp}
      />
      <header className="ingame-header">
        <div className="ingame-header-brand">
          <button type="button" className="ingame-icon-btn" onClick={confirmExit} aria-label="بازگشت به فهرست بازی‌ها">
            <Icon name="arrow_forward" />
          </button>
          <strong className="ingame-brand">بازی‌گردان</strong>
        </div>
        <details className="ingame-help">
          <summary className="ingame-icon-btn" aria-label="راهنمای بازی"><Icon name="help" /></summary>
          <div className="ingame-help__popover">تا پایان زمان دربارهٔ مکان سؤال بپرسید. هر زمان آماده بودید وارد رأی‌گیری شوید. اگر جاسوس مکان را فهمید، گزینهٔ حدس مکان را انتخاب کنید</div>
        </details>
      </header>

      <main className="ingame-main">
        <button type="button" className={`ingame-sound-btn${isMuted ? ' ingame-sound-btn--muted' : ''}`} onClick={toggleMute} aria-pressed={isMuted} aria-label={isMuted ? 'فعال کردن صدا' : 'قطع صدا'} title={isMuted ? 'فعال کردن صدا' : 'قطع صدا'}>
          <Icon name={isMuted ? 'volume_off' : 'volume_up'} />
        </button>
        <div
          className="ingame-timer-wrap"
          role="progressbar"
          aria-label="زمان باقی‌مانده"
          aria-valuemin={0}
          aria-valuemax={timerDuration}
          aria-valuenow={remainingSeconds}
          aria-valuetext={formatTime(remainingSeconds)}
        >
          <svg className="ingame-timer-ring" viewBox="0 0 100 100">
            <circle className="ingame-timer-ring-bg" cx="50" cy="50" r="45" />
            <circle
              className="ingame-timer-ring-progress"
              cx="50"
              cy="50"
              r="45"
              style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: dashOffset }}
            />
          </svg>
          <div className={`ingame-timer-display ${isRunning && remainingSeconds <= 30 ? 'ingame-timer-pulse' : ''}`}>
            {formatTime(remainingSeconds)}
          </div>
        </div>

        <div className="ingame-controls">
          <button
            type="button"
            className={`ingame-toggle-btn sketch-border ${
              isRunning ? 'ingame-toggle-btn-running' : 'ingame-toggle-btn-paused'
            }`}
            onClick={handleToggle}
            disabled={actionLoading}
          >
            <Icon name={isRunning ? 'pause' : 'play_arrow'} />
            <span>{isRunning ? 'توقف موقت' : 'ادامه بازی'}</span>
          </button>

          <button
            type="button"
            className="ingame-early-stop-btn"
            onClick={() => setShowStopConfirm(true)}
            disabled={actionLoading}
          >
            <Icon name="how_to_reg" />
            <span className="ingame-early-stop-label">
              <span>رأی‌گیری</span>
              <span className="ingame-early-stop-sub">پایان زودهنگام</span>
            </span>
          </button>

          <button
            type="button"
            className="ingame-spy-guess-btn sketch-border"
            onClick={handleSpyEarlyGuess}
            disabled={actionLoading}
          >
            <Icon name="person_search" />
            <span>جاسوس مکان رو حدس می‌زنه</span>
          </button>
        </div>
      </main>

      {showStopConfirm && (
        <div className="ingame-overlay" role="dialog" aria-modal="true">
          <div className="ingame-modal sketch-border">
            <p className="ingame-modal-text">مطمئنید می‌خواید بازی رو زودتر تموم کنید؟</p>
            <div className="ingame-modal-actions">
              <button
                type="button"
                className="ingame-modal-cancel"
                onClick={() => setShowStopConfirm(false)}
                disabled={actionLoading}
              >
                انصراف
              </button>
              <button
                type="button"
                className="ingame-modal-confirm"
                onClick={handleConfirmStop}
                disabled={actionLoading}
              >
                {actionLoading ? 'در حال ثبت...' : 'بله، تمومش کن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {timesUp && (
        <div className="ingame-overlay" role="dialog" aria-modal="true">
          <div className="ingame-modal ingame-timesup-modal sketch-border">
            <p className="ingame-timesup-title">زمان تمام شد!</p>
            <button
              type="button"
              className="ingame-timesup-btn"
              onClick={handleGoToVoting}
              disabled={actionLoading}
            >
              <Icon name="how_to_reg" />
              <span>{actionLoading ? 'در حال ورود...' : 'بریم برای رأی‌گیری'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
