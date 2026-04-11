# Product Requirements Document – Data Science Conference Schedule Recommender
1. Introduction & Purpose
Data Makers Fest is a multi‑track data‑science conference scheduled for 2026. Participants are faced with hundreds of sessions spread across diverse tracks (e.g., engineering, domain applications, generative AI) and overlapping time slots. Navigating the program and identifying the “must‑see” sessions becomes time‑consuming and overwhelming, leading to decision fatigue for attendees. Research on conference technology notes that complex agendas can force attendees to make dozens of choices and that AI‑powered recommendation engines can deliver curated session suggestions based on session descriptions, speakers and attendee preferences
.

The purpose of this project is to develop a Profile‑Based Schedule Recommender that helps attendees build a personalised agenda. The system will collect key user preferences (tracks, talk type, skill level, topics, preferred speakers) and return an ordered list of sessions from the “Data Makers Fest 2026” dataset that best match the attendee’s interests. It will also allow users to save recommended sessions into a personal agenda and, optionally, take notes and summarise them automatically. This PRD outlines the goals, features, user stories, requirements, and plans for delivering the recommender.

2. Team Goals & Business Objectives
Enhance attendee experience: reduce decision fatigue and increase satisfaction by providing personalised session recommendations. At conferences, personalised recommendations have been shown to improve engagement by delivering the most relevant content to each attendee
.

Increase session attendance and diversity: encourage participants to explore sessions beyond their default track by surfacing cross‑track sessions aligned to their interests.

Demonstrate AI capabilities: showcase how natural‑language processing and recommendation algorithms can personalise large event agendas.

Collect user insights: capture anonymised preference data to improve future conference programming and marketing.

3. Background & Strategic Fit
The conference program comprises over 120 accepted sessions across eight tracks (Engineering, Domain Applications, Frontiers, Responsible AI & Safety, Generative AI & LLMs, Analytics & Visualisation, Core Machine Learning, Leadership). Each session has associated metadata: title, description, track, talk type, skill level, keywords, speakers, scheduled time and duration. Without guidance, attendees must manually scan the schedule, which is inefficient and may lead to missed opportunities.

Implementing a schedule recommender aligns with the conference’s vision of being data‑driven and user‑centric. It leverages the conference dataset and provides a tangible demonstration of data‑science techniques in action. The solution will also set a foundation for future features like networking recommendations or sponsor matchmaking.

4. Assumptions & Constraints
Dataset completeness: the recommender relies on the data-makers-fest-2026.xlsx dataset containing accurate session metadata. Any missing or incorrect fields (e.g., keywords, speaker names) will affect recommendation quality.

Single event scope: the recommender is initially scoped to Data Makers Fest 2026. Supporting other conferences would require additional datasets and configuration.

User input reliability: the algorithm assumes users provide honest and meaningful preferences; ambiguous keywords may reduce relevance.

No live updates: the initial version will not dynamically update recommendations based on real‑time changes (e.g., schedule changes). Manual refresh or dataset updates will be required.

Privacy: the system will not collect personal identifiable information beyond preferences; notes are stored locally on the user’s device.

5. User Personas & Target Audience
Persona	Description	Needs
Novice attendee	Graduate student or new data‑science professional attending their first conference.	Wants clear guidance on foundational sessions and beginner‑friendly talks.
Seasoned practitioner	Experienced engineer/researcher seeking cutting‑edge techniques and advanced topics.	Needs to filter for advanced or deep‑dive sessions and follow specific speakers or research areas.
Cross‑discipline explorer	Participant from another domain (e.g., business analyst) interested in applying data science to their field.	Desires sessions in domain applications and analytics tracks with practical case studies.
6. Key Questions to Ask the User
To build the profile and query, the app will ask the following questions:

Preferred tracks: users can select one or more of the eight conference tracks. Tracks correspond to thematic areas and are strong signals for relevance.

Talk type: options include Technical, Applications, Overview, Opinion, Geeking out, Complementary Skills or Other. This mirrors the “Type of Talk” column in the dataset.

Skill level: choices are Beginner/Introductory, Intermediate/Practitioner, Advanced/Deep Dive or All levels/General interest.

Keywords or topics of interest: users may enter up to three keywords (e.g., “generative AI”, “data visualisation”). These will match against the title, description and keywords fields.

Preferred speakers: users can specify the names of speakers they want to follow.

Optional time or duration constraints: users may indicate preferred times of day or maximum session duration.

