export function roomDetailPath(roomId: string) {
  return `/rooms/${encodeURIComponent(roomId)}`;
}
