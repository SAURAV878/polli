# Polli Product Requirements Document

**Status:** Draft, based on the current repository  
**Product:** Polli  
**Platform:** iOS, Android, and web through Expo

## 1. Product summary

Polli helps beginning language learners build practical communication skills through short, scenario-based exercises. A learner chooses German or French, works through CEFR-style levels and units, practices vocabulary, sentences, and dialogues, and receives immediate feedback and speech playback.

The first product release should make a learner able to create an account, select a language, complete a supported unit, and see accurate, persistent progress across sessions.

## 2. Problem and opportunity

Early language learners need structured, low-friction practice for situations they encounter in daily life: introductions, shopping, directions, travel, and simple conversations. They need exercises that introduce words in context, test comprehension in several ways, and help them hear the target language.

Polli already has a content model organized by level, unit, and exercise mode. The product opportunity is to turn this prototype experience into a reliable learning loop: onboarding, practice, feedback, saved completion, and useful progress insights.

## 3. Target users

### Primary user: practical beginner

- Is learning German or French from little or no prior knowledge.
- Wants short mobile practice sessions for travel, relocation, school, or everyday conversation.
- Benefits from English explanations/translations and audio pronunciation.
- Needs a clear path rather than choosing from an unstructured library.

### Secondary user: returning learner

- Has completed some lessons and wants to resume quickly.
- Wants to see practice time, lesson completion, accuracy, vocabulary growth, and streaks.

## 4. Product goals

1. Enable a new learner to reach and start the first relevant exercise within five minutes.
2. Make each exercise understandable, answerable, and immediately responsive to correct and incorrect answers.
3. Persist learner identity, language/level preferences, and meaningful progress.
4. Provide a course path that accurately reflects available content and unlock state.
5. Establish a reusable content and progress model that can expand to more languages, units, and levels.

## 5. Non-goals for the initial release

- Live tutoring, social learning, or multiplayer features.
- Pronunciation scoring beyond comparing recognized text with the target sentence.
- AI-generated teaching or chat responses. The current chat is a local scripted reply experience.
- Full CEFR coverage before the associated lessons and assessments exist.
- Payments, subscriptions, or certificates.

## 6. User journey

1. A learner opens Polli, creates an account or signs in, and completes basic preferences.
2. They choose German or French and see their current level and next recommended unit.
3. They open a unit and select Word, Sentence, or Dialogue mode.
4. They complete an introduction followed by interactive prompts. Polli gives immediate feedback, allows the configured retry behavior, and offers audio playback where content supports it.
5. A completion screen shows time spent, exercises completed, accuracy, and words learned.
6. Polli saves the session outcome, updates the unit/course state and progress metrics, and shows the result in the Progress tab.
7. On a later visit, the learner resumes the next incomplete lesson.

## 7. Functional requirements

### 7.1 Accounts and onboarding

- A user can register with name, nationality, email, and password.
- Registration validates required fields, email uniqueness, and a six-character minimum password.
- A user can sign in, remain authenticated for the supported session duration, and sign out.
- The app shows loading, validation, and server-error states without displaying an error before a user submits a form.
- A signed-in user can view and update their profile name and password.
- The learner can set a target language and a learning goal. The target language persists with the user profile or dedicated preferences record.

**Acceptance criteria:** Valid registration and login lead to the learning home. Invalid credentials and duplicate accounts have clear recoverable messages. Relaunching the app restores a valid signed-in session or presents sign-in.

### 7.2 Course catalog and navigation

- The Learn tab presents only levels and units that have usable content for the selected language.
- Each level shows its title, description, completion state, and available units.
- Each unit exposes Word, Sentence, and Dialogue modes when that mode has content.
- A learner can start or resume an available exercise from a unit screen.
- Unavailable content is hidden or marked unavailable; users must not enter a blank exercise.
- Unit completion and course completion calculate from persisted exercise outcomes, not local placeholder arrays.

**Acceptance criteria:** Selecting German A1, unit 1 opens each supported mode. Selecting an unsupported level/unit cannot lead to an empty learning flow.

### 7.3 Exercise experience

- Each exercise opens with a short explanation of the objective.
- Word mode supports word introduction, translation multiple choice, and word-to-translation matching.
- Sentence mode supports target-to-English translation, English-to-target translation, fill-in-the-blank, and listen-and-choose prompts.
- Dialogue mode presents a contextually appropriate dialogue prompt and response choices.
- Each answer has a clear Check action, feedback state, and Next/Continue action.
- The first incorrect attempt invites a retry where configured; after the allowed attempts, Polli reveals the correct answer and continues.
- Progress within a session displays the current page and total pages.
- Text-to-speech plays target-language words, sentences, and dialogue lines. Playback stops when the learner leaves the exercise or turns audio off.
- A completion screen reports accurate session metrics: elapsed practice time, completed prompts, accuracy, and words learned.

**Acceptance criteria:** A correct answer increases correct and total attempts once. An incorrect answer increases total attempts once. A completion screen appears after the final page and its values match that session.

### 7.4 Progress and retention

- Finishing an exercise persists a session result associated with the authenticated user, language, level, unit, and mode.
- Progress records support total practice time, completed lessons, accuracy, vocabulary learned, current streak, longest streak, and per-day activity.
- The Progress tab renders data from saved records, including a seven-day practice-time chart and streak calendar.
- A streak counts a calendar day with at least one completed practice event in the learner’s selected timezone.
- The home screen recommends the next incomplete unit or mode.

**Acceptance criteria:** Completing a supported exercise, restarting the app, and returning to Progress shows the updated totals and completion state.