These questions capture the main decision factors identified in research (descriptions, speakers, previous behaviour) and align the product with best practices for AI conference recommendations
.

7. Features & Functionality
7.1 Core Features
Interactive questionnaire – On first use, present a series of questions (described above) to capture the user’s interests and constraints.

Profile construction & query builder – Combine selected tracks, talk types, skill levels and keywords into a query string. Assign a weight boost for preferred speakers.

Recommendation engine – Use a TF‑IDF vectoriser to convert session descriptions and metadata into vectors. Compute cosine similarity between the user query and each session. Filter sessions by chosen tracks, types and levels; apply speaker boosts; and return the top‑n sessions sorted by similarity score.

Personal agenda creation – Allow users to save recommended sessions to a personal schedule. Ensure no time conflicts by warning the user when sessions overlap.

Schedule view – Display selected sessions in a calendar‑like view with times, durations and room names.

Note‑taking – Provide a simple interface for capturing notes per session. Users can enter free‑form text during or after a session.

AI summary & action items – After a user enters notes, offer an automatic summary using extractive summarisation and highlight action items (see Slack’s meeting summary guidance on summarisation and action item extraction
). The summary helps attendees review key points quickly.

Export & share – Users can export their personal agenda and notes as a Markdown or CSV file for offline reference or sharing with colleagues.

7.2 Optional Future Enhancements
Real‑time updates: integrate with the conference scheduling system to refresh recommendations if sessions are cancelled or rescheduled.

Social recommendation: suggest sessions based on similar users’ choices (collaborative filtering).

Networking suggestions: recommend people to meet based on similar interests and session attendance.

Multi‑conference support: expand to other events by loading additional datasets and dynamically adjusting tracks and talk types.

8. User Stories
As a novice attendee, I want to select beginner‑friendly tracks and topics so that I can discover sessions that match my knowledge level.

As a seasoned practitioner, I want to filter sessions by advanced skill level and follow specific speakers so I can attend cutting‑edge talks by experts.

As a cross‑discipline explorer, I want to enter keywords related to my industry so that the recommender surfaces relevant domain applications.

As an attendee, I want to save recommended sessions to a personal agenda so I can keep track of what to attend.

As an attendee, I need to see if two sessions overlap before adding them to my schedule so I can avoid conflicts.

As an attendee, I want to take notes during sessions and have them summarised afterwards so that I can review the key points and action items quickly.

As an attendee, I want to export my agenda and notes so I can share them with colleagues.

9. Functional Requirements
Input handling: the system shall display a questionnaire for track, talk type, skill level, keywords, preferred speakers and time constraints.

Data pre‑processing: the system shall parse the data-makers-fest-2026.xlsx file, combining each session’s title, description, track, talk type, level and keywords into a single document string for vectorisation.

Vectorisation and similarity computation: the system shall create a TF‑IDF model over the session documents and transform both session data and user query into vectors. It shall compute cosine similarity and add a weight boost (e.g., +0.1) for sessions featuring preferred speakers.

Filtering and ranking: the system shall apply user‑selected filters (tracks, types, levels) to the dataset before ranking; it shall return the top‑n results (default n=10).

Agenda management: the system shall allow users to add sessions to a personal agenda and prevent adding overlapping sessions unless explicitly confirmed.

Note‑taking: the system shall provide a note‑taking interface associated with each session in the agenda. Notes shall be stored locally and editable.

Summarisation: upon user request, the system shall generate an extractive summary and list of action items from the notes, using a local summarisation algorithm similar to a frequency‑based method or optional call to an AI model. Recommendations for summarisation should follow best practices for meeting summaries
.

Export: the system shall export the personal agenda and notes (with summaries) to Markdown or CSV.

User interface: the system shall offer a command‑line or simple GUI interface accessible on Windows, macOS and Linux. A web or mobile version may follow later.

Error handling: the system shall provide meaningful error messages if the dataset is missing or corrupted, if the user enters invalid inputs, or if the summarisation fails.

10. Non‑Functional Requirements
Performance: initial recommendations should be computed in under 2 seconds on a modern laptop. Summarisation should complete in under 5 seconds for a typical note length (≤2,000 words).

Usability: the questionnaire and schedule view should be intuitive, with clear prompts and instructions. Colour‑blind friendly themes and keyboard navigation will be supported.

