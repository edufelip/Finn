# Community Moderation System - Testing Guide

**Quick Reference for Manual Testing**

---

## 🚀 Getting Started

### 1. Prerequisites
```bash
# Ensure dependencies are installed
npm install

# Start Metro bundler
npm run start

# Run on iOS
npm run ios

# OR run on Android
npm run android
```

### 2. Database Setup
```bash
# Apply migrations (if not already applied)
cd supabase
supabase db push

# Verify tables exist
# Check Supabase dashboard → Database → Tables
# Should see: community_moderators, moderation_logs
```

### 3. Create Test Users
You'll need at least 3 test users:
- **User A:** Community owner
- **User B:** Community moderator
- **User C:** Regular member

---

## 🧪 Test Scenarios

### Scenario 1: Create & Configure Moderated Community
**User:** Owner (User A)

**Steps:**
1. Create new community
2. Navigate to Profile → My Communities tab
3. Tap "Manage" on your community
4. **Expected:** EditCommunityScreen opens
5. Change "Post Permission" to "Moderated"
6. Tap "Save"
7. **Expected:** Success message + navigation back
8. Navigate back to EditCommunity → Moderation Logs
9. **Expected:** See log entry for "Settings Changed"

**Pass Criteria:**
- ✅ My Communities tab shows owned communities
- ✅ Manage button works
- ✅ Radio buttons change selection
- ✅ Save button only enabled after change
- ✅ Moderation log created

---

### Scenario 2: Add Moderator
**User:** Owner (User A)

**Steps:**
1. In EditCommunityScreen, tap "Manage Moderators"
2. **Expected:** ManageModeratorsScreen opens
3. Tap "Add Moderator" button
4. **Expected:** Alert prompt appears
5. Enter User B's ID
6. Tap "Add"
7. **Expected:** Success alert + User B appears in list
8. Navigate to Moderation Logs
9. **Expected:** See log entry for "Moderator Added"

**Pass Criteria:**
- ✅ Alert prompt accepts user ID
- ✅ New moderator appears in list immediately
- ✅ Avatar shows photo if available; otherwise shows initial letter fallback
- ✅ Moderation log created

---

### Scenario 3: Regular User Posts in Moderated Community
**User:** Regular Member (User C)

**Steps:**
1. Navigate to moderated community
2. Tap "Create Post" button
3. **Expected:** Orange/tertiary info banner appears
4. **Expected:** Banner says "This community requires moderator approval..."
5. Write post content
6. Tap "Post"
7. **Expected:** Alert says "Post Submitted" (pending approval)
8. Go back to community feed
9. **Expected:** Post does NOT appear in feed yet

**Pass Criteria:**
- ✅ Disclaimer banner visible
- ✅ Different success message
- ✅ Post not visible immediately
- ✅ Post has moderation_status = 'pending'

---

### Scenario 4: Moderator Approves Pending Post
**User:** Moderator (User B) or Owner (User A)

**Steps:**
1. Navigate to community → EditCommunity
2. Tap "Pending Content" (should show badge "1")
3. **Expected:** See User C's post with Approve/Reject buttons
4. Tap "Approve"
5. **Expected:** Confirmation dialog appears
6. Tap "Approve" again
7. **Expected:** Success alert + post disappears from list
8. Navigate to community feed
9. **Expected:** User C's post now visible
10. Check Moderation Logs
11. **Expected:** See log entry for "Post Approved"

**Pass Criteria:**
- ✅ Badge shows correct count
- ✅ Post displays with PostCard
- ✅ Confirmation dialog works
- ✅ Optimistic UI update (immediate removal)
- ✅ Post appears in feed after approval
- ✅ Moderation log created

---

### Scenario 5: Report a Post
**User:** Any user (User C)

**Steps:**
1. Find any post in community feed
2. Tap 3-dot menu on post
3. **Expected:** See "Save" and "Report" options
4. Tap "Report"
5. **Expected:** Report modal opens with reasons
6. Select reason (e.g., "Spam")
7. Tap "Submit"
8. **Expected:** Success alert

