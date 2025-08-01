# Events Section Implementation Plan

## Overview
The events section allows users and businesses to create, manage, and discover marine-related events in Florida.

## Key Design Decisions

### 1. Event Visibility
- **Public**: Shows on main calendar (requires approval)
- **Private**: Only visible to invited users
- No separate "community" section

### 2. Event Attribution
- **Author**: Who posted the event (always shown)
- **Organizer**: Business from our directory (required)
- **Associated Businesses**: Tagged businesses (vendors, sponsors, etc.)

### 3. Verification Workflow
1. User creates event and lists organizer
2. System notifies organizer business
3. Organizer can:
   - Verify and claim management
   - Request corrections
   - Disassociate (sends event back for revision)
   - Report as fraudulent

### 4. Business Association System
- Simple tagging system (like @mentions)
- Tagged businesses get notified
- Businesses can add their own details later
- No burden on event creator

## Database Schema

### Core Tables
1. **event_venues** - Reusable venue information
2. **events** - Main event details with author/organizer tracking
3. **event_business_associations** - Many-to-many business relationships
4. **event_attendees** - RSVP and attendance tracking
5. **event_updates** - Announcements to attendees
6. **event_photos** - Event photo gallery

### Key Features
- Approval workflow (pending → approved/rejected)
- Organizer verification status
- Analytics tracking (views, clicks)
- Private event invitations

## Implementation Phases

### Phase 1: Basic Event Display ✅
- [x] Create database schema
- [x] Create event listing page
- [ ] Create event detail page
- [ ] Implement filtering/search

### Phase 2: Event Creation
- [ ] Create event form
- [ ] Venue selection/creation
- [ ] Business organizer selection
- [ ] Business tagging interface

### Phase 3: Dashboard & Management
- [ ] Event management dashboard
- [ ] RSVP tracking
- [ ] Attendee management
- [ ] Analytics view

### Phase 4: Notifications & Verification
- [ ] Organizer notification system
- [ ] Verification workflow
- [ ] Business association management
- [ ] Event updates/announcements

### Phase 5: Advanced Features
- [ ] Calendar view
- [ ] iCal export
- [ ] Email invitations
- [ ] Check-in system

## Next Steps

1. **Run Database Migrations**:
   ```sql
   -- In Supabase SQL editor:
   -- 1. Run create_events_schema.sql
   -- 2. Run seed_event_categories.sql
   ```

2. **Update Navigation**: Add Events link to header/footer

3. **Create Event Detail Page**: Full event information display

4. **Implement Filtering**: Make the filter dropdowns functional

## Security Considerations
- RLS policies ensure private events stay private
- Approval process prevents spam
- Business verification prevents impersonation
- Authors always disclosed for transparency