# Testing Notes for FloBoats

## URGENT - First Thing Next Session

**Date Added**: 2025-01-01

To fix the analytics error permanently, you need to:
1. Go to your Supabase dashboard
2. Open the SQL editor
3. Run the migrations in this order:
   - First: create_boat_analytics_tables.sql (if not already done)
   - Second: supabase/migrations/create_analytics_functions.sql
   - Third: supabase/migrations/create_analytics_triggers.sql

This will enable the RPC functions needed for the analytics feature and prevent the "Error loading stats" console error.

## Features Requiring Multi-Account Testing

### 1. Messaging System
**Status**: Implementation complete, testing pending
**Date Added**: 2025-01-01

The messaging system between buyers and sellers has been fully implemented but requires testing with at least two different user accounts to verify:

- [ ] Buyer can send initial message from boat detail page
- [ ] Conversation is created correctly with proper buyer/seller roles
- [ ] Messages appear in real-time for both users
- [ ] Unread message indicators work correctly
- [ ] Message filtering (All/Buying/Selling) works as expected
- [ ] Existing conversation detection prevents duplicates
- [ ] Users cannot message themselves about their own boats
- [ ] Archived conversations behavior
- [ ] Message read receipts update correctly

**Test Scenarios:**
1. User A lists a boat
2. User B views the boat and sends a message
3. User A receives and responds to the message
4. Test real-time updates
5. Test message history persistence
6. Test edge cases (inactive boats, deleted users, etc.)

---

## Other Features to Test

- Add additional features here as they are implemented