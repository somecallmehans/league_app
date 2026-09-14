# Aversions apply only at Round 1 pod generation (V1)

Product originally asked for an optional Round 2 override that would separate averse pairs while staying near ranking bands. V1 deliberately omits Also R2 (no schema flag, no UI, no Round 2 enforcement) so seating stays simple and stakeholder friction around ranking-aware repair is deferred. Aversions are enforced only during Round 1 `begin_round` / reroll via retry-then-repair; Round 2 and manual pod edits ignore them.
