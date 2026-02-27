export function toGameId(value) {
  if (value === undefined || value === null || value === '') return null;

  try {
    const id = BigInt(value);
    return id > 0n ? id : null;
  } catch {
    return null;
  }
}
