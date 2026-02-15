import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL, apiRequest } from './lib/api';
import type {
  AuthResponse,
  CalendarDayResponse,
  CreateTaskRequest,
  FocusLogRequest,
  FocusLogResponse,
  LoginRequest,
  MoveTaskRequest,
  RegisterRequest,
  SettingsResponse,
  TaskResponse,
  ToggleTaskRequest,
  UpdateSettingsRequest,
  UserResponse,
} from './types/api';

type Priority = 'high' | 'medium' | 'low';
type Recurrence = 'none' | 'daily' | 'weekly';
type SortMode = 'priority' | 'time' | 'recent';

type Task = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  dueTime: string;
  priority: Priority;
  recurrence: Recurrence;
  completed: boolean;
  createdAt: number;
};

type User = {
  id: string;
  name: string;
  email: string;
};

type TimerMode = 'focus' | 'break';
type AuthMode = 'login' | 'register';
type CycleAlert = 'focus_done' | 'break_done' | null;

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const TOKEN_STORAGE_KEY = 'study-planner-jwt-token';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function clampMinutes(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(180, Math.max(1, Math.floor(value)));
}

function getMonthDays(viewDate: Date): Date[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const days: Date[] = [];
  for (let i = 0; i < startWeekday; i += 1) {
    days.push(new Date(year, month, i - startWeekday + 1));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }

  return days;
}

function priorityScore(priority: Priority): number {
  if (priority === 'high') return 3;
  if (priority === 'medium') return 2;
  return 1;
}

function recurrenceLabel(recurrence: Recurrence): string {
  if (recurrence === 'daily') return '매일';
  if (recurrence === 'weekly') return '매주';
  return '일회성';
}

function priorityLabel(priority: Priority): string {
  if (priority === 'high') return '높음';
  if (priority === 'medium') return '중간';
  return '낮음';
}

function toApiPriority(priority: Priority): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (priority === 'high') return 'HIGH';
  if (priority === 'medium') return 'MEDIUM';
  return 'LOW';
}

function toApiRecurrence(recurrence: Recurrence): 'NONE' | 'DAILY' | 'WEEKLY' {
  if (recurrence === 'daily') return 'DAILY';
  if (recurrence === 'weekly') return 'WEEKLY';
  return 'NONE';
}

function fromApiTask(task: TaskResponse): Task {
  return {
    id: task.id,
    title: task.title,
    subject: task.subject,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    priority: task.priority.toLowerCase() as Priority,
    recurrence: task.recurrence.toLowerCase() as Recurrence,
    completed: task.completed,
    createdAt: Date.parse(task.createdAt),
  };
}

