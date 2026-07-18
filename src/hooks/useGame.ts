import { useCallback, useEffect, useRef, useState } from "react";
import {
  GameAPI,
  GameAPIError,
  type AppLanguage,
  type GameItem,
  type GameType,
  type SubmitAnswerData,
} from "../api";
import { useAuth } from "../auth";
import { getGameAdSettings, type GameAdSettings } from "../api/GameAdsAPI";
import { MonetagService } from "../ads/MonetagService";

export interface UseGameOptions {
  type: GameType;
  language: AppLanguage;
  questionLimit?: number;
  defaultTimeSeconds?: number;
  difficulty?: "easy" | "medium" | "hard";
  category?: string;
}

export interface UseGameResult {
  currentQuestion: GameItem | null;
  currentIndex: number;
  questionLimit: number;
  score: number;
  correctCount: number;
  finished: boolean;
  completed: boolean;
  empty: boolean;
  loading: boolean;
  submitting: boolean;
  showingAd: boolean;
  error: GameAPIError | null;
  lastResult: SubmitAnswerData | null;
  selectedAnswer: string | null;
  timeLeft: number;
  submitAnswer: (answer: string) => Promise<void>;
  goNextQuestion: () => Promise<void>;
  restart: () => Promise<void>;
  retry: () => Promise<void>;
}

const DEFAULT_AD_SETTINGS: GameAdSettings = {
  enabled: true,
  every_questions: 3,
  provider: "monetag",
  zone_id: 11324128,
  frequency: 1,
  capping_hours: 0.1,
  interval_seconds: 30,
  timeout_seconds: 0,
  every_page: false,
};

const AD_MODES = new Set<GameType>([
  "quiz",
  "riddle",
  "fastest",
  "find_difference",
]);

