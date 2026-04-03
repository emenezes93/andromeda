import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSyncQueue,
  enqueueSync,
  removeSyncItem,
  getPendingSyncCount,
  type SyncQueueItem,
} from './syncQueue';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockGet = AsyncStorage.getItem as jest.Mock;
const mockSet = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(null);
});

describe('syncQueue', () => {
  describe('getSyncQueue', () => {
    it('returns empty array when no data', async () => {
      mockGet.mockResolvedValue(null);
      expect(await getSyncQueue()).toEqual([]);
    });

    it('returns empty array when invalid json', async () => {
      mockGet.mockResolvedValue('not json');
      expect(await getSyncQueue()).toEqual([]);
    });

    it('returns parsed array when valid data', async () => {
      const items: SyncQueueItem[] = [
        {
          id: 'sync-1',
          type: 'weight',
          payload: { id: 'w-1', date: '2025-01-01', valueKg: 70 },
          createdAt: new Date().toISOString(),
        },
      ];
      mockGet.mockResolvedValue(JSON.stringify(items));
      expect(await getSyncQueue()).toEqual(items);
    });

    it('returns empty array when stored value is not array', async () => {
      mockGet.mockResolvedValue(JSON.stringify({ foo: 1 }));
      expect(await getSyncQueue()).toEqual([]);
    });
  });

  describe('enqueueSync', () => {
    it('appends item and persists', async () => {
      mockGet.mockResolvedValue(null);
      await enqueueSync('weight', { id: 'w-1', date: '2025-01-01', valueKg: 70 });
      expect(mockSet).toHaveBeenCalledTimes(1);
      const [, value] = mockSet.mock.calls[0];
      const parsed = JSON.parse(value) as SyncQueueItem[];
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('weight');
      expect(parsed[0].payload).toEqual({ id: 'w-1', date: '2025-01-01', valueKg: 70 });
      expect(parsed[0].id).toMatch(/^sync-\d+-/);
    });

    it('appends to existing queue', async () => {
      const existing = [
        {
          id: 'sync-1',
          type: 'water',
          payload: { date: '2025-01-01', ml: 500 },
          createdAt: new Date().toISOString(),
        },
      ];
      mockGet.mockResolvedValue(JSON.stringify(existing));
      await enqueueSync('meal', { id: 'm-1', date: '2025-01-01', kcal: 300 });
      const [, value] = mockSet.mock.calls[0];
      const parsed = JSON.parse(value) as SyncQueueItem[];
      expect(parsed).toHaveLength(2);
      expect(parsed[1].type).toBe('meal');
    });
  });

  describe('removeSyncItem', () => {
    it('removes item by id and persists', async () => {
      const items: SyncQueueItem[] = [
        { id: 'sync-a', type: 'weight', payload: {}, createdAt: new Date().toISOString() },
        { id: 'sync-b', type: 'water', payload: {}, createdAt: new Date().toISOString() },
      ];
      mockGet.mockResolvedValue(JSON.stringify(items));
      await removeSyncItem('sync-a');
      expect(mockSet).toHaveBeenCalledTimes(1);
      const [, value] = mockSet.mock.calls[0];
      const parsed = JSON.parse(value) as SyncQueueItem[];
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('sync-b');
    });
  });

  describe('getPendingSyncCount', () => {
    it('returns 0 when empty', async () => {
      mockGet.mockResolvedValue(null);
      expect(await getPendingSyncCount()).toBe(0);
    });

    it('returns length of queue', async () => {
      const items: SyncQueueItem[] = [
        { id: '1', type: 'weight', payload: {}, createdAt: new Date().toISOString() },
        { id: '2', type: 'water', payload: {}, createdAt: new Date().toISOString() },
      ];
      mockGet.mockResolvedValue(JSON.stringify(items));
      expect(await getPendingSyncCount()).toBe(2);
    });
  });
});
