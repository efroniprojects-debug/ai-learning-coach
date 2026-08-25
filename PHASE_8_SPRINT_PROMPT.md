# Phase 8: Advanced Features — SPRINT PROMPT
**Duration:** 4-6 weeks  
**Goal:** Platform differentiation (live tutoring, mobile, advanced features)  
**Owner:** Claude Code / AI Agent  
**Date Created:** 2026-08-25

---

## Overview

Add premium features that differentiate the platform. Pick **1-2 features** per sprint based on priority & resources.

---

## Feature Options

### 8A: Live Tutoring (WebSocket + Video) — 2 weeks
**Goal:** Real-time 1-on-1 tutoring sessions

**Features:**
- WebSocket connection for real-time messaging
- Optional video stream (Jitsi/Twilio)
- Collaborative whiteboard (canvas)
- Session recording
- Scheduling system

**Impact:** High (premium feature, recurring revenue)

---

### 8B: Mobile App (React Native) — 3 weeks
**Goal:** iOS/Android native apps

**Features:**
- Offline mode (sync when online)
- Native camera for handwriting
- Push notifications
- App store deployment

**Impact:** Medium (expands addressable market)

---

### 8C: Video Explanations — 1 week
**Goal:** AI-generated tutor videos

**Features:**
- Text-to-speech (tutor voice)
- Screen recording of explanation steps
- Animated diagrams
- Video hosting (YouTube/Vimeo)

**Impact:** Medium (higher engagement)

---

### 8D: Peer Learning (Discussion Forums) — 2 weeks
**Goal:** Community-driven learning

**Features:**
- Question/answer forum
- Upvoting & reputation
- Verified solutions
- Moderation tools

**Impact:** Medium (community lock-in)

---

### 8E: Family Accounts (Parent Dashboard) — 2 weeks
**Goal:** Multi-student management

**Features:**
- Parent accounts
- Student account linking
- Progress monitoring
- Goal setting & reminders

**Impact:** Medium (B2C household revenue)

---

### 8F: Adaptive Study Plans — 1 week
**Goal:** AI-generated personalized study paths

**Features:**
- Goal setting (exam prep, mastery)
- Recommended topics
- Time allocation per concept
- Milestone tracking

**Impact:** High (engagement multiplier)

---

## Pick One: Detailed Instructions Below

---

# 8A: Live Tutoring (Recommended First)