**Pass Criteria:**
- ✅ Report modal displays reasons
- ✅ Can select reason
- ✅ Success message appears
- ✅ Report created in database

---

### Scenario 6: Handle Reported Content
**User:** Moderator (User B) or Owner (User A)

**Steps:**
1. Navigate to EditCommunity → "Reported Content"
2. **Expected:** See reported post with custom card
3. **Expected:** Card shows:
   - Reporter avatar and name
   - Report reason
   - Post preview
   - Flag badge
4. Tap "Mark Safe"
5. **Expected:** Confirmation dialog
6. Tap "Mark Safe" again
7. **Expected:** Report disappears from list
8. Check Moderation Logs
9. **Expected:** See log entry for "Marked Safe"

**Pass Criteria:**
- ✅ Report card displays all info
- ✅ Both Delete and Mark Safe buttons work
- ✅ Confirmation dialogs appear
- ✅ Optimistic UI update
- ✅ Moderation log created

---

### Scenario 7: Mark Post for Review
**User:** Moderator (User B) or Owner (User A)

**Steps:**
1. Navigate to community feed
2. Find any approved post
3. Tap 3-dot menu
4. **Expected:** See "Mark for Review" option (flag icon, orange color)
5. **Expected:** "Report" option still visible (different icon/color)
6. Tap "Mark for Review"
7. **Expected:** Confirmation dialog
8. Tap "Mark"
9. **Expected:** Success alert
10. Check Moderation Logs
11. **Expected:** See log entry for "Marked for Review"

**Pass Criteria:**
- ✅ Option only visible to mods/owners
- ✅ Visually distinct from Report option
- ✅ Confirmation dialog works
- ✅ Moderation log created

---

### Scenario 8: Mod/Owner Bypasses Moderation
**User:** Moderator (User B) or Owner (User A)

**Steps:**
1. Navigate to moderated community
2. Tap "Create Post" button
3. **Expected:** NO disclaimer banner appears
4. Write post content
5. Tap "Post"
6. **Expected:** Standard "Posted" success message
7. Navigate to community feed
8. **Expected:** Post appears IMMEDIATELY in feed
9. Check PendingContent screen
10. **Expected:** Post does NOT appear there

**Pass Criteria:**
- ✅ No disclaimer for mods/owners
- ✅ Standard success message
- ✅ Post appears immediately
- ✅ Post not in pending queue
- ✅ Post has moderation_status = 'approved'

---

### Scenario 9: Remove Moderator
**User:** Owner (User A) ONLY

**Steps:**
1. Navigate to ManageModeratorsScreen
2. **Expected:** See remove button (X icon) next to User B
3. Tap remove button
4. **Expected:** Confirmation dialog
5. Tap "Remove"
6. **Expected:** Success alert + User B removed from list
7. Check Moderation Logs
8. **Expected:** See log entry for "Moderator Removed"
9. **Switch to User B**
10. Try to access PendingContent
11. **Expected:** "Not Authorized" alert + redirected

**Pass Criteria:**
- ✅ Only owner sees remove buttons
- ✅ Confirmation dialog works
- ✅ Immediate UI update
- ✅ Moderation log created
- ✅ Removed mod loses access immediately

---

### Scenario 10: Non-Mod Authorization Checks
**User:** Regular Member (User C)

**Steps:**
1. Try to navigate to EditCommunity (if possible)
2. **Expected:** Redirected with "Not Authorized" alert
3. Try to navigate to PendingContent
4. **Expected:** Redirected with "Not Authorized" alert
5. View post 3-dot menu
6. **Expected:** "Mark for Review" option NOT visible
7. **Expected:** Only "Save" and "Report" visible

**Pass Criteria:**
- ✅ All moderation screens blocked
- ✅ Mark for Review not visible
- ✅ Clear error messages

