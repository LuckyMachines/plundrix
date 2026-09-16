function safeText(value, fallback = '') {
  return String(value || fallback).replace(/[\r\n]+/g, ' ').trim().slice(0, 120);
}

export function buildReplayCardModel(replay = {}) {
  const highlight = replay.definingMoment || replay.highlights?.[0];
  return {
    title: safeText(replay.title, 'Plundrix operation'),
    subtitle: safeText(highlight?.socialLabel || replay.subtitle, 'A vault race worth replaying'),
    winner: safeText(replay.summary?.winnerName, 'No clean winner'),
    rounds: Math.max(0, Number(replay.summary?.rounds) || 0),
    score: Math.round((Number(replay.dramaticScore) || 0) * 10) / 10,
    moment: safeText(highlight?.text || highlight?.description || replay.beats?.[0]?.text || replay.description, 'The table turned in one move.'),
  };
}

function wrapText(context, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export async function renderReplayShareCard(replay) {
  const model = buildReplayCardModel(replay);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext('2d');
  const ground = context.createLinearGradient(0, 0, 1200, 630);
  ground.addColorStop(0, '#090b10');
  ground.addColorStop(0.62, '#16131a');
  ground.addColorStop(1, '#24170f');
  context.fillStyle = ground;
  context.fillRect(0, 0, 1200, 630);

  context.strokeStyle = 'rgba(196,149,106,.14)';
  context.lineWidth = 1;
  for (let x = 40; x < 1200; x += 48) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 630); context.stroke();
  }
  for (let y = 38; y < 630; y += 48) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(1200, y); context.stroke();
  }

  context.save();
  context.translate(930, 318);
  for (let index = 0; index < 5; index += 1) {
    context.beginPath();
    context.strokeStyle = index < Math.min(5, model.rounds) ? '#e8b078' : 'rgba(200,200,212,.18)';
    context.lineWidth = 14;
    context.arc(0, 0, 72 + index * 38, -2.35, 2.35);
    context.stroke();
  }
  context.fillStyle = '#40a080';
  context.beginPath(); context.arc(0, 0, 46, 0, Math.PI * 2); context.fill();
  context.restore();

  context.fillStyle = '#40a080';
  context.font = '600 24px "JetBrains Mono", monospace';
  context.fillText('PLUNDRIX / EXACT OPERATION REPLAY', 72, 80);
  context.fillStyle = '#f3ede6';
  context.font = '700 68px "Barlow Condensed", sans-serif';
  wrapText(context, model.title.toUpperCase(), 690).forEach((line, index) => context.fillText(line, 72, 166 + index * 70));
  context.fillStyle = '#c4956a';
  context.font = '600 28px "Barlow Condensed", sans-serif';
  context.fillText(model.subtitle.toUpperCase(), 72, 332);
  context.fillStyle = '#c8c8d4';
  context.font = '400 27px "Barlow", sans-serif';
  wrapText(context, model.moment, 690).forEach((line, index) => context.fillText(line, 72, 390 + index * 36));

  context.fillStyle = '#8b8a9e';
  context.font = '400 20px "JetBrains Mono", monospace';
  context.fillText(`WINNER ${model.winner.toUpperCase()}  /  ${model.rounds} ROUNDS  /  DRAMA ${model.score}`, 72, 556);
  context.fillStyle = '#e8b078';
  context.fillText('GAME.PLUNDRIX.COM/REPLAYS', 72, 594);

  return new Promise((resolvePromise, reject) => {
    canvas.toBlob((blob) => blob ? resolvePromise(blob) : reject(new Error('Could not render replay card.')), 'image/png');
  });
}

export async function shareReplayCard(replay) {
  const blob = await renderReplayShareCard(replay);
  const filename = `${safeText(replay.id, 'plundrix-replay').replace(/[^a-z0-9_-]+/gi, '-')}.png`;
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: replay.title, text: replay.description, url: replay.shareUrl, files: [file] });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
