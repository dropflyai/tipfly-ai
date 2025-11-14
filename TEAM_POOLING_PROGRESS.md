# Team Tip Pooling Feature - Implementation Progress

## Overview
Adding collaborative tip pooling feature to TipFly AI, allowing coworkers to connect as teams, create shared tip pools, and split earnings.

## Feature Requirements ✅

### Team Model
- ✅ Workplace/team-based model (not 1-on-1 connections)
- ✅ 6-digit invite codes to join teams
- ✅ Anyone on team can create pools
- ✅ Participants must confirm shares before adding to earnings

### Split Logic
- ✅ **Equal Hours Split** - Divide pool based on hours worked
- ✅ **Custom Percentage Split** - Manual percentage allocation

### Premium Gating
- ✅ Free tier: 1 team maximum
- ✅ Premium tier: Unlimited teams

### Notifications
- 🔲 Push notifications when added to a pool
- 🔲 Notifications when pool is finalized

---

## ✅ Completed: Backend Infrastructure

### 1. Database Schema ([supabase/migrations/20250115000000_create_teams_and_pools.sql](supabase/migrations/20250115000000_create_teams_and_pools.sql))

**Tables Created:**
- `workplaces` - Team/workplace information with invite codes
- `workplace_memberships` - User membership in teams
- `tip_pools` - Shared tip pools for a shift
- `pool_participants` - Individual participants in each pool

**Key Features:**
- Row Level Security (RLS) policies for data privacy
- Automatic invite code generation
- Cascade deletes for data integrity
- Status tracking (draft, finalized, cancelled)
- Support for both split types

### 2. TypeScript Types ([src/types/teams.ts](src/types/teams.ts))

Comprehensive type definitions for:
- Workplace, WorkplaceMembership
- TipPool, PoolParticipant
- Extended types with joined data
- Request/response interfaces

### 3. Team Management API ([src/services/api/teams.ts](src/services/api/teams.ts))

**Functions:**
- `getUserWorkplaces()` - Get all teams user is in
- `createWorkplace(name)` - Create new team with invite code
- `joinWorkplace(inviteCode)` - Join team via 6-digit code
- `leaveWorkplace(workplaceId)` - Leave team (or delete if owner)
- `getWorkplaceMembers(workplaceId)` - View team members
- `updateWorkplaceName(workplaceId, name)` - Update team name (owner only)

**Security:**
- Automatic owner assignment on creation
- Prevent leaving if sole owner
- Invite code validation (uppercase, 6 chars)

### 4. Tip Pool API ([src/services/api/tipPools.ts](src/services/api/tipPools.ts))

**Functions:**
- `getWorkplacePools(workplaceId)` - Get all pools for a team
- `getPendingPools()` - Get pools awaiting user confirmation
- `getPoolDetails(poolId)` - Get full pool breakdown
- `createTipPool(request)` - Create new pool with participants
- `confirmPoolShare(request)` - Confirm your share in a pool
- `finalizePool(poolId)` - Lock pool from edits (creator only)
- `cancelPool(poolId)` - Cancel draft pool
- `deletePool(poolId)` - Delete pool (no confirmations)
- `getWorkplacePoolStats(workplaceId)` - Pool statistics

**Split Calculation Logic:**
```typescript
// Equal Hours
totalHours = sum of all hours
hourlyRate = totalAmount / totalHours
yourShare = yourHours * hourlyRate

// Custom Percentage
yourShare = totalAmount * (yourPercentage / 100)
```

**Validation:**
- Equal hours: All participants must have hours > 0
- Custom percentage: Must add up to 100%
- Only team members can create pools
- Only creators can finalize/cancel
- Only participants can confirm their own share

---

## ✅ Completed: Teams Screen UI

### 1. Teams Screen ✅
**Purpose:** Main hub for managing teams

**Implemented Features:**
- ✅ List of user's teams with gradient cards (emerald green)
- ✅ Team cards display: name, member count, invite code, role badge
- ✅ "Create Team" button (+ icon in header)
- ✅ "Join Team" button (dashed border card at bottom)
- ✅ Long-press team card to leave/delete team
- ✅ Tap invite code to copy to clipboard
- ✅ Premium gating (1 team free, unlimited premium)
- ✅ Empty state with helpful messaging
- ✅ Pull-to-refresh functionality
- ✅ Added "Teams" as 4th tab in bottom navigation

