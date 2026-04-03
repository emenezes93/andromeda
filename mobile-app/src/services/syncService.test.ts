import { getSyncQueue, removeSyncItem } from '../storage/syncQueue';
import * as progressApi from '../api/progressApi';
import { runSync } from './syncService';

jest.mock('../storage/syncQueue');
jest.mock('../api/progressApi');

const mockGetSyncQueue = getSyncQueue as jest.Mock;
const mockRemoveSyncItem = removeSyncItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRemoveSyncItem.mockResolvedValue(undefined);
  jest.spyOn(progressApi, 'postWeightLog').mockResolvedValue(undefined);
  jest.spyOn(progressApi, 'postWaterLog').mockResolvedValue(undefined);
});

describe('syncService', () => {
  it('returns synced 0 and failed 0 when queue is empty', async () => {
    mockGetSyncQueue.mockResolvedValue([]);
    const result = await runSync('token', 'tenant');
    expect(result).toEqual({ synced: 0, failed: 0 });
    expect(mockRemoveSyncItem).not.toHaveBeenCalled();
  });

  it('syncs weight item and removes from queue', async () => {
    const queue = [
      {
        id: 'sync-1',
        type: 'weight',
        payload: { id: 'w-1', date: '2025-01-01', valueKg: 70 },
        createdAt: new Date().toISOString(),
      },
    ];
    mockGetSyncQueue.mockResolvedValue(queue);
    const result = await runSync('token', 'tenant');
    expect(result).toEqual({ synced: 1, failed: 0 });
    expect(progressApi.postWeightLog).toHaveBeenCalledWith(
      { id: 'w-1', date: '2025-01-01', valueKg: 70 },
      'token',
      'tenant'
    );
    expect(mockRemoveSyncItem).toHaveBeenCalledWith('sync-1');
  });

  it('increments failed when post throws', async () => {
    jest.spyOn(progressApi, 'postWeightLog').mockRejectedValue(new Error('Network error'));
    mockGetSyncQueue.mockResolvedValue([
      {
        id: 'sync-1',
        type: 'weight',
        payload: { id: 'w-1', date: '2025-01-01', valueKg: 70 },
        createdAt: new Date().toISOString(),
      },
    ]);
    const result = await runSync('token', 'tenant');
    expect(result).toEqual({ synced: 0, failed: 1 });
    expect(mockRemoveSyncItem).not.toHaveBeenCalled();
  });

  it('syncs multiple items and returns correct counts', async () => {
    mockGetSyncQueue.mockResolvedValue([
      { id: 's1', type: 'weight', payload: { id: 'w-1', date: '2025-01-01', valueKg: 70 }, createdAt: '' },
      { id: 's2', type: 'water', payload: { date: '2025-01-01', ml: 500 }, createdAt: '' },
    ]);
    const result = await runSync('token', 'tenant');
    expect(result).toEqual({ synced: 2, failed: 0 });
    expect(mockRemoveSyncItem).toHaveBeenCalledWith('s1');
    expect(mockRemoveSyncItem).toHaveBeenCalledWith('s2');
  });
});