Security and Privacy: user preferences and notes are stored locally; no personally identifiable information is uploaded to a server. If future versions involve server storage, data encryption and compliance with EU GDPR will be required.

Scalability: the system should handle up to 500 sessions without significant slow‑downs. For larger events, more efficient vectorisation or approximate nearest neighbour search may be implemented.

Accessibility: the user interface should follow accessibility guidelines (e.g., screen reader support, high‑contrast modes). Note‑taking should allow voice input in future versions.

11. Success Metrics & Release Criteria
Metric	Target
Recommendation relevance	≥80% of surveyed users rate recommended sessions as “relevant” or “highly relevant.”
User satisfaction	Net Promoter Score (NPS) ≥ 60 after using the recommender.
Adoption rate	≥50% of registered attendees create a profile and use the recommender.
Conflict reduction	≥90% of users report fewer scheduling conflicts compared to manual planning.
Note‑taking usage	≥30% of users who add sessions also record notes and generate summaries.
A release candidate will be considered ready when the functional and non‑functional requirements are met, the above metrics are achieved during beta testing, and key stakeholders sign off.

12. Risks & Mitigations
Risk	Impact	Mitigation
Incomplete or inconsistent session metadata	Poor recommendations and user frustration.	Validate and clean the dataset before launch; allow manual tagging of keywords; monitor user feedback to refine weights.
Ambiguous or overly broad user keywords	Irrelevant sessions recommended.	Provide examples and suggestions; implement keyword synonym mapping and stop‑word removal.
User apathy towards questionnaires	Low adoption.	Keep the questionnaire short, use progressive disclosure, and provide default recommendations if users skip questions.
Algorithmic bias	Over‑representing certain tracks or speakers.	Regularly audit recommendation outputs; adjust weighting; incorporate diversity metrics.
Schedule changes	Recommendations become outdated.	Provide an option to refresh recommendations; plan integration with real‑time schedule updates in a future version.
Privacy concerns	Users reluctant to share preferences.	Store data locally by default; communicate privacy policy clearly.
Time conflicts management	Users may inadvertently book overlapping sessions.	Include conflict‑detection warnings and allow manual override.
13. Dependencies
data-makers-fest-2026.xlsx dataset containing up‑to‑date session information.

profile_recommender.py script implementing questionnaire, recommendation algorithm, agenda management and summarisation.

Python environment with pandas, numpy, scikit‑learn, and optional nltk packages for text processing.

14. Timeline & Release Plan
Design & Research (April 2026) – Finalise product requirements and user stories; obtain dataset; design questionnaire flow and UI.

Prototype Development (May 2026) – Implement data parsing, TF‑IDF vectorisation, similarity calculations and basic CLI UI; test with sample users.

User Testing & Feedback (June 2026) – Recruit beta testers; gather feedback on questionnaire, recommendation relevance and UI; adjust algorithm weights and UI accordingly.

Integration of Note‑Taking & Summarisation (June 2026) – Implement note‑taking feature and extractive summariser; refine action item extraction using guidelines for meeting summaries
.

Performance & Accessibility Improvements (July 2026) – Optimise vectorisation and UI performance; implement accessibility features.

Beta Release (August 2026) – Release to a subset of attendees; monitor metrics; fix critical issues.

General Availability (September 2026) – Release the finished product to all conference participants; provide support and update the dataset as needed.

15. Out of Scope
Event registration, ticket purchasing, or payment processing.

Networking matchmaking and sponsor recommendations (possible future enhancements).

Real‑time schedule integration for other conferences.

Advanced generative AI summarisation (beyond extractive summarisation) due to potential bias and privacy concerns.

16. Stakeholder Review & Approval
Product Owner (You) – oversees feature prioritisation and ensures alignment with conference objectives.

Development Lead – responsible for implementing the algorithm and UI; signs off on technical feasibility.

Conference Organiser – provides dataset and ensures schedule accuracy.

Legal & Compliance – reviews privacy statements and ensures GDPR compliance.

Beta Testers – provide feedback and sign off on user experience.

A successful PRD fosters collaboration and clarity. According to Atlassian, effective PRDs define the product’s purpose, features and behaviour, include goals, assumptions and user stories, and clearly mark items that are out of scope
. This document follows those guidelines by outlining the problem, describing the audience, listing user stories, specifying functional and non‑functional requirements, and identifying assumptions and risks. It will serve as a living document to guide development and ensure all stakeholders are aligned throughout the lifecycle of the schedule recommender.