export function useGame(options: UseGameOptions): UseGameResult {
  const {
    type,
    language,
    questionLimit = 10,
    defaultTimeSeconds = 20,
    difficulty,
    category,
  } = options;

  const { user } = useAuth();

  const [currentQuestion, setCurrentQuestion] = useState<GameItem | null>(null);
  const [gameToken, setGameToken] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [error, setError] = useState<GameAPIError | null>(null);
  const [lastResult, setLastResult] = useState<SubmitAnswerData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(defaultTimeSeconds);

  const issuedAtRef = useRef(Date.now());
  const requestIdRef = useRef(0);
  const timeoutSubmittedRef = useRef(false);
  const adSettingsRef = useRef<GameAdSettings>(DEFAULT_AD_SETTINGS);
  const shownCheckpointsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    void getGameAdSettings(controller.signal)
      .then((settings) => {
        adSettingsRef.current = settings;
      })
      .catch(() => {
        adSettingsRef.current = DEFAULT_AD_SETTINGS;
      });

    void MonetagService.load().catch(() => undefined);
    return () => controller.abort();
  }, []);

  const normalizeError = useCallback((value: unknown): GameAPIError => {
    if (value instanceof GameAPIError) return value;
    return new GameAPIError({
      code: "UNKNOWN_GAME_ERROR",
      message: value instanceof Error ? value.message : "Unable to complete the game request",
    });
  }, []);

  const resolveTimeLimit = useCallback((item: GameItem | null): number => {
    const itemLimit = Number(item?.time_limit);
    return Number.isFinite(itemLimit) && itemLimit > 0 && itemLimit <= 300
      ? Math.trunc(itemLimit)
      : defaultTimeSeconds;
  }, [defaultTimeSeconds]);

  const loadQuestion = useCallback(async (signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setLastResult(null);
    setSelectedAnswer(null);
    setEmpty(false);
    timeoutSubmittedRef.current = false;

    try {
      const result = await GameAPI.getNextGame(
        { type, language, difficulty, category },
        { signal },
      );

      if (requestId !== requestIdRef.current) return;

      if (result.empty || result.completed || !result.item || !result.game_token) {
        setCurrentQuestion(null);
        setGameToken(null);
        setEmpty(Boolean(result.empty));
        setCompleted(Boolean(result.completed));
        setFinished(true);
        return;
      }

      setCurrentQuestion(result.item);
      setGameToken(result.game_token);
      setCompleted(false);
      setFinished(false);
      setTimeLeft(resolveTimeLimit(result.item));
      issuedAtRef.current = Date.now();
    } catch (value) {
      if (value instanceof DOMException && value.name === "AbortError") return;
      setError(normalizeError(value));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [category, difficulty, language, normalizeError, resolveTimeLimit, type]);

  useEffect(() => {
    const controller = new AbortController();
    void loadQuestion(controller.signal);
    return () => controller.abort();
  }, [loadQuestion]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || !gameToken || submitting || lastResult || finished || showingAd) return;

    setSubmitting(true);
    setError(null);
    setSelectedAnswer(answer);

    try {
      const result = await GameAPI.submitAnswer({
        type,
        itemId: Number(currentQuestion.id),
        gameToken,
        answer,
        answerTimeMs: Date.now() - issuedAtRef.current,
      });

      setLastResult(result);
      setScore((previous) => previous + Number(result.points_earned ?? 0));
      if (result.is_correct) setCorrectCount((previous) => previous + 1);
    } catch (value) {
      setSelectedAnswer(null);
      setError(normalizeError(value));
    } finally {
      setSubmitting(false);
    }
  }, [currentQuestion, finished, gameToken, lastResult, normalizeError, showingAd, submitting, type]);

  useEffect(() => {
    if (loading || submitting || showingAd || finished || !currentQuestion || lastResult) return;

    if (timeLeft <= 0) {
      if (!timeoutSubmittedRef.current) {
        timeoutSubmittedRef.current = true;
        void submitAnswer("__TIMEOUT__");
      }
      return;
    }

    const timer = window.setTimeout(
      () => setTimeLeft((previous) => Math.max(previous - 1, 0)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [currentQuestion, finished, lastResult, loading, showingAd, submitAnswer, submitting, timeLeft]);

  const maybeShowAd = useCallback(async (answeredCount: number) => {
    const settings = adSettingsRef.current;
    const checkpointEvery = Math.max(Math.trunc(settings.every_questions), 1);

    if (
      !settings.enabled ||
      Boolean(user?.vip) ||
      !AD_MODES.has(type) ||
      answeredCount <= 0 ||
      answeredCount >= questionLimit ||
      answeredCount % checkpointEvery !== 0 ||
      shownCheckpointsRef.current.has(answeredCount)
    ) {
      return;
    }

    shownCheckpointsRef.current.add(answeredCount);
    setShowingAd(true);

    try {
      await MonetagService.showGameInterstitial({
        frequency: Math.max(Math.trunc(settings.frequency), 1),
        capping: Math.max(settings.capping_hours, 0.1),
        interval: Math.max(Math.trunc(settings.interval_seconds), 0),
        timeout: Math.max(Math.trunc(settings.timeout_seconds), 0),
        everyPage: Boolean(settings.every_page),
      });
    } catch {
      // No inventory or SDK failure must never block the next question.
    } finally {
      setShowingAd(false);
    }
  }, [questionLimit, type, user?.vip]);

  const goNextQuestion = useCallback(async () => {
    if (!lastResult || showingAd) return;

    const answeredCount = currentIndex + 1;
    if (answeredCount >= questionLimit) {
      setFinished(true);
      return;
    }

    await maybeShowAd(answeredCount);
    setCurrentIndex(answeredCount);
    await loadQuestion();
  }, [currentIndex, lastResult, loadQuestion, maybeShowAd, questionLimit, showingAd]);

  const restart = useCallback(async () => {
    shownCheckpointsRef.current.clear();
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setFinished(false);
    setCompleted(false);
    setEmpty(false);
    setLastResult(null);
    setSelectedAnswer(null);
    setTimeLeft(defaultTimeSeconds);
    await loadQuestion();
  }, [defaultTimeSeconds, loadQuestion]);

  const retry = useCallback(async () => {
    await loadQuestion();
  }, [loadQuestion]);

  return {
    currentQuestion,
    currentIndex,
    questionLimit,
    score,
    correctCount,
    finished,
    completed,
    empty,
    loading,
    submitting,
    showingAd,
    error,
    lastResult,
    selectedAnswer,
    timeLeft,
    submitAnswer,
    goNextQuestion,
    restart,
    retry,
  };
}
