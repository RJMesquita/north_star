1. POC of a page or small pop up that you may with a few questions we can use and give you the session


Where do we use AI?
- Chat bot with code completion
- Agent for code basic code rules 

---
"""
Profile‑Based Schedule Recommender
---------------------------------

This script reads the Makers Fest 2026 conference data from an Excel file
(`data-makers-fest-2026.xlsx`) and helps users discover sessions they
should not miss.  The recommender builds a user profile by asking a
series of targeted questions about interests, preferred tracks, talk
types, levels and favourite speakers.  These responses are combined into
a single query vector and compared against every session using a
TF‑IDF vectorizer.  Sessions with the highest similarity scores are
presented as recommendations.

The questions are derived from unique values in the dataset, such as
track names, talk types, levels and keywords.  Asking these questions
allows the system to filter and weight sessions according to the
participant's preferences, producing a personalised agenda.

"""