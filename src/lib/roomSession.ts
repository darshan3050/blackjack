const PLAYER_NAME_KEY = 'blackjack:playerName';

export function getRoomPasswordKey(roomId: string) {
  return `blackjack:${roomId.toUpperCase()}:password`;
}

export function saveRoomSession(roomId: string, playerName: string, password: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(PLAYER_NAME_KEY, playerName);
  window.sessionStorage.setItem(getRoomPasswordKey(roomId), password);
}

export function readPlayerName() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.sessionStorage.getItem(PLAYER_NAME_KEY) || '';
}

export function readRoomPassword(roomId: string) {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.sessionStorage.getItem(getRoomPasswordKey(roomId)) || '';
}