---

---

### Scenario 11: Home Feed Tabs & Following Feed
**User:** Authenticated User (User A) and Guest

**Steps (Authenticated):**
1. Navigate to Home
2. **Expected:** Two tabs visible: "Communities" and "People"
3. Tap "People"
4. **Expected:** Feed switches to posts from followed users
5. Scroll down in "People" tab, then switch back to "Communities"
6. **Expected:** "Communities" tab preserves its previous scroll position
7. Follow a new user (from Explore or Search)
8. Return to Home → "People" and pull to refresh
9. **Expected:** New user's posts appear in the feed

**Steps (Guest):**
1. Open app as Guest
2. Navigate to Home → "People" tab
3. **Expected:** Empty state visible with "Sign in to start following people..." message
4. Tap the "Sign in" button in the empty state
5. **Expected:** Redirected to Auth/Login screen

**Pass Criteria:**
- ✅ Tabs are visible and functional
- ✅ Scroll state is preserved when switching tabs
- ✅ Refreshing loads new data for the active tab
- ✅ Guest sees specific empty state with login CTA

---

### Scenario 12: Internationalization (i18n) & Language Switching
**User:** Any user (Authenticated or Guest)

**Steps (Language Switching):**
1. Navigate to Settings screen
2. **Expected:** See language selection buttons: English, Português, Español, Français, Deutsch, 日本語, العربية
3. Tap "日本語" (Japanese)
4. **Expected:** All UI text immediately updates to Japanese
5. **Expected:** Navigation headers, buttons, labels, placeholders all in Japanese
6. Tap back to Settings
7. Tap "Português" (Portuguese)
8. **Expected:** All UI text immediately updates to Portuguese
9. Navigate to Home, Search, Profile tabs
10. **Expected:** All screens display Portuguese text

**Steps (RTL - Arabic):**
1. Navigate to Settings
2. Tap "العربية" (Arabic)
3. **Expected:** Alert appears: "Restart Required - Please restart the app for the layout direction to change"
4. Tap "OK"
5. Close and restart the app
6. **Expected:** App layout is now RTL:
   - Navigation bar on right side
   - Text right-aligned
   - Icons and chevrons flipped horizontally
   - Tab bar icons remain in same position but labels right-aligned
7. Navigate through all screens
8. **Expected:** All layouts respect RTL direction
9. Go to Settings and select English
10. **Expected:** Alert to restart app
11. Restart app
12. **Expected:** Layout returns to LTR

**Steps (Date Formatting):**
1. Set language to English
2. View post timestamps in feed
3. **Expected:** English format: "5 minutes ago", "Jan 24, 2026"
4. Set language to Japanese
5. **Expected:** Japanese format: "5分前", "2026年1月24日"
6. Set language to Arabic
7. Restart app for RTL
8. **Expected:** Arabic format: "منذ ٥ دقائق", "٢٤ يناير ٢٠٢٦" (Arabic numerals)

**Pass Criteria:**
- ✅ All 7 languages available in Settings
- ✅ Language switches immediately (no app restart except for RTL)
- ✅ All screens and components update text
- ✅ Arabic triggers RTL layout after restart
- ✅ RTL layout properly reverses all UI elements
- ✅ Switching from Arabic back to LTR works correctly
- ✅ Date/time formatting matches locale conventions
- ✅ No missing translations (no fallback keys displayed)
- ✅ Interpolation works (e.g., "Posted by {name}" shows actual name)

---

### Scenario 13: Community Search with Pagination
**User:** Any user (Authenticated or Guest)

**Steps (Basic Search):**
1. Navigate to Search tab
2. Type "tech" in search input
3. **Expected:** First 20 communities matching "tech" appear
4. **Expected:** Loading indicator during fetch
5. Scroll to bottom of list
6. **Expected:** If >20 results exist, next page loads automatically
7. **Expected:** "Loading more..." indicator appears
8. **Expected:** Next 20 communities appended to list
9. Continue scrolling
10. **Expected:** When fewer than 20 results returned, pagination stops

