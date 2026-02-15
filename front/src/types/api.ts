export type ApiPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type ApiRecurrence = 'NONE' | 'DAILY' | 'WEEKLY';

export type UserResponse = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: UserResponse;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type RequestVerificationCodeRequest = RegisterRequest;

export type VerifyRegistrationRequest = {
  email: string;
  code: string;
};

export type MessageResponse = {
  message: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type TaskResponse = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  dueTime: string;
  priority: ApiPriority;
  recurrence: ApiRecurrence;
  completed: boolean;
  createdAt: string;
};

export type CalendarDayResponse = {
  date: string;
  tasks: TaskResponse[];
};

export type CreateTaskRequest = {
  title: string;
  subject: string;
  dueDate: string;
  dueTime: string;
  priority: ApiPriority;
  recurrence: ApiRecurrence;
};

export type ToggleTaskRequest = {
  date: string;
};

export type MoveTaskRequest = {
  dueDate: string;
};

export type SettingsResponse = {
  focusMinutes: number;
  breakMinutes: number;
  soundEnabled: boolean;
  browserNotifyEnabled: boolean;
  reminder10Enabled: boolean;
  reminder30Enabled: boolean;
};

export type UpdateSettingsRequest = {
  focusMinutes: number;
  breakMinutes: number;
  soundEnabled: boolean;
  browserNotifyEnabled: boolean;
  reminder10Enabled: boolean;
  reminder30Enabled: boolean;
};

export type FocusLogResponse = {
  date: string;
  minutes: number;
};

export type FocusLogRequest = {
  date: string;
  minutes: number;
};