**Files Created:**
- [src/screens/teams/TeamsScreen.tsx](src/screens/teams/TeamsScreen.tsx) - Main screen (443 lines)
- [src/screens/teams/CreateTeamModal.tsx](src/screens/teams/CreateTeamModal.tsx) - Create modal (179 lines)
- [src/screens/teams/JoinTeamModal.tsx](src/screens/teams/JoinTeamModal.tsx) - Join modal (197 lines)

**Navigation Updated:**
- [src/navigation/MainTabNavigator.tsx](src/navigation/MainTabNavigator.tsx) - Added Teams tab

---

## 🔲 To Do: Pool Screens

### 2. Pool Entry Screen
**Purpose:** Create a new tip pool

**UI Components Needed:**
- Team selector dropdown
- Date picker (default: today)
- Shift type selector
- Total pool amount input
- Split type toggle (Equal Hours / Custom %)
- Participant selection:
  - List of team members with checkboxes
  - If Equal Hours: Hour input for each
  - If Custom %: Percentage input for each (show running total)
- Live preview of calculated shares
- "Create Pool" button

**Validation:**
- Show error if percentages don't equal 100%
- Show calculated hourly rate for equal split
- Highlight if user included themselves

### 3. Pool Detail Screen
**Purpose:** View pool breakdown and confirm share

**UI Components Needed:**
- Pool header (date, shift, total amount, status)
- Split type badge
- Participant list showing:
  - Name
  - Hours/Percentage
  - Share amount
  - Confirmation status (✓ or ⏱)
- If user is participant and unconfirmed:
  - Prominent "Confirm My Share" button
  - Show their calculated share
- If user is creator:
  - "Finalize Pool" button (locks pool)
  - "Cancel Pool" button
- Pool statistics

### 4. AddTipScreen Update
**Purpose:** Add "Pool Tips" tab alongside Quick/AI Entry

**Changes:**
- Add third tab: "Pool Tips"
- Show list of pending pools awaiting confirmation
- Tap pool → navigate to Pool Detail screen
- Badge showing count of pending confirmations

### 5. Notifications
**Purpose:** Alert users when added to pools

