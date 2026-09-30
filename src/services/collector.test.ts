import {
  LogCollector,
  LogRecord,
  BufferOverflowError,
  MaxRetriesExceededError
} from './collector';

describe('LogCollector Comprehensive Test Suite', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  // =========================================================================
  // 1. Batching Logic Tests
  // =========================================================================
  describe('Batching Logic', () => {
    it('should immediately flush when buffer reaches the configured batchSize', async () => {
      const sentBatches: LogRecord[][] = [];
      const sendFn = jest.fn(async (batch: LogRecord[]) => {
        sentBatches.push(batch);
      });

      const collector = new LogCollector({
        batchSize: 3,
        flushIntervalMs: 10000, // Large interval to ensure time-based flush does not trigger
        sendFn
      });

      // Collect 2 logs - should remain in buffer
      collector.collect({ id: '1', message: 'First log' });
      collector.collect({ id: '2', message: 'Second log' });

      expect(sendFn).not.toHaveBeenCalled();
      expect(collector.getBufferDepth()).toBe(2);

      // Collect 3rd log - reaches batchSize=3 and triggers immediate flush
      collector.collect({ id: '3', message: 'Third log' });

      // Allow flush microtask to resolve
      await new Promise(resolve => setTimeout(resolve, 15));

      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(sentBatches[0]).toHaveLength(3);
      expect(sentBatches[0].map(l => l.id)).toEqual(['1', '2', '3']);
      expect(collector.getBufferDepth()).toBe(0);

      collector.destroy();
    });

    it('should flush partial batch when flushIntervalMs timer expires', async () => {
      jest.useFakeTimers();

      const sentBatches: LogRecord[][] = [];
      const sendFn = jest.fn(async (batch: LogRecord[]) => {
        sentBatches.push(batch);
      });

      const collector = new LogCollector({
        batchSize: 10,
        flushIntervalMs: 500,
        sendFn
      });

      collector.collect({ id: 'a', message: 'Partial batch log 1' });
      collector.collect({ id: 'b', message: 'Partial batch log 2' });

      expect(sendFn).not.toHaveBeenCalled();
      expect(collector.getBufferDepth()).toBe(2);

      // Advance time by 400ms (before timer)
      jest.advanceTimersByTime(400);
      expect(sendFn).not.toHaveBeenCalled();

      // Advance time by another 100ms (reaches 500ms)
      await jest.advanceTimersByTimeAsync(100);

      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(sentBatches[0]).toHaveLength(2);
      expect(sentBatches[0].map(l => l.id)).toEqual(['a', 'b']);
      expect(collector.getBufferDepth()).toBe(0);

      collector.destroy();
    });

    it('should partition large log volumes into multiple sequential batches of batchSize', async () => {
      const sentBatches: LogRecord[][] = [];
      const sendFn = jest.fn(async (batch: LogRecord[]) => {
        sentBatches.push(batch);
      });

      const collector = new LogCollector({
        batchSize: 5,
        flushIntervalMs: 10000,
        maxBufferSize: 50,
        sendFn
      });

      // Ingest 12 logs
      const logs = Array.from({ length: 12 }, (_, i) => ({ id: `log-${i + 1}` }));
      collector.collectMany(logs);

      // Allow async flush processing
      await new Promise(resolve => setTimeout(resolve, 25));

      // With batchSize 5, 12 logs should flush 2 full batches (5 + 5), leaving 2 in buffer
      expect(sentBatches.length).toBeGreaterThanOrEqual(2);
      expect(sentBatches[0]).toHaveLength(5);
      expect(sentBatches[1]).toHaveLength(5);

      // Manually flush remaining 2 logs
      await collector.flush();

      expect(sentBatches).toHaveLength(3);
      expect(sentBatches[2]).toHaveLength(2);
      expect(sentBatches[2].map(l => l.id)).toEqual(['log-11', 'log-12']);
      expect(collector.getBufferDepth()).toBe(0);

      collector.destroy();
    });

    it('should allow manual flush() at any time', async () => {
      const sentBatches: LogRecord[][] = [];
      const sendFn = jest.fn(async (batch: LogRecord[]) => {
        sentBatches.push(batch);
      });

      const collector = new LogCollector({
        batchSize: 50,
        flushIntervalMs: 0, // No timer
        sendFn
      });

      collector.collect({ id: 'manual-1' });
      collector.collect({ id: 'manual-2' });

      expect(collector.getBufferDepth()).toBe(2);
      expect(sendFn).not.toHaveBeenCalled();

      await collector.flush();

      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(sentBatches[0]).toHaveLength(2);
      expect(collector.getBufferDepth()).toBe(0);

      collector.destroy();
    });

    it('should be a no-op when flush() is invoked on an empty buffer', async () => {
      const sendFn = jest.fn();
      const collector = new LogCollector({ sendFn });

      await collector.flush();

      expect(sendFn).not.toHaveBeenCalled();
      collector.destroy();
    });

    it('should handle concurrent collects while a flush is asynchronously in flight without loss', async () => {
      let resolveFirstBatch: () => void = () => {};
      const firstBatchPromise = new Promise<void>(resolve => {
        resolveFirstBatch = resolve;
      });

      const sentBatches: LogRecord[][] = [];
      let callCount = 0;

      const sendFn = jest.fn(async (batch: LogRecord[]) => {
        callCount++;
        sentBatches.push(batch);
        if (callCount === 1) {
          // Pause first batch flush until signaled
          await firstBatchPromise;
        }
      });

      const collector = new LogCollector({
        batchSize: 2,
        flushIntervalMs: 0,
        sendFn
      });

      // Collect 2 items -> triggers first flush
      collector.collect({ id: 'c1' });
      collector.collect({ id: 'c2' });

      // While first flush is in-flight, add 3rd and 4th item
      collector.collect({ id: 'c3' });
      collector.collect({ id: 'c4' });

      expect(collector.getBufferDepth()).toBe(2);

      // Now complete the first batch
      resolveFirstBatch();
      await new Promise(resolve => setTimeout(resolve, 20));

      // Flush remaining items
      await collector.flush();

      expect(sentBatches).toHaveLength(2);
      expect(sentBatches[0].map(l => l.id)).toEqual(['c1', 'c2']);
      expect(sentBatches[1].map(l => l.id)).toEqual(['c3', 'c4']);
      expect(collector.getBufferDepth()).toBe(0);

      collector.destroy();
    });

    it('should respect stopTimer and startTimer lifecycle methods', () => {
      jest.useFakeTimers();

      const sendFn = jest.fn(async () => {});
      const collector = new LogCollector({
        batchSize: 10,
        flushIntervalMs: 200,
        sendFn
      });

      collector.collect({ id: 't1' });
      collector.stopTimer();

      // Advance time beyond interval: should not flush because timer was stopped
      jest.advanceTimersByTime(300);
      expect(sendFn).not.toHaveBeenCalled();

      // Restart timer and advance time
      collector.startTimer();
      jest.advanceTimersByTime(200);
      expect(sendFn).toHaveBeenCalledTimes(1);

      collector.destroy();
    });

    it('should reject further log collection after destroy() has been called', () => {
      const collector = new LogCollector();
      collector.destroy();

      expect(() => {
        collector.collect({ id: 'fail-destroyed' });
      }).toThrow('LogCollector has been destroyed');
    });
  });

  // =========================================================================
  // 2. Buffer Overflow Handling Tests
  // =========================================================================
  describe('Buffer Overflow Handling', () => {
    it('should drop oldest logs when overflowStrategy is "drop-oldest"', () => {
      const droppedLogs: LogRecord[] = [];
      const onDrop = jest.fn((dropped: LogRecord[]) => {
        droppedLogs.push(...dropped);
      });

      const collector = new LogCollector({
        maxBufferSize: 3,
        batchSize: 100, // Prevent auto-flush during collection
        flushIntervalMs: 0,
        overflowStrategy: 'drop-oldest',
        onDrop
      });

      collector.collect({ id: 'item-1' });
      collector.collect({ id: 'item-2' });
      collector.collect({ id: 'item-3' });

      expect(collector.getBufferDepth()).toBe(3);
      expect(onDrop).not.toHaveBeenCalled();

      // 4th log should drop item-1 (oldest)
      collector.collect({ id: 'item-4' });

      expect(collector.getBufferDepth()).toBe(3);
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(droppedLogs[0].id).toBe('item-1');
      expect(collector.getBuffer().map(l => l.id)).toEqual(['item-2', 'item-3', 'item-4']);

      // 5th log should drop item-2
      collector.collect({ id: 'item-5' });

      expect(collector.getBufferDepth()).toBe(3);
      expect(droppedLogs[1].id).toBe('item-2');
      expect(collector.getBuffer().map(l => l.id)).toEqual(['item-3', 'item-4', 'item-5']);

      const metrics = collector.getMetrics();
      expect(metrics.totalDropped).toBe(2);

      collector.destroy();
    });

    it('should drop newest incoming log when overflowStrategy is "drop-newest"', () => {
      const droppedLogs: LogRecord[] = [];
      const onDrop = jest.fn((dropped: LogRecord[]) => {
        droppedLogs.push(...dropped);
      });

      const collector = new LogCollector({
        maxBufferSize: 3,
        batchSize: 100,
        flushIntervalMs: 0,
        overflowStrategy: 'drop-newest',
        onDrop
      });

      collector.collect({ id: 'keep-1' });
      collector.collect({ id: 'keep-2' });
      collector.collect({ id: 'keep-3' });

      expect(collector.getBufferDepth()).toBe(3);

      // Attempt to add 4th log
      const result = collector.collect({ id: 'rejected-4' });

      expect(result).toBe(false);
      expect(collector.getBufferDepth()).toBe(3);
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(droppedLogs[0].id).toBe('rejected-4');
      // Buffer still contains the original 3 logs
      expect(collector.getBuffer().map(l => l.id)).toEqual(['keep-1', 'keep-2', 'keep-3']);

      collector.destroy();
    });

    it('should throw BufferOverflowError when overflowStrategy is "reject"', () => {
      const collector = new LogCollector({
        maxBufferSize: 2,
        batchSize: 100,
        flushIntervalMs: 0,
        overflowStrategy: 'reject'
      });

      collector.collect({ id: '1' });
      collector.collect({ id: '2' });

      expect(() => {
        collector.collect({ id: '3' });
      }).toThrow(BufferOverflowError);

      // Existing logs should remain intact
      expect(collector.getBufferDepth()).toBe(2);
      expect(collector.getBuffer().map(l => l.id)).toEqual(['1', '2']);

      collector.destroy();
    });

    it('should handle maxBufferSize of 1 edge case properly', () => {
      const onDrop = jest.fn();
      const collector = new LogCollector({
        maxBufferSize: 1,
        batchSize: 10,
        flushIntervalMs: 0,
        overflowStrategy: 'drop-oldest',
        onDrop
      });

      collector.collect({ id: 'alpha' });
      expect(collector.getBufferDepth()).toBe(1);

      collector.collect({ id: 'beta' });
      expect(collector.getBufferDepth()).toBe(1);
      expect(collector.getBuffer()[0].id).toBe('beta');
      expect(onDrop).toHaveBeenCalledWith([{ id: 'alpha' }], expect.any(String));

      collector.destroy();
    });

    it('should handle bulk ingestion overflow with collectMany', () => {
      const dropped: LogRecord[] = [];
      const collector = new LogCollector({
        maxBufferSize: 5,
        batchSize: 100,
        flushIntervalMs: 0,
        overflowStrategy: 'drop-oldest',
        onDrop: (logs) => dropped.push(...logs)
      });

      const logs = Array.from({ length: 9 }, (_, i) => ({ id: `bulk-${i + 1}` }));
      const acceptedCount = collector.collectMany(logs);

      expect(acceptedCount).toBe(9);
      expect(collector.getBufferDepth()).toBe(5);
      // Older items bulk-1, bulk-2, bulk-3, bulk-4 should be dropped
      expect(dropped.map(l => l.id)).toEqual(['bulk-1', 'bulk-2', 'bulk-3', 'bulk-4']);
      expect(collector.getBuffer().map(l => l.id)).toEqual(['bulk-5', 'bulk-6', 'bulk-7', 'bulk-8', 'bulk-9']);

      collector.destroy();
    });

    it('should correctly report buffer metrics and handle clearBuffer()', () => {
      const collector = new LogCollector({
        maxBufferSize: 10,
        batchSize: 20,
        flushIntervalMs: 0
      });

      collector.collectMany([
        { id: '1' },
        { id: '2' },
        { id: '3' }
      ]);

      const metricsBefore = collector.getMetrics();
      expect(metricsBefore.bufferDepth).toBe(3);
      expect(metricsBefore.totalCollected).toBe(3);
      expect(metricsBefore.maxBufferSize).toBe(10);

      collector.clearBuffer();
      expect(collector.getBufferDepth()).toBe(0);

      collector.destroy();
    });
  });

  // =========================================================================
  // 3. Exponential Backoff Retry Behavior Tests
  // =========================================================================
  describe('Exponential Backoff Retry Behavior', () => {
    it('should succeed on first try without triggering retries when sendFn succeeds', async () => {
      const onRetry = jest.fn();
      const onSuccess = jest.fn();
      const onError = jest.fn();

      const sendFn = jest.fn(async () => {});

      const collector = new LogCollector({
        batchSize: 50,
        flushIntervalMs: 0,
        maxRetries: 3,
        sendFn,
        onRetry,
        onSuccess,
        onError
      });

      collector.collect({ id: 'success-1' });
      await collector.flush();

      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(onRetry).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();

      const metrics = collector.getMetrics();
      expect(metrics.totalSent).toBe(1);
      expect(metrics.retryAttemptsTotal).toBe(0);
      expect(metrics.retrySuccessTotal).toBe(0);

      collector.destroy();
    });

    it('should recover after transient failures with exponential backoff delays', async () => {
      let callCount = 0;
      const retryEvents: { attempt: number; delayMs: number; error: Error }[] = [];

      const sendFn = jest.fn(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`Transient network failure attempt ${callCount}`);
        }
      });

      const onRetry = jest.fn((attempt: number, delayMs: number, error: Error) => {
        retryEvents.push({ attempt, delayMs, error });
      });
      const onSuccess = jest.fn();

      const collector = new LogCollector({
        batchSize: 10,
        flushIntervalMs: 0,
        maxRetries: 3,
        initialRetryDelayMs: 10,
        backoffMultiplier: 2,
        jitter: false,
        sendFn,
        onRetry,
        onSuccess
      });

      collector.collect({ id: 'transient-1' });
      await collector.flush();

      // Total attempts = 3 (1 initial failure + 2 retries, 3rd succeeded)
      expect(sendFn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalledTimes(1);

      // Verify exponential progression: 10ms, then 10 * 2 = 20ms
      expect(retryEvents[0].attempt).toBe(1);
      expect(retryEvents[0].delayMs).toBe(10);
      expect(retryEvents[0].error.message).toContain('attempt 1');

      expect(retryEvents[1].attempt).toBe(2);
      expect(retryEvents[1].delayMs).toBe(20);
      expect(retryEvents[1].error.message).toContain('attempt 2');

      const metrics = collector.getMetrics();
      expect(metrics.retryAttemptsTotal).toBe(2);
      expect(metrics.retrySuccessTotal).toBe(1);
      expect(metrics.failedBatchesTotal).toBe(0);

      collector.destroy();
    });

    it('should verify correct exponential backoff delay calculation and cap at maxRetryDelayMs', () => {
      const collector = new LogCollector({
        initialRetryDelayMs: 100,
        backoffMultiplier: 2,
        maxRetryDelayMs: 500,
        jitter: false
      });

      // attempt 1: 100 * 2^0 = 100
      expect(collector.calculateBackoffDelay(1)).toBe(100);
      // attempt 2: 100 * 2^1 = 200
      expect(collector.calculateBackoffDelay(2)).toBe(200);
      // attempt 3: 100 * 2^2 = 400
      expect(collector.calculateBackoffDelay(3)).toBe(400);
      // attempt 4: 100 * 2^3 = 800 -> capped at 500
      expect(collector.calculateBackoffDelay(4)).toBe(500);
      // attempt 5: capped at 500
      expect(collector.calculateBackoffDelay(5)).toBe(500);

      collector.destroy();
    });

    it('should add bounded jitter when jitter is enabled', () => {
      const collector = new LogCollector({
        initialRetryDelayMs: 100,
        backoffMultiplier: 2,
        maxRetryDelayMs: 1000,
        jitter: true,
        jitterFraction: 0.2 // ±20%
      });

      // For attempt 1, base is 100, range is [80, 120]
      for (let i = 0; i < 20; i++) {
        const delay = collector.calculateBackoffDelay(1);
        expect(delay).toBeGreaterThanOrEqual(80);
        expect(delay).toBeLessThanOrEqual(120);
      }

      collector.destroy();
    });

    it('should stop retrying and invoke onError with MaxRetriesExceededError when retries are exhausted', async () => {
      const sendFn = jest.fn(async () => {
        throw new Error('Persistent 503 Service Unavailable');
      });

      let capturedError: Error | null = null;
      let capturedBatch: LogRecord[] = [];

      const onError = jest.fn((error: Error, batch: LogRecord[]) => {
        capturedError = error;
        capturedBatch = batch;
      });

      const collector = new LogCollector({
        batchSize: 10,
        flushIntervalMs: 0,
        maxRetries: 2,
        initialRetryDelayMs: 5,
        backoffMultiplier: 2,
        jitter: false,
        sendFn,
        onError
      });

      collector.collect({ id: 'fatal-1', message: 'Fatal payload' });
      await collector.flush();

      // Total attempts: 1 initial + 2 retries = 3 calls
      expect(sendFn).toHaveBeenCalledTimes(3);
      expect(onError).toHaveBeenCalledTimes(1);

      expect(capturedError).toBeInstanceOf(MaxRetriesExceededError);
      expect((capturedError as any)?.message).toContain('Failed to send batch of 1 logs after 2 retries');
      expect(capturedBatch[0].id).toBe('fatal-1');

      const metrics = collector.getMetrics();
      expect(metrics.failedBatchesTotal).toBe(1);
      expect(metrics.totalSent).toBe(0);

      collector.destroy();
    });

    it('should safely abort retry loop if collector is destroyed during backoff delay', async () => {
      const sendFn = jest.fn(async () => {
        throw new Error('Endpoint down');
      });

      const collector = new LogCollector({
        batchSize: 10,
        flushIntervalMs: 0,
        maxRetries: 5,
        initialRetryDelayMs: 50,
        sendFn
      });

      collector.collect({ id: 'abort-me' });

      // Trigger flush
      const flushPromise = collector.flush();

      // Destroy collector while in backoff sleep
      setTimeout(() => {
        collector.destroy();
      }, 20);

      await flushPromise;

      // Should have terminated early without completing all 5 retries
      expect(sendFn.mock.calls.length).toBeLessThan(6);
    });
  });
});