function playNotificationTone() {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;

  const context = new AudioContextConstructor();
  const now = context.currentTime;
  const notes = [784, 988];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.16, now + index * 0.22 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.22 + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + index * 0.22);
    oscillator.stop(now + index * 0.22 + 0.2);
  });

  window.setTimeout(() => {
    void context.close();
  }, 700);
}

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarTasksByDate, setCalendarTasksByDate] = useState<Record<string, Task[]>>({});
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(toDateKey(new Date()));
  const [priority, setPriority] = useState<Priority>('medium');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');

  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [sortMode, setSortMode] = useState<SortMode>('priority');

  const [alertedReminders, setAlertedReminders] = useState<Record<string, boolean>>({});

  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState(false);
  const [reminder10Enabled, setReminder10Enabled] = useState(true);
  const [reminder30Enabled, setReminder30Enabled] = useState(true);

  const [mode, setMode] = useState<TimerMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [cycleAlert, setCycleAlert] = useState<CycleAlert>(null);
  const [toastMessage, setToastMessage] = useState('');

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const [viewDate, setViewDate] = useState(() => new Date());
  const toastTimeoutRef = useRef<number | null>(null);
  const isHydratingSettingsRef = useRef(false);
  const reminderInFlightRef = useRef(false);
  const alertedRemindersRef = useRef<Record<string, boolean>>({});

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const tomorrowKey = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toDateKey(tomorrow);
  }, []);

  const monthDays = useMemo(() => getMonthDays(viewDate), [viewDate]);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(''), 3500);
  };

  const notify = (titleText: string, message: string) => {
    if (soundEnabled) {
      playNotificationTone();
    }

    if (browserNotifyEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(titleText, { body: message });
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(160);
    }

    showToast(message);
  };

  const fetchTasksForDate = async (dateKey: string) => {
    if (!token) return;
    const params = new URLSearchParams({ date: dateKey, sort: sortMode });
    if (priorityFilter !== 'all') {
      params.set('priority', toApiPriority(priorityFilter));
    }

    const data = await apiRequest<TaskResponse[]>(`/api/tasks?${params.toString()}`, token);
    setTasks(data.map(fromApiTask));
  };

  const fetchCalendarMonth = async () => {
    if (!token) return;
    const month = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    const data = await apiRequest<CalendarDayResponse[]>(`/api/tasks/calendar?month=${month}`, token);

    const mapped: Record<string, Task[]> = {};
    data.forEach((day) => {
      mapped[day.date] = day.tasks.map(fromApiTask);
    });
    setCalendarTasksByDate(mapped);
  };

  useEffect(() => {
    const run = async () => {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!savedToken) return;

      try {
        const me = await apiRequest<UserResponse>('/api/auth/me', savedToken);
        setToken(savedToken);
        setCurrentUser({ id: me.id, name: me.name, email: me.email });
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (currentUser) return;

    let cancelled = false;
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (!cancelled) {
          setBackendReady(response.ok);
        }
      } catch {
        if (!cancelled) {
          setBackendReady(false);
        }
      }
    };

    void checkHealth();
    const timer = window.setInterval(() => {
      void checkHealth();
    }, 7000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!token || !currentUser) return;

    const run = async () => {
      try {
        isHydratingSettingsRef.current = true;

        const [settings, focus] = await Promise.all([
          apiRequest<SettingsResponse>('/api/user/settings', token),
          apiRequest<FocusLogResponse>(`/api/user/focus?date=${todayKey}`, token),
        ]);

        setFocusMinutes(settings.focusMinutes);
        setBreakMinutes(settings.breakMinutes);
        setSoundEnabled(settings.soundEnabled);
        setBrowserNotifyEnabled(settings.browserNotifyEnabled);
        setReminder10Enabled(settings.reminder10Enabled);
        setReminder30Enabled(settings.reminder30Enabled);
        setMode('focus');
        setSecondsLeft(settings.focusMinutes * 60);
        setTodayFocusMinutes(focus.minutes ?? 0);
      } catch (error) {
        showToast(error instanceof Error ? error.message : '초기 데이터를 불러오지 못했습니다.');
      } finally {
        isHydratingSettingsRef.current = false;
      }
    };

    void run();
  }, [token, currentUser, todayKey]);

  useEffect(() => {
    if (!token || !currentUser) return;
    void fetchTasksForDate(dueDate);
  }, [token, currentUser, dueDate, sortMode, priorityFilter]);

  useEffect(() => {
    if (!token || !currentUser) return;
    void fetchCalendarMonth();
  }, [token, currentUser, viewDate]);

  useEffect(() => {
    if (running) return;
    setSecondsLeft(mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
  }, [mode, focusMinutes, breakMinutes, running]);

  useEffect(() => {
    if (!running || !currentUser) return;

    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        if (mode === 'focus') {
          setTodayFocusMinutes((current) => current + focusMinutes);
          setCycleAlert('focus_done');
          setMode('break');
          return breakMinutes * 60;
        }

        setCycleAlert('break_done');
        setMode('focus');
        return focusMinutes * 60;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [running, mode, currentUser, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (!cycleAlert) return;

    const isFocusDone = cycleAlert === 'focus_done';
    notify(
      isFocusDone ? '집중 종료' : '휴식 종료',
      isFocusDone ? '집중 시간이 끝났어요. 휴식으로 전환합니다.' : '휴식이 끝났어요. 다시 집중을 시작하세요.'
    );
    setCycleAlert(null);
  }, [cycleAlert, soundEnabled, browserNotifyEnabled]);

  useEffect(() => {
    if (!token || !currentUser) return;
    if (isHydratingSettingsRef.current) return;

    const run = async () => {
      try {
        await apiRequest<SettingsResponse>('/api/user/settings', token, {
          method: 'PATCH',
          body: JSON.stringify({
            focusMinutes,
            breakMinutes,
            soundEnabled,
            browserNotifyEnabled,
            reminder10Enabled,
            reminder30Enabled,
          } satisfies UpdateSettingsRequest),
        });
      } catch (error) {
        showToast(error instanceof Error ? error.message : '설정 저장에 실패했습니다.');
      }
    };

    void run();
  }, [
    token,
    currentUser,
    focusMinutes,
    breakMinutes,
    soundEnabled,
    browserNotifyEnabled,
    reminder10Enabled,
    reminder30Enabled,
  ]);

  useEffect(() => {
    if (!token || !currentUser) return;

    const run = async () => {
      try {
        await apiRequest<FocusLogResponse>('/api/user/focus', token, {
          method: 'POST',
          body: JSON.stringify({
            date: todayKey,
            minutes: todayFocusMinutes,
          } satisfies FocusLogRequest),
        });
      } catch {
        // ignore focus sync transient failures
      }
    };

    void run();
  }, [token, currentUser, todayKey, todayFocusMinutes]);

  useEffect(() => {
    if (!token || !currentUser) return;
    if (!reminder10Enabled && !reminder30Enabled) return;

    const check = async () => {
      if (reminderInFlightRef.current) return;
      reminderInFlightRef.current = true;
      try {
        const [todayTasksRaw, tomorrowTasksRaw] = await Promise.all([
          apiRequest<TaskResponse[]>(`/api/tasks?date=${todayKey}&sort=time`, token),
          apiRequest<TaskResponse[]>(`/api/tasks?date=${tomorrowKey}&sort=time`, token),
        ]);

        const now = Date.now();
        const minutesList: number[] = [];
        if (reminder30Enabled) minutesList.push(30);
        if (reminder10Enabled) minutesList.push(10);

        const allTasks = [
          ...todayTasksRaw.map((item) => ({ task: fromApiTask(item), dateKey: todayKey })),
          ...tomorrowTasksRaw.map((item) => ({ task: fromApiTask(item), dateKey: tomorrowKey })),
        ];

        const newlyAlerted: string[] = [];

        allTasks.forEach(({ task, dateKey }) => {
          const dueAt = Date.parse(`${dateKey}T${task.dueTime}:00`);
          if (!Number.isFinite(dueAt) || dueAt <= now || task.completed) return;

          minutesList.forEach((minutesBefore) => {
            const key = `${task.id}::${dateKey}::${minutesBefore}`;
            if (alertedRemindersRef.current[key]) return;

            const alertAt = dueAt - minutesBefore * 60_000;
            if (now >= alertAt && now < dueAt) {
              newlyAlerted.push(key);
              notify('일정 리마인드', `${task.title} 시작 ${minutesBefore}분 전입니다.`);
            }
          });
        });

        if (newlyAlerted.length > 0) {
          setAlertedReminders((prev) => {
            const next = { ...prev };
            newlyAlerted.forEach((key) => {
              next[key] = true;
            });
            return next;
          });
        }
      } catch {
        // ignore reminder polling failure
      } finally {
        reminderInFlightRef.current = false;
      }
    };

    void check();
    const intervalId = window.setInterval(() => void check(), 30_000);
    return () => window.clearInterval(intervalId);
  }, [
    token,
    currentUser,
    todayKey,
    tomorrowKey,
    reminder10Enabled,
    reminder30Enabled,
    soundEnabled,
    browserNotifyEnabled,
  ]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    alertedRemindersRef.current = alertedReminders;
  }, [alertedReminders]);

  const selectedDateTasks = useMemo(() => tasks, [tasks]);

  const filteredTasks = useMemo(() => {
    if (priorityFilter === 'all') return selectedDateTasks;
    return selectedDateTasks.filter((task) => task.priority === priorityFilter);
  }, [selectedDateTasks, priorityFilter]);

  const sortedTasks = useMemo(() => {
    const cloned = [...filteredTasks];
    if (sortMode === 'priority') {
      cloned.sort((a, b) => {
        const p = priorityScore(b.priority) - priorityScore(a.priority);
        if (p !== 0) return p;
        return a.dueTime.localeCompare(b.dueTime);
      });
      return cloned;
    }

    if (sortMode === 'time') {
      cloned.sort((a, b) => {
        const t = a.dueTime.localeCompare(b.dueTime);
        if (t !== 0) return t;
        return priorityScore(b.priority) - priorityScore(a.priority);
      });
      return cloned;
    }

    cloned.sort((a, b) => b.createdAt - a.createdAt);
    return cloned;
  }, [filteredTasks, sortMode]);

  const pendingSelectedTasks = useMemo(() => sortedTasks.filter((task) => !task.completed), [sortedTasks]);
  const doneSelectedTasks = useMemo(() => sortedTasks.filter((task) => task.completed), [sortedTasks]);
  const completedSelected = selectedDateTasks.filter((task) => task.completed).length;
  const progress = selectedDateTasks.length === 0 ? 0 : Math.round((completedSelected / selectedDateTasks.length) * 100);

  const monthLabel = viewDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  const handleAuth = async () => {
    if (authLoading || !backendReady) return;

    const email = authEmail.trim().toLowerCase();
    const password = authPassword.trim();

    if (!email || !password) {
      setAuthError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const payload: LoginRequest = { email, password };
        const response = await apiRequest<AuthResponse>('/api/auth/login', null, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
        setToken(response.token);
        setCurrentUser({ id: response.user.id, name: response.user.name, email: response.user.email });
        setAuthError('');
        setAlertedReminders({});
        return;
      }

      const payload: RegisterRequest = {
        name: authName.trim() || '스터디러',
        email,
        password,
      };
      const response = await apiRequest<AuthResponse>('/api/auth/register', null, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      setToken(response.token);
      setCurrentUser({ id: response.user.id, name: response.user.name, email: response.user.email });
      setAuthError('');
      setAlertedReminders({});
      showToast('회원가입이 완료되었습니다.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setRunning(false);
    setToken(null);
    setCurrentUser(null);
    setTasks([]);
    setCalendarTasksByDate({});
    setAlertedReminders({});
    setTodayFocusMinutes(0);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const addTask = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !token) return;

    try {
      await apiRequest<TaskResponse>('/api/tasks', token, {
        method: 'POST',
        body: JSON.stringify({
          title: trimmedTitle,
          subject: '일반',
          dueDate,
          dueTime: '09:00',
          priority: toApiPriority(priority),
          recurrence: toApiRecurrence(recurrence),
        } satisfies CreateTaskRequest),
      });

      setTitle('');
      await fetchTasksForDate(dueDate);
      void fetchCalendarMonth();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '일정 추가에 실패했습니다.');
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!token) return;
    try {
      await apiRequest<TaskResponse>(`/api/tasks/${taskId}/toggle`, token, {
        method: 'PATCH',
        body: JSON.stringify({ date: dueDate } satisfies ToggleTaskRequest),
      });
      await fetchTasksForDate(dueDate);
      void fetchCalendarMonth();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '일정 상태 변경에 실패했습니다.');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!token) return;
    try {
      await apiRequest<{ message: string }>(`/api/tasks/${taskId}`, token, {
        method: 'DELETE',
      });
      await fetchTasksForDate(dueDate);
      void fetchCalendarMonth();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '일정 삭제에 실패했습니다.');
    }
  };

  const moveTaskToDate = async (taskId: string, dateKey: string) => {
    if (!token) return;
    try {
      await apiRequest<TaskResponse>(`/api/tasks/${taskId}/move`, token, {
        method: 'PATCH',
        body: JSON.stringify({ dueDate: dateKey } satisfies MoveTaskRequest),
      });
      await fetchTasksForDate(dueDate);
      void fetchCalendarMonth();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '일정 이동에 실패했습니다.');
    }
  };

  const resetTimer = () => {
    setRunning(false);
    setMode('focus');
    setSecondsLeft(focusMinutes * 60);
  };

  const toggleBrowserNotification = async () => {
    if (!('Notification' in window)) {
      showToast('브라우저 알림을 지원하지 않는 환경입니다.');
      return;
    }

    if (Notification.permission === 'granted') {
      setBrowserNotifyEnabled((prev) => !prev);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setBrowserNotifyEnabled(true);
      showToast('브라우저 알림이 활성화됐어요.');
      return;
    }

    setBrowserNotifyEnabled(false);
    showToast('브라우저 알림 권한이 거부되었습니다.');
  };

  if (!currentUser) {
    return (
      <main className="app-shell auth-shell">
        <div className="bg-glow bg-glow-a" />
        <div className="bg-glow bg-glow-b" />

        <section className="panel auth-card">
          <p className="eyebrow">Deep Work OS</p>
          <h1>{authMode === 'login' ? '로그인' : '회원가입'}</h1>
          <p className="hero-copy">JWT 인증으로 백엔드와 연결됩니다.</p>

          <div className="auth-form">
            {authMode === 'register' && (
              <input
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="이름"
                autoComplete="name"
              />
            )}
            <input
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="이메일"
              autoComplete="email"
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAuth();
              }}
            />
            {authError && <p className="auth-error">{authError}</p>}
            {!backendReady && <p className="auth-error">서버 준비 중입니다. 잠시만 기다려주세요.</p>}
            <button onClick={() => void handleAuth()} disabled={authLoading || !backendReady}>
              {!backendReady ? '서버 준비 중...' : authLoading ? '처리 중...' : authMode === 'login' ? '로그인' : '회원가입'}
            </button>
          </div>

          <button
            className="link-button"
            onClick={() => {
              setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'));
              setAuthError('');
            }}
          >
            {authMode === 'login' ? '처음이신가요? 회원가입' : '이미 계정이 있나요? 로그인'}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="bg-glow bg-glow-a" />
      <div className="bg-glow bg-glow-b" />

      <header className="panel hero">
        <div className="hero-top">
          <div>
            <p className="eyebrow">Deep Work OS</p>
            <h1>{currentUser.name}님의 스터디 플래너</h1>
            <p className="hero-copy">반복 일정, 리마인드, 우선순위 정렬까지 한 번에 관리하세요.</p>
            <div className="hero-meta">
              <span className="meta-pill">{mode === 'focus' ? '집중 세션' : '휴식 세션'}</span>
              <span className="meta-pill">선택 날짜: {dueDate}</span>
            </div>
          </div>
          <div className="hero-actions">
            <button className={`toggle-chip ${soundEnabled ? 'active' : ''}`} onClick={() => setSoundEnabled((prev) => !prev)}>
              사운드 {soundEnabled ? 'ON' : 'OFF'}
            </button>
            <button className={`toggle-chip ${browserNotifyEnabled ? 'active' : ''}`} onClick={() => void toggleBrowserNotification()}>
              브라우저 알림 {browserNotifyEnabled ? 'ON' : 'OFF'}
            </button>
            <button className={`toggle-chip ${reminder30Enabled ? 'active' : ''}`} onClick={() => setReminder30Enabled((prev) => !prev)}>
              30분 전 {reminder30Enabled ? 'ON' : 'OFF'}
            </button>
            <button className={`toggle-chip ${reminder10Enabled ? 'active' : ''}`} onClick={() => setReminder10Enabled((prev) => !prev)}>
              10분 전 {reminder10Enabled ? 'ON' : 'OFF'}
            </button>
            <button className="secondary logout-btn" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <section className="panel stats">
        <article className="stat-card">
          <p className="label">오늘 집중 시간</p>
          <p className="value">{formatMinutes(todayFocusMinutes)}</p>
        </article>
        <article className="stat-card">
          <p className="label">선택 날짜 진행률</p>
          <p className="value">{progress}%</p>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </article>
      </section>

      <div className="content-grid">
        <section className="panel planner">
          <div className="section-heading">
            <div>
              <h2>선택 날짜 플랜</h2>
              <p className="planner-date">{dueDate}</p>
            </div>
            <span className="planner-count">남은 일정 {pendingSelectedTasks.length}개</span>
          </div>

          <div className="planner-toolbar">
            <div className="quick-date-row">
              <button className={`quick-date-btn ${dueDate === todayKey ? 'active' : ''}`} onClick={() => setDueDate(todayKey)}>
                오늘
              </button>
              <button className={`quick-date-btn ${dueDate === tomorrowKey ? 'active' : ''}`} onClick={() => setDueDate(tomorrowKey)}>
                내일
              </button>
            </div>

            <div className="planner-filters-inline">
              <label>
                우선순위
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as 'all' | Priority)}>
                  <option value="all">전체</option>
                  <option value="high">높음</option>
                  <option value="medium">중간</option>
                  <option value="low">낮음</option>
                </select>
              </label>
              <label>
                정렬
                <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
                  <option value="priority">우선순위순</option>
                  <option value="time">시간순</option>
                  <option value="recent">최신순</option>
                </select>
              </label>
            </div>
          </div>

          <div className="task-composer">
            <div className="task-title-row">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="할 일 제목을 입력하세요"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void addTask();
                }}
              />
              <button className="add-btn" onClick={() => void addTask()}>
                일정 추가
              </button>
            </div>
            <div className="task-meta-grid">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="high">우선순위 높음</option>
                <option value="medium">우선순위 중간</option>
                <option value="low">우선순위 낮음</option>
              </select>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
                <option value="none">일회성</option>
                <option value="daily">매일 반복</option>
                <option value="weekly">매주 반복</option>
              </select>
            </div>
          </div>

          <ul className="task-list">
            {selectedDateTasks.length === 0 && (
              <li className="empty-state">{dueDate} 일정이 없어요. 날짜를 선택해서 일정을 추가해보세요.</li>
            )}

            {pendingSelectedTasks.map((task) => (
              <li
                key={task.id}
                className="task-item"
                draggable
                onDragStart={() => setDraggingTaskId(task.id)}
                onDragEnd={() => {
                  setDraggingTaskId(null);
                  setDragOverDate(null);
                }}
              >
                <label className="task-main">
                  <input type="checkbox" checked={task.completed} onChange={() => void toggleTask(task.id)} />
                  <div className="task-copy">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta-row">
                      <small className="time-tag">{task.dueTime}</small>
                      <small className={`priority-tag ${task.priority}`}>{priorityLabel(task.priority)}</small>
                      <small className="recurrence-tag">{recurrenceLabel(task.recurrence)}</small>
                    </div>
                  </div>
                </label>
                <button className="danger" onClick={() => void deleteTask(task.id)}>
                  삭제
                </button>
              </li>
            ))}

            {doneSelectedTasks.length > 0 && <li className="list-divider">완료됨 {doneSelectedTasks.length}개</li>}

            {doneSelectedTasks.map((task) => (
              <li
                key={task.id}
                className="task-item is-done"
                draggable
                onDragStart={() => setDraggingTaskId(task.id)}
                onDragEnd={() => {
                  setDraggingTaskId(null);
                  setDragOverDate(null);
                }}
              >
                <label className="task-main">
                  <input type="checkbox" checked={task.completed} onChange={() => void toggleTask(task.id)} />
                  <div className="task-copy">
                    <span className="task-title done">{task.title}</span>
                    <div className="task-meta-row">
                      <small className="time-tag">{task.dueTime}</small>
                      <small className={`priority-tag ${task.priority}`}>{priorityLabel(task.priority)}</small>
                      <small className="recurrence-tag">{recurrenceLabel(task.recurrence)}</small>
                    </div>
                  </div>
                </label>
                <button className="danger" onClick={() => void deleteTask(task.id)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel timer">
          <h2>Focus Loop</h2>
          <p className="mode">{mode === 'focus' ? '집중 시간' : '휴식 시간'}</p>
          <p className={`time ${running ? 'running' : ''}`}>{formatTime(secondsLeft)}</p>
          <div className="timer-settings">
            <label>
              집중
              <input
                type="number"
                min={1}
                max={180}
                value={focusMinutes}
                onChange={(e) => setFocusMinutes(clampMinutes(Number(e.target.value), focusMinutes))}
              />
              <span>분</span>
            </label>
            <label>
              휴식
              <input
                type="number"
                min={1}
                max={180}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(clampMinutes(Number(e.target.value), breakMinutes))}
              />
              <span>분</span>
            </label>
          </div>
          <div className="timer-buttons">
            <button onClick={() => setRunning((v) => !v)}>{running ? '일시정지' : '시작'}</button>
            <button onClick={resetTimer} className="secondary">
              초기화
            </button>
          </div>
        </section>
      </div>

      <section className="panel calendar">
        <div className="calendar-head">
          <h2>학습 캘린더</h2>
          <div className="calendar-nav">
            <button className="secondary" onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
              이전
            </button>
            <p>{monthLabel}</p>
            <button className="secondary" onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
              다음
            </button>
          </div>
        </div>

        <div className="weekday-row">
          <span>일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span>토</span>
        </div>

        <div className="calendar-grid">
          {monthDays.map((day) => {
            const key = toDateKey(day);
            const dayTasks = calendarTasksByDate[key] ?? [];
            const isCurrentMonth = day.getMonth() === viewDate.getMonth();
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                className={`day-cell ${isCurrentMonth ? '' : 'muted'} ${isToday ? 'today' : ''} ${key === dueDate ? 'selected' : ''} ${dragOverDate === key ? 'drop-target' : ''}`}
                onClick={() => setDueDate(key)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverDate(key);
                }}
                onDragLeave={() => setDragOverDate(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggingTaskId) {
                    void moveTaskToDate(draggingTaskId, key);
                    setDueDate(key);
                  }
                  setDraggingTaskId(null);
                  setDragOverDate(null);
                }}
              >
                <span className="day-number">{day.getDate()}</span>
                <div className="day-tasks">
                  {dayTasks.slice(0, 3).map((task) => (
                    <p key={task.id} className={task.completed ? 'day-task done' : 'day-task'}>
                      {task.dueTime} {task.title}
                    </p>
                  ))}
                  {dayTasks.length > 3 && <p className="day-task more">+{dayTasks.length - 3} more</p>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {toastMessage && <div className="toast-alert">{toastMessage}</div>}
    </main>
  );
}
