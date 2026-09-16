# Plundrix Audio Review Script

Use `/audio-preview.html` with sound and music at their default 50 percent levels. Run the same review once with ordinary laptop speakers and once with headphones. Do not watch the cue label during the blind pass.

## Five-minute blind pass

1. Play one random variation of Pick, Search, and Sabotage. Record whether each action is identified correctly.
2. Play `lock.resist`, `signal.lost`, and `sabotage.blocked`. Record whether failure is clear without sounding punitive.
3. Play `tool.found` followed by `lock.crack`. Record whether reward and progress feel different.
4. Play `game.win` after `round.impact`. Record whether the ceremony feels conclusive without a large volume jump.
5. Start each background track, then play all four cue groups over it. Record any cue masked by the score.

## Acceptance bar

- Pick, Search, and Sabotage are identified correctly in at least 80 percent of observed trials.
- Failure, reward, and breach use distinct sampled signatures.
- No oscillator, generated-noise, engine-drone, or overlapping cue pile-up is audible.
- Speech-level playback is comfortable at 50 percent on both output types.
- No required state depends on sound; muted play remains fully understandable.
- Any change is rebuilt through `npm run sound:build` and rechecked with `npm run test:sound`.

Record observations through `/playtest`; do not turn an internal listening opinion into player evidence.