**Steps (Filter by Topic):**
1. Clear search input (empty query)
2. Tap "Filter by Topic" button
3. Select "Technology" from alert
4. **Expected:** Results refresh to show only Technology communities
5. **Expected:** Page resets to 0 (starts from beginning)
6. **Expected:** Filter chip appears showing "Technology"
7. Tap X on filter chip
8. **Expected:** Filter cleared, all communities shown again

**Steps (Sort Order):**
1. Tap "Sort by" button
2. Select "Newest" from alert
3. **Expected:** Results re-sort by creation date (newest first)
4. **Expected:** Page resets to 0
5. Scroll down to load more pages
6. **Expected:** All pages maintain "Newest" sort order

**Steps (Combined Search + Filter + Sort):**
1. Type "react" in search
2. Tap "Filter by Topic" → select "Technology"
3. Tap "Sort by" → select "Most Followed"
4. **Expected:** Results show React communities in Technology topic, sorted by followers (descending)
5. Scroll to load multiple pages
6. **Expected:** All pages maintain combined filters

**Pass Criteria:**
- ✅ Initial load fetches exactly 20 communities (or fewer if total < 20)
- ✅ Pagination loads next page when scrolling near bottom
- ✅ No duplicate communities in paginated results
- ✅ Loading indicators show during initial load and pagination
- ✅ Changing any filter (search/topic/sort) resets to page 0
- ✅ Search is case-insensitive and matches partial titles
- ✅ Topic filter works correctly
- ✅ All 4 sort orders work (Most Followed, Least Followed, Newest, Oldest)
- ✅ Combined filters work together correctly
- ✅ Guest users can search and paginate without restrictions

---

## 🔍 Data Verification

### Check Database Records

After completing test scenarios, verify in Supabase dashboard:

#### 1. community_moderators table
```sql
SELECT * FROM community_moderators 
WHERE community_id = <test_community_id>;
```
**Expected:** Rows for added moderators (or empty if removed)

#### 2. moderation_logs table
```sql
SELECT * FROM moderation_logs 
WHERE community_id = <test_community_id>
ORDER BY created_at DESC;
```
**Expected:** All actions logged:
- settings_changed
- moderator_added
- moderator_removed
- approve_post
- mark_safe
- mark_for_review

#### 3. posts table (moderation_status)
```sql
SELECT id, content, moderation_status 
FROM posts 
WHERE community_id = <test_community_id>;
```
**Expected:**
- Approved posts: `moderation_status = 'approved'`
- Pending posts: `moderation_status = 'pending'`
- Rejected posts: `moderation_status = 'rejected'`

#### 4. post_reports table
```sql
SELECT * FROM post_reports 
WHERE post_id IN (
  SELECT id FROM posts WHERE community_id = <test_community_id>
);
```
**Expected:**
- New reports: `status = 'pending'`
- Handled reports: `status = 'reviewed'`

---

## 🐛 Common Issues & Solutions

### Issue 1: "Not Authorized" on all screens
**Cause:** RLS policies not applied or user not logged in  
**Solution:**
1. Verify migrations applied: `supabase db push`
2. Check user is logged in with valid session
3. Verify community owner_id matches user ID

### Issue 2: Badge counts show 0 when posts exist
**Cause:** Repository method not filtering correctly  
**Solution:**
1. Check `getPendingPosts()` filters by `moderation_status = 'pending'`
2. Check `getReportsByStatus()` filters correctly
3. Verify RLS policies allow reading

### Issue 3: Post doesn't appear after approval
**Cause:** Frontend cache not updated  
**Solution:**
1. Check `setCommunityPosts()` called after approval
2. Verify optimistic UI update logic
3. Try refreshing feed manually