### 7.5 Chat practice (future-ready MVP)

- The Home tab can link a learner to chat practice.
- The initial version clearly treats chat as guided practice. It must not represent scripted replies as an AI teacher.
- If conversational AI is introduced, it must provide language-aware replies, correction feedback, safety handling, and clear limits on the use of learner data.

## 8. Content requirements

- Content is structured by `language`, `level`, `unit`, and `content_type`.
- Every catalog item must reference a registered content file before it is presented as available.
- Exercise entries need stable IDs, prompt text, choices, correct answer, English meaning/translation, and optional speech text.
- Content authors must be able to add a unit without changing individual exercise components; a manifest/registry should declare all available language-level-unit combinations.
- Content should be reviewed for translation accuracy, cultural appropriateness, and consistent target-language spelling.

## 9. Data and API requirements

The existing Express/MongoDB service provides registration, login, profile retrieval/update, and aggregate progress endpoints. The release needs a mobile-compatible authenticated API contract and session-level progress persistence.

### Core entities

| Entity | Required fields | Purpose |
| --- | --- | --- |
| User | name, nationality, email, password hash, selected language, current level | Identity and learning preferences |
| Course unit | language, level, unit, title, content manifest | Available learning content |
| Exercise result | user ID, language, level, unit, mode, exercise ID, attempts, correct attempts, duration, completed at | Durable learning event |
| Progress summary | user ID, total time, completed lessons, accuracy, vocabulary, current/longest streak | Fast progress display, derived from results |

### API behavior

- Protected endpoints accept a documented bearer-token format consistently. The current middleware reads `Authorization` directly, while login also sets a cookie; this must be reconciled for native and web clients.
- API responses use appropriate error status codes for validation, authorization, missing records, and server errors.
- Progress updates validate numeric ranges and prevent a client from arbitrarily overwriting derived totals.
- The app stores credentials securely on native platforms and must not rely on browser-only cookie behavior.

## 10. Non-functional requirements

- **Performance:** The first usable screen should render promptly on a typical mid-range device; local course content should remain usable with no network connection after it is bundled or cached.
- **Reliability:** In-progress responses should survive accidental navigation or a temporary network failure where practical; completed sessions should retry synchronization safely.
- **Accessibility:** All controls need accessible labels, visible focus/selection states, readable contrast, and text that accommodates system font scaling.
- **Privacy and security:** Passwords are hashed server-side; transport uses HTTPS in deployed environments; authentication secrets remain outside source control; only required learner data is collected.
- **Observability:** Capture anonymous product events for registration completion, language selection, exercise start/completion, answer outcome, and synchronization failures.

## 11. Scope and release plan

### Release 1: reliable A1 learning loop

- German and French A1 unit 1 content.
- Working registration, login, logout, profile, language selection, and authenticated app entry.
- Word, Sentence, and Dialogue exercises backed by the registered unit data.
- Speech playback, feedback, completion summary, and durable progress.
- Accurate Learn and Progress screens for available A1 content.

### Release 2: course expansion and personalization

- Register and publish additional authored units and levels.
- Resume state, next-lesson recommendations, vocabulary review, notifications, and stronger feedback insights.
- Goal-based recommendations when the learner enters a scenario such as shopping or public transport.

### Later consideration

- Guided AI chat with language-aware correction.
- Pronunciation practice using speech recognition.
- Adaptive sequencing and assessment-based level placement.

## 12. Success metrics

| Metric | Initial target | Definition |
| --- | --- | --- |
| Activation | 60% of new registrations start an exercise | User starts any exercise within 24 hours of registration |
| First-session completion | 50% | Started learners complete one exercise mode in the same session |
| Week-one retention | 25% | Activated learners return and complete practice on day 7 |
| Learning engagement | 3 completed modes per active learner per week | Completed Word, Sentence, or Dialogue sessions |
| Reliability | 99% successful progress saves | Completion events successfully stored or later synchronized |

## 13. Current implementation baseline and gaps

The app already includes Expo Router navigation, a four-tab shell, local German/French A1 unit 1 content, three exercise interfaces, answer feedback, and Expo text-to-speech. The backend has User and aggregate Progress models plus authentication/profile/progress routes.

The following must be resolved before calling the first release complete:

- Authentication forms are present but do not submit to the backend; signup routes to an unfinished preference page and the app does not enforce an authenticated route boundary.
- The selected language lives only in Zustand memory and is not persisted or tied to the user profile.
- The catalog advertises A1 through C2 and multiple units, while the runtime content registry currently exposes only German and French A1 unit 1. German A1 unit 2 and A2 unit 1 files exist but are not registered.
- Exercise completion, unit completion, and progress values are local UI state. The Progress tab uses hard-coded chart and streak values.
- The backend only stores aggregate progress, so it cannot determine unit/mode completion, daily activity, resume state, or auditable accuracy without an exercise-result model.
- The current backend documents cookie authentication but its middleware expects an authorization header; CORS is permissive and needs production-safe configuration.
- `Polli/data/dialogueExercise.json` is empty; dialogue screens correctly draw from unit content instead.
- Chat is a local deterministic response generator even though the screen copy describes an AI teacher.

## 14. Decisions needed

1. Confirm whether the first public release is limited to German/French A1 unit 1 or whether additional authored units must ship.
2. Choose the authentication transport for each platform: bearer token with secure native storage, cookie session for web, or a deliberately supported hybrid.
3. Define whether completion means finishing a mode, meeting an accuracy threshold, or completing all three modes in a unit.
4. Confirm the product’s chat direction: guided scripted practice for MVP or an AI-powered tutor with the required model, cost, and privacy design.