## Task 8A.1: WebSocket Infrastructure
**Backend:**
- Upgrade Fastify to support WebSockets (socket.io or ws)
- Session management (who's connected)
- Message routing (user ↔ tutor)

**Frontend:**
- WebSocket client
- Real-time message UI

## Task 8A.2: Session Management
**Database:**
```sql
CREATE TABLE tutoring_sessions (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  tutor_id UUID REFERENCES users(id),
  subject VARCHAR(50),
  topic VARCHAR(255),
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  status VARCHAR(20),  -- scheduled, active, completed
  recording_url VARCHAR(500),
  rating INTEGER,
  notes TEXT
);

CREATE TABLE session_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES tutoring_sessions(id),
  sender_id UUID REFERENCES users(id),
  message TEXT,
  type VARCHAR(20),  -- text, code, image, whiteboard
  created_at TIMESTAMP
);
```

## Task 8A.3: Scheduling System
**Features:**
- Calendar view
- Tutor availability blocks
- Student booking
- Confirmation & reminders

## Task 8A.4: Whiteboard
**Library:** Fabric.js (canvas collaboration)

**Features:**
- Draw, erase, shapes
- LaTeX input
- Sync across participants
- Save as image

## Task 8A.5: Optional Video
**Service:** Jitsi (self-hosted) or Twilio (managed)

**Acceptance:**
- [ ] WebSocket connection stable
- [ ] Messages sync real-time
- [ ] Whiteboard drawing works
- [ ] Session recording (optional)
- [ ] Commit: `feat: Implement live tutoring system`

---

# 8B: Mobile App (React Native)

## Task 8B.1: Project Setup
```bash
npx create-expo-app ai-learning-coach-mobile
cd ai-learning-coach-mobile
npm install @react-navigation/native @react-navigation/bottom-tabs
```

## Task 8B.2: Core Screens
**Replicate:**
- Login (OAuth)
- Dashboard
- Ask Question
- Practice
- Progress

**Use:**
- React Navigation (bottom tabs)
- React Native Paper (UI components)
- Same axios API calls

## Task 8B.3: Offline Mode
**Storage:** SQLite (expo-sqlite)

**Strategy:**
- Cache API responses locally
- Queue actions when offline
- Sync when online

## Task 8B.4: Camera Integration
**Feature:** Photograph handwritten problems, OCR them

**Libraries:**
- expo-camera (camera access)
- tesseract.js (OCR)

## Task 8B.5: Push Notifications
**Service:** Firebase Cloud Messaging (FCM)

**Triggers:**
- Practice reminders
- New explanations ready
- Mastery level ups

**Acceptance:**
- [ ] App runs on iOS simulator
- [ ] App runs on Android emulator
- [ ] Login/logout works
- [ ] Can ask questions offline
- [ ] Sync works when online
- [ ] Commit: `feat: Release mobile app (React Native)`

---

# 8C: Video Explanations

## Task 8C.1: Text-to-Speech
**Service:** Google Cloud TTS or OpenAI

**Workflow:**
1. AI generates explanation text
2. Convert to speech (MP3)
3. Host on Cloud Storage
4. Embed in UI

**Code:**
```typescript
// Generate voice
const audioUrl = await generateTutor Video('Here\'s the solution...');

// Play in UI
<audio src={audioUrl} controls />
```

## Task 8C.2: Animated Steps
**Library:** framer-motion or Lottie

**Idea:**
- Show each step of solution
- Animate diagrams
- Highlight key points

## Task 8C.3: Video Hosting
**Service:** YouTube or Vimeo

**Upload generated videos**
**Embed in explanation view**

**Acceptance:**
- [ ] Audio generated for explanations
- [ ] Video playback works
- [ ] Diagrams animated
- [ ] Commit: `feat: Add AI-generated video tutoring`

---

# 8D: Peer Learning (Forum)

## Task 8D.1: Forum Database
```sql
CREATE TABLE forum_posts (
  id UUID,
  subject VARCHAR(50),
  topic VARCHAR(255),
  author_id UUID,
  title VARCHAR(500),
  content TEXT,
  votes INTEGER,
  answers_count INTEGER,
  created_at TIMESTAMP
);

CREATE TABLE forum_answers (
  id UUID,
  post_id UUID REFERENCES forum_posts(id),
  author_id UUID,
  content TEXT,
  verified BOOLEAN,
  votes INTEGER,
  created_at TIMESTAMP
);
```

## Task 8D.2: Forum UI
**Components:**
- Post list (sorted by votes/recent)
- Post detail + answers
- Create post/answer forms
- Upvote button

## Task 8D.3: Moderation
**Features:**
- Flag spam/inappropriate
- Admin review
- Delete/hide posts

**Acceptance:**
- [ ] Users can post questions
- [ ] Users can answer
- [ ] Voting works
- [ ] Moderation queue visible to admins
- [ ] Commit: `feat: Add peer learning forum`

---

# 8E: Family Accounts

## Task 8E.1: Database Schema
```sql
CREATE TABLE family_groups (
  id UUID,
  parent_id UUID REFERENCES users(id),
  created_at TIMESTAMP
);

CREATE TABLE family_members (
  id UUID,
  family_id UUID REFERENCES family_groups(id),
  student_id UUID REFERENCES users(id),
  role VARCHAR(20),  -- parent, student
  created_at TIMESTAMP
);
```

## Task 8E.2: Parent Dashboard
**Views:**
- List of students
- Each student's progress
- Goal management
- Notifications

**Components:**
- `FamilyDashboard`
- `StudentProgressCard`
- `GoalSetter`

## Task 8E.3: Student Linking
**Flow:**
1. Parent creates family group
2. Parent invites students (email)
3. Student accepts invite
4. Progress visible to parent

**Acceptance:**
- [ ] Parent can create group
- [ ] Can invite multiple students
- [ ] Student invites work
- [ ] Progress visible to parent
- [ ] Commit: `feat: Add family accounts & parent dashboard`

---

# 8F: Adaptive Study Plans

## Task 8F.1: Plan Generation
**Inputs:**
- Goal (mastery, exam prep)
- Timeline (weeks available)
- Preferred subjects

**Algorithm:**
1. Identify weak concepts (low ELO)
2. Estimate time per concept
3. Schedule in priority order
4. Add review cycles

**Code:**
```typescript
function generateStudyPlan(userId, goal, weekAvailable) {
  const weakConcepts = getWeakConcepts(userId);  // ELO < 1200
  const totalTime = weekAvailable * 35;  // hours
  
  const plan = [];
  for (const concept of weakConcepts) {
    const timeNeeded = estimateTimeToMastery(concept);
    plan.push({
      concept,
      weekStart: calculateWeekStart(plan),
      dailyMinutes: timeNeeded / 7
    });
  }
  return plan;
}
```

## Task 8F.2: Plan UI
**Components:**
- `StudyPlanView` (timeline visualization)
- `TodaysTasks` (what to work on today)
- `MilestoneProgress` (visual progress bar)

## Task 8F.3: Reminders
**Features:**
- Daily email reminder
- Push notification
- Adjust plan based on progress

**Acceptance:**
- [ ] Plans generated automatically
- [ ] UI shows weekly milestones
- [ ] User sees today's tasks
- [ ] Can adjust time allocation
- [ ] Commit: `feat: Add adaptive study plans`

---

## How to Choose

| Feature | If You Want | Effort | Revenue |
|---------|-------------|--------|---------|
| Live Tutoring | Premium tutors | 3 weeks | ⭐⭐⭐ |
| Mobile | Bigger audience | 3 weeks | ⭐⭐ |
| Video | Higher engagement | 1 week | ⭐ |
| Forum | Community | 2 weeks | ⭐⭐ |
| Family | Household revenue | 2 weeks | ⭐⭐⭐ |
| Study Plans | Engagement | 1 week | ⭐⭐ |

---

## Recommended Path

1. **Phase 8A (Week 1):** Study Plans (quick win for engagement)
2. **Phase 8B (Week 2-3):** Family Accounts (household growth)
3. **Phase 8C (Week 4-5):** Live Tutoring (premium differentiation)
4. **Phase 8D (Week 6+):** Community Forum (scale beyond tutors)

---

## Git Workflow

```bash
git checkout -b feature/phase-8-{feature-name}
# Implement feature
git add .
git commit -m "feat: Add {feature-name}"
git push origin feature/phase-8-{feature-name}
# Create PR, review, merge
```

---

**Owner:** Sharon Afroni  
**Created:** 2026-08-25  
**Status:** Ready to start (choose 1 feature)
