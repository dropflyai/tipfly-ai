// TipFly AI Type Definitions

export type RootStackParamList = {
  Landing: undefined;
  Welcome: undefined;
  JobSelection: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Upgrade: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  AddTip: undefined;
  Stats: undefined;
  Settings: undefined;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  job_title?: string;
  onboarding_completed: boolean;
  subscription_tier: 'free' | 'premium';
  created_at: string;
};

export type Job = {
  id: string;
  user_id: string;
  name: string;
  job_type?: 'restaurant' | 'bar' | 'delivery' | 'rideshare' | 'other';
  color: string;
  is_primary: boolean;
  is_active: boolean;
  hourly_wage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type Position = {
  id: string;
  job_id: string;
  user_id: string;
  name: string; // "Server", "Bartender", "Host", etc.
  color: string;
  is_default: boolean; // Default position for this job
  created_at: string;
  updated_at: string;
};

export type JobStatistics = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  job_type?: string;
  is_primary: boolean;
  total_entries: number;
  total_tips: number;
  total_hours: number;
  avg_hourly_rate: number;
  last_shift_date?: string;
};

export type TipEntry = {
  id: string;
  user_id: string;
  job_id?: string;
  position_id?: string; // Optional position within a job (Server, Bartender, etc.)
  date: string;
  clock_in?: string;  // ISO timestamp for shift start
  clock_out?: string; // ISO timestamp for shift end
  hours_worked: number;
  tips_earned: number;
  tip_out?: number; // Amount tipped out to support staff (busboys, bar, hosts)
  shift_type: 'day' | 'night' | 'double' | 'other';
  notes?: string;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  goal_type: 'daily' | 'weekly' | 'monthly';
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

export type Deduction = {
  id: string;
  user_id: string;
  date: string;
  category: 'gas' | 'uniform' | 'supplies' | 'other';
  amount: number;
  description?: string;
  created_at: string;
};

export type StatsData = {
  totalTips: number;
  averagePerHour: number;
  totalHours: number;
  bestShift: string;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
};

export type JobType = 'waiter' | 'bartender' | 'stylist' | 'nail_tech' | 'driver' | 'delivery' | 'other';
