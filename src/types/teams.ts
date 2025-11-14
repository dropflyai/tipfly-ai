// Types for Teams & Tip Pooling Feature

export interface Workplace {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkplaceMembership {
  id: string;
  workplace_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export type SplitType = 'equal_hours' | 'custom_percentage';
export type PoolStatus = 'draft' | 'finalized' | 'cancelled';

export interface TipPool {
  id: string;
  workplace_id: string;
  date: string; // ISO date string
  shift_type?: 'breakfast' | 'lunch' | 'dinner' | 'late_night';
  total_amount: number;
  split_type: SplitType;
  created_by: string;
  status: PoolStatus;
  created_at: string;
  updated_at: string;
}

export interface PoolParticipant {
  id: string;
  pool_id: string;
  user_id: string;
  hours_worked?: number; // For equal_hours split
  percentage?: number; // For custom_percentage split
  share_amount: number;
  confirmed: boolean;
  confirmed_at?: string;
  created_at: string;
}

// Extended types with joined data
export interface WorkplaceWithMembers extends Workplace {
  member_count: number;
  user_role: 'owner' | 'member';
}

export interface TipPoolWithDetails extends TipPool {
  workplace: Workplace;
  participants: PoolParticipantWithUser[];
  creator_name: string;
  total_confirmed: number;
  total_pending: number;
}

export interface PoolParticipantWithUser extends PoolParticipant {
  user_name: string;
  user_email: string;
}

// Request/Response types
export interface CreateWorkplaceRequest {
  name: string;
}

export interface JoinWorkplaceRequest {
  invite_code: string;
}

export interface CreateTipPoolRequest {
  workplace_id: string;
  date: string;
  shift_type?: 'breakfast' | 'lunch' | 'dinner' | 'late_night';
  total_amount: number;
  split_type: SplitType;
  participants: {
    user_id: string;
    hours_worked?: number;
    percentage?: number;
  }[];
}

export interface ConfirmPoolShareRequest {
  pool_id: string;
  participant_id: string;
}
