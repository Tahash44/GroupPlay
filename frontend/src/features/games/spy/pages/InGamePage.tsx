import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { spyService } from '../services/spyService';
import type { TimerStatus } from '../types/spy.types';
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

  // گرفتن وضعیت اولیه‌ی تایمر
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const status = await spyService.getTimer(id);
        if (!cancelled) applyStatus(status);
      } catch {
        if (!cancelled) setError('گرفتن اطلاعات تایمر با خطا مواجه شد. صفحه رو رفرش کن.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

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

  const handleGoToVoting = () => {
    if (!id) return;
    navigate(`/games/spy/sessions/${id}/vote`);
  };

  if (loading) {
    return (
      <div className="ingame-page ingame-page-center">
        <p className="ingame-status">در حال بارگذاری تایمر...</p>
      </div>
    );
  }

  if (error || remainingSeconds === null || timerDuration === null) {
    return (
      <div className="ingame-page ingame-page-center">
        <p className="ingame-status ingame-status-error">{error ?? 'خطای غیرمنتظره'}</p>
      </div>
    );
  }

  const progress = Math.min(1, Math.max(0, remainingSeconds / timerDuration));
  const dashOffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  return (
    <div className={`ingame-page ${!isRunning && !timesUp ? 'ingame-page-paused' : ''}`}>
      <header className="ingame-header">
        <button type="button" className="ingame-icon-btn" aria-label="راهنما">
          <span className="material-symbols-outlined">help</span>
        </button>
        <h1 className="ingame-brand">بازی‌گردان</h1>
        <button
          type="button"
          className="ingame-icon-btn"
          onClick={() => navigate('/dashboard')}
          aria-label="برگشت"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </header>

      <main className="ingame-main">
        <div className="ingame-timer-wrap">
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
          <div className={`ingame-timer-display ${isRunning ? 'ingame-timer-pulse' : ''}`}>
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
            <span className="material-symbols-outlined">{isRunning ? 'pause' : 'play_arrow'}</span>
            <span>{isRunning ? 'توقف موقت' : 'ادامه بازی'}</span>
          </button>

          <button
            type="button"
            className="ingame-early-stop-btn"
            onClick={() => setShowStopConfirm(true)}
            disabled={actionLoading}
          >
            <span className="material-symbols-outlined">how_to_reg</span>
            <span className="ingame-early-stop-label">
              <span>رأی‌گیری</span>
              <span className="ingame-early-stop-sub">پایان زودهنگام</span>
            </span>
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
            <button type="button" className="ingame-timesup-btn" onClick={handleGoToVoting}>
              <span className="material-symbols-outlined">how_to_reg</span>
              <span>بریم برای رأی‌گیری</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}