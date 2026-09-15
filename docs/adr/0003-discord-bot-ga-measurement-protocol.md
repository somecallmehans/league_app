# Discord bot usage is measured in the same GA property via Measurement Protocol

Operator analytics for Discord live in the same GA4 property as the website so there is one place to inspect usage. The bot emits `bot_interaction` events (commands and UI follow-ups, not session announcements) with a hashed Discord user id as GA `user_id`, rather than a separate metrics store or raw Discord snowflakes in GA.
