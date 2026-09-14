# Prefer-5-pod is a shop config (default on)

Stores can opt out of 5-player pods via League Configuration `prefer_5_pod` (default `true` so existing seating stays). When off, generation maximizes 4-pods and uses up to three 3-pods instead of a trailing 5, except exactly five players still get one 5-pod so small nights are not blocked. The flag is read at each pod generation for both rounds and does not constrain manual pod edits.
