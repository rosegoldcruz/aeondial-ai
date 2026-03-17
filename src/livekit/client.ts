import { logger } from '../utils/logger';
import { Room, RoomEvent } from '@livekit/rtc-node';

export async function connectToLiveKit() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!url || !apiKey || !apiSecret) {
    logger.warn('LiveKit env vars missing, skipping connection');
    return null;
  }

  const room = new Room();

  room.on(RoomEvent.Connected, () => {
    logger.info('Connected to LiveKit room');
  });

  // TODO: auth token generation via backend
  logger.info('LiveKit client initialized (token generation pending)');
  return room;
}
