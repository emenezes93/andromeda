import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWeightLogs, saveWeightEntry, deleteWeightEntry } from './weightLogs';
import { enqueueSync } from './syncQueue';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('./syncQueue', () => ({
  enqueueSync: jest.fn().mockResolvedValue(undefined),
}));

const mockGet = AsyncStorage.getItem as jest.Mock;
const mockSet = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(null);
});

describe('weightLogs', () => {
  describe('getWeightLogs', () => {
    it('returns empty array when no data', async () => {
      expect(await getWeightLogs()).toEqual([]);
    });

    it('returns entries sorted by date descending', async () => {
      const entries = [
        { id: 'w-1', date: '2025-01-01', valueKg: 70 },
        { id: 'w-2', date: '2025-01-15', valueKg: 71 },
      ];
      mockGet.mockResolvedValue(JSON.stringify(entries));
      const result = await getWeightLogs();
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2025-01-15');
      expect(result[1].date).toBe('2025-01-01');
    });
  });

  describe('saveWeightEntry', () => {
    it('saves entry and enqueues sync', async () => {
      mockGet.mockResolvedValue(null);
      const entry = { id: 'w-new', date: '2025-02-01', valueKg: 72 };
      await saveWeightEntry(entry);
      expect(mockSet).toHaveBeenCalled();
      const [, value] = mockSet.mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual(entry);
      expect(enqueueSync).toHaveBeenCalledWith('weight', entry);
    });

    it('replaces existing entry with same id', async () => {
      const existing = [{ id: 'w-1', date: '2025-01-01', valueKg: 70 }];
      mockGet.mockResolvedValue(JSON.stringify(existing));
      await saveWeightEntry({ id: 'w-1', date: '2025-01-01', valueKg: 71 });
      const [, value] = mockSet.mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].valueKg).toBe(71);
    });
  });

  describe('deleteWeightEntry', () => {
    it('removes entry by id', async () => {
      const existing = [
        { id: 'w-1', date: '2025-01-01', valueKg: 70 },
        { id: 'w-2', date: '2025-01-15', valueKg: 71 },
      ];
      mockGet.mockResolvedValue(JSON.stringify(existing));
      await deleteWeightEntry('w-1');
      const [, value] = mockSet.mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('w-2');
    });
  });
});