### Issue 4: Moderation log not created
**Cause:** createLog() not called or fails silently  
**Solution:**
1. Add try-catch around log creation
2. Check Supabase logs for errors
3. Verify user has permission to insert

### Issue 5: "Mark for Review" visible to non-mods
**Cause:** canModerate prop not passed correctly  
**Solution:**
1. Verify `canModerate` state updated in CommunityDetailScreen
2. Check prop passed to PostCard correctly
3. Verify isModerator() check works

---

## ✅ Quick Checklist

Use this for rapid testing:

### UI Screens
- [ ] ProfileScreen → My Communities tab works
- [ ] EditCommunityScreen opens and saves
- [ ] PendingContentScreen lists pending posts
- [ ] ReportedContentScreen lists reports
- [ ] ModerationLogsScreen shows all logs
- [ ] ManageModeratorsScreen lists mods

### Authorization
- [ ] Owner can access all screens
- [ ] Moderator can access (not add/remove mods)
- [ ] Regular user blocked from all screens

### Post Moderation
- [ ] Regular user post → pending status
- [ ] Mod/owner post → approved status
- [ ] Approve button works + creates log
- [ ] Reject button works + creates log

### Report Handling
- [ ] Report submission works
- [ ] Reports visible in ReportedContent
- [ ] Delete button works + creates log
- [ ] Mark Safe button works + creates log

### Moderator Management
- [ ] Add moderator works + creates log
- [ ] Remove moderator works + creates log
- [ ] Only owner can add/remove

### UI/UX
- [ ] Disclaimer shows for non-mods
- [ ] Badge counts accurate
- [ ] Confirmation dialogs appear
- [ ] Success/error messages clear
- [ ] Empty states display correctly

### Internationalization (i18n)
- [ ] All 7 languages available in Settings
- [ ] Language switching updates UI immediately
- [ ] Arabic enables RTL layout after restart
- [ ] RTL layout properly reverses UI
- [ ] Date formatting matches locale
- [ ] No missing translations visible

### Search & Pagination
- [ ] Search returns correct results
- [ ] Pagination loads next page on scroll
- [ ] No duplicate results
- [ ] Filter by topic works
- [ ] Sort orders work correctly
- [ ] Combined filters work together

---

## 📊 Test Results Template

```
Test Date: __________
Tester: __________
Device: __________
OS Version: __________

| Scenario | Pass | Fail | Notes |
|----------|------|------|-------|
| 1. Create Moderated Community | [ ] | [ ] | |
| 2. Add Moderator | [ ] | [ ] | |
| 3. Regular User Posts | [ ] | [ ] | |
| 4. Approve Pending Post | [ ] | [ ] | |
| 5. Report a Post | [ ] | [ ] | |
| 6. Handle Reported Content | [ ] | [ ] | |
| 7. Mark Post for Review | [ ] | [ ] | |
| 8. Mod/Owner Bypasses Moderation | [ ] | [ ] | |
| 9. Remove Moderator | [ ] | [ ] | |
| 10. Non-Mod Authorization | [ ] | [ ] | |
| 11. Home Feed Tabs & Following | [ ] | [ ] | |
| 12. i18n & Language Switching | [ ] | [ ] | |
| 13. Community Search & Pagination | [ ] | [ ] | |

Overall Status: [ ] PASS | [ ] FAIL

Critical Issues Found:
1. 
2. 
3. 

Minor Issues Found:
1. 
2. 
3. 

Recommendations:
1. 
2. 
3. 
```

---

## 🎯 Success Criteria

The implementation is **READY FOR PRODUCTION** when:

✅ All 10 test scenarios pass  
✅ Authorization checks work for all user types  
✅ All moderation logs created correctly  
✅ No crashes or errors during normal use  
✅ UI/UX feels smooth and responsive  
✅ Database records match expected state  
✅ Error messages are clear and helpful  

---

**Good luck testing! Report any issues for immediate resolution.** 🚀
