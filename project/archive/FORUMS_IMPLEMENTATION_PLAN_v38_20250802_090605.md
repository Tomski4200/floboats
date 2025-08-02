# Forums Implementation Plan

## Overview
Reddit-style forum system with reputation points, no moderators, and full transparency of user activity.

## Database Schema (Completed ✅)
The SQL migration creates:
- Forum categories (General, Technical, Marketplace, etc.)
- Threads with types (Question, Discussion, Announcement, Poll)
- Nested replies support
- Like system for threads and replies
- Tagging system
- Automatic reputation calculation
- Activity tracking views

## Reputation System Rules
1. **Creating content**:
   - New thread: +1 point
   - New reply: +1 point

2. **Receiving engagement**:
   - Thread liked: +2 points
   - Reply liked: +1 point
   - Thread reaches 5+ replies: +5 bonus points

3. **Automatic updates**: Points calculated in real-time via database triggers

## UI Components Needed

### 1. Forum Homepage (`/forums`)
- Category grid with icons and descriptions
- Recent activity feed
- Top contributors sidebar
- Search bar with filters

### 2. Category Page (`/forums/[category-slug]`)
- Thread list with:
  - Title, author, tags
  - Reply count, like count, view count
  - Last activity timestamp
- Sorting options (newest, popular, most replies)
- "New Thread" button

### 3. Thread Page (`/forums/[category-slug]/[thread-slug]`)
- Original post with full content
- Like button with count
- Reply form
- Nested replies with indentation
- User badges showing reputation
- "Follow Thread" option

### 4. Create Thread Page (`/forums/new`)
- Category selector
- Thread type selector
- Title input
- Rich text editor (markdown)
- Tag selector (multi-select)
- Preview mode

### 5. User Forum Activity (on Profile)
- List of threads created
- List of threads replied to
- Total reputation from forums
- Recent activity timeline

### 6. Components to Build
```
/components/forums/
  ├── ForumCategoryCard.tsx
  ├── ForumThreadList.tsx
  ├── ForumThreadCard.tsx
  ├── ForumReplyTree.tsx
  ├── ForumEditor.tsx (markdown)
  ├── ForumUserBadge.tsx
  ├── ForumTagSelector.tsx
  └── ForumSearch.tsx
```

## Safety Features
1. **Rate Limiting** (implement in API):
   - Max 5 threads per day per user
   - Max 20 replies per day per user
   - Max 50 likes per day per user

2. **Auto-hiding** (via report_count):
   - Hide content with 5+ reports
   - Show "Content hidden due to reports" message

3. **Edit History**:
   - Show "edited" badge with timestamp
   - Consider storing edit history in future

## Implementation Order
1. ✅ Database schema (complete)
2. Forum homepage with categories
3. Category view with thread list
4. Thread creation flow
5. Thread detail view with replies
6. Like functionality
7. User activity on profiles
8. Search and filtering
9. Rate limiting
10. Reporting system

## API Routes Needed
- `GET /api/forums/categories` - List all categories
- `GET /api/forums/threads?category=slug` - List threads
- `GET /api/forums/threads/[id]` - Get thread with replies
- `POST /api/forums/threads` - Create thread
- `POST /api/forums/replies` - Create reply
- `POST /api/forums/likes` - Like/unlike
- `GET /api/forums/user/[id]/activity` - User's forum activity

## Key Features to Highlight
1. **No Moderators**: Community self-regulates through engagement
2. **Reputation Visible**: Shows next to usernames everywhere
3. **Transparency**: Click any user to see their forum history
4. **Engagement Rewards**: More interaction = higher reputation
5. **Clean UI**: Focus on content, not clutter

## Future Enhancements
1. Thread following with notifications
2. Private messaging between users
3. Polls within threads
4. Image uploads in posts
5. Advanced search with filters
6. Reputation milestones/badges
7. Thread bookmarks
8. Mobile app API support