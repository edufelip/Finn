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
