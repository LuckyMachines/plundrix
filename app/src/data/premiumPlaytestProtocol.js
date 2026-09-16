export const PREMIUM_PLAYTEST_PROTOCOL = Object.freeze([
  { minute: '0:00', task: 'Cold open', prompt: 'Say nothing. Ask the player to begin and time the first committed move.', proof: 'First action completed unaided.' },
  { minute: '2:00', task: 'Three-second read', prompt: 'Freeze immediately after reveal, wait three seconds, then ask: what happened, to whom, and why?', proof: 'Action, target, and outcome named correctly.' },
  { minute: '4:00', task: 'Sound identity', prompt: 'Play the current cue without showing its label. Ask which action and outcome it describes, then ask whether the mix feels clean.', proof: 'Identity accuracy and mix quality recorded separately.' },
  { minute: '6:00', task: 'Pressure read', prompt: 'Ask who is leading and what the player intends to do next. Do not explain the HUD.', proof: 'Leader and plan described from the screen.' },
  { minute: '8:00', task: 'Impact and replay', prompt: 'After a gadget or breach, score impact 1-5 and observe whether the player requests another round.', proof: 'Impact, joy, friction, and replay intent recorded.' },
]);

export const AUDIO_TEST_MODES = Object.freeze(['sampled']);