**Implementation:**
- Use Expo Notifications
- Trigger when:
  - Added as participant to new pool
  - Pool is finalized (if haven't confirmed)
  - Pool is cancelled
- Deep link to Pool Detail screen

### 6. Premium Gating
**Purpose:** Enforce 1 team free, unlimited premium

**Implementation:**
- Check team count before allowing "Create Team"
- Check team count before allowing "Join Team"
- Show premium upgrade prompt if limit reached
- Add "Teams" to premium feature list in upgrade modal

---

## Data Flow Examples

### Creating a Pool (Equal Hours)

```
User Flow:
1. Navigate to Teams → Select team → "New Pool"
2. Enter pool details:
   - Date: 2025-01-15
   - Shift: Dinner
   - Total: $400
   - Split: Equal Hours
3. Select participants:
   - Alice: 5 hours
   - Bob: 4 hours
   - Charlie: 3 hours
4. Preview shows:
   - Total hours: 12
   - Hourly rate: $33.33/hr
   - Alice: $166.67
   - Bob: $133.33
   - Charlie: $100.00
5. Tap "Create Pool"

Backend:
1. Validate user is team member
2. Create tip_pool record (status: draft)
3. Calculate shares (400 / 12 = 33.33/hr)
4. Insert pool_participants with calculated amounts
5. Send notifications to Alice, Bob, Charlie
```

### Confirming a Share

```
User Flow:
1. Receive notification "You're in a tip pool for $166.67"
2. Tap notification → Pool Detail screen
3. Review pool:
   - Total: $400
   - Your hours: 5h
   - Your share: $166.67
   - Status: 2/3 confirmed
4. Tap "Confirm My Share"

Backend:
1. Verify participant belongs to current user
2. Update pool_participants.confirmed = true
3. Set confirmed_at timestamp
4. (Future) Create tip_entry with share_amount
5. Show success message
```

---

## Next Steps

**Priority 1 - Core UI:**
1. Teams Screen (list, create, join)
2. Pool Entry Screen (create pool with both split types)
3. Pool Detail Screen (view + confirm)

**Priority 2 - Integration:**
4. Add "Pool Tips" tab to AddTipScreen
5. Show pending pool count badge
6. Premium gating logic

**Priority 3 - Polish:**
7. Notifications setup
8. Pool history view
9. Team statistics
10. End-to-end testing

---

## Database Migration Instructions

**To apply the schema:**

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `supabase/migrations/20250115000000_create_teams_and_pools.sql`
3. Verify tables created:
   - workplaces
   - workplace_memberships
   - tip_pools
   - pool_participants

**Test data (optional):**
```sql
-- Create a test workplace
INSERT INTO workplaces (name, invite_code, created_by)
VALUES ('Test Restaurant', 'ABC123', auth.uid());

-- Join as member
INSERT INTO workplace_memberships (workplace_id, user_id, role)
VALUES ('[workplace-id]', auth.uid(), 'owner');
```

---

## API Usage Examples

### Create Team
```typescript
import { createWorkplace } from './services/api/teams';

const team = await createWorkplace({ name: "Joe's Diner" });
console.log(`Invite code: ${team.invite_code}`);
// Output: Invite code: XY7K9P
```

### Join Team
```typescript
import { joinWorkplace } from './services/api/teams';

const team = await joinWorkplace({ invite_code: "XY7K9P" });
console.log(`Joined: ${team.name}`);
```

### Create Pool (Equal Hours)
```typescript
import { createTipPool } from './services/api/tipPools';

const pool = await createTipPool({
  workplace_id: 'uuid',
  date: '2025-01-15',
  shift_type: 'dinner',
  total_amount: 400,
  split_type: 'equal_hours',
  participants: [
    { user_id: 'alice-id', hours_worked: 5 },
    { user_id: 'bob-id', hours_worked: 4 },
    { user_id: 'charlie-id', hours_worked: 3 },
  ],
});
```

### Create Pool (Custom Percentage)
```typescript
const pool = await createTipPool({
  workplace_id: 'uuid',
  date: '2025-01-15',
  shift_type: 'dinner',
  total_amount: 400,
  split_type: 'custom_percentage',
  participants: [
    { user_id: 'bartender-id', percentage: 40 },  // $160
    { user_id: 'server1-id', percentage: 30 },    // $120
    { user_id: 'server2-id', percentage: 30 },    // $120
  ],
});
```

### Confirm Share
```typescript
import { confirmPoolShare } from './services/api/tipPools';

await confirmPoolShare({
  pool_id: 'pool-uuid',
  participant_id: 'participant-uuid',
});
```

---

## Files Created

✅ Backend:
- `supabase/migrations/20250115000000_create_teams_and_pools.sql` - Database schema
- `src/types/teams.ts` - TypeScript types
- `src/services/api/teams.ts` - Team management API (242 lines)
- `src/services/api/tipPools.ts` - Tip pool API (324 lines)

✅ Frontend - Teams Screen:
- `src/screens/teams/TeamsScreen.tsx` - Main teams screen (443 lines)
- `src/screens/teams/CreateTeamModal.tsx` - Create team modal (179 lines)
- `src/screens/teams/JoinTeamModal.tsx` - Join team modal (197 lines)

✅ Navigation:
- `src/navigation/MainTabNavigator.tsx` - Updated to add Teams tab

🔲 Frontend (To Do):
- `src/screens/pools/PoolEntryScreen.tsx`
- `src/screens/pools/PoolDetailScreen.tsx`
- `src/components/cards/PoolCard.tsx`
- `src/components/cards/PendingPoolCard.tsx`
- AddTipScreen pool tips tab integration

---

## Questions for Next Session

1. **UI Design Preferences:**
   - Should teams have profile pictures/colors for visual distinction?
   - Card-based layout or list view for pools?

2. **Navigation:**
   - Add "Teams" as 5th tab in bottom nav?
   - Or nest under Settings?

3. **Confirmations:**
   - When user confirms share, should it auto-create a tip entry?
   - Or keep pool tips separate from individual tracking?

4. **Pool History:**
   - Should there be a dedicated "Pool History" view?
   - Or just show in main tip history with a badge?

5. **Member Management:**
   - Should team owners be able to remove members?
   - Transfer ownership feature needed?
