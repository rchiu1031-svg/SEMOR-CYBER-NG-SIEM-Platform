export interface LogRecord {
  id?: string;
  timestamp?: number | string;
  message?: string;
  level?: string;
  source?: string;
  [key: string]: any;
}

export type BufferOverflowStrategy = 'drop-oldest' | 'drop-newest' | 'reject';

export interface CollectorConfig {
  /** Maximum number of logs in a single batch (default: 50) */
  batchSize?: number;
  /** Maximum milliseconds to wait before flushing partial batch (default: 1000) */
  flushIntervalMs?: number;
  /** Maximum capacity of the memory buffer before overflow handling triggers (default: 1000) */
  maxBufferSize?: number;
  /** Buffer overflow strategy when buffer reaches maxBufferSize (default: 'drop-oldest') */
  overflowStrategy?: BufferOverflowStrategy;
  /** Maximum number of retry attempts on send failure (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in milliseconds (default: 100) */
  initialRetryDelayMs?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Maximum backoff delay cap in milliseconds (default: 5000) */
  maxRetryDelayMs?: number;
  /** Whether to add randomized jitter to backoff delay (default: false) */
  jitter?: boolean;
  /** Jitter fraction between 0 and 1 (default: 0.2) */
  jitterFraction?: number;
  /** Custom transport send function */
  sendFn?: (batch: LogRecord[]) => Promise<void>;
  /** Callback fired when logs are dropped due to overflow */
  onDrop?: (droppedLogs: LogRecord[], reason: string) => void;
  /** Callback fired when a batch is successfully sent */
  onSuccess?: (batch: LogRecord[]) => void;
  /** Callback fired on retry attempt */
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
  /** Callback fired when a batch completely fails after exhausting retries */
  onError?: (error: Error, failedBatch: LogRecord[]) => void;
}

export class BufferOverflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BufferOverflowError';
  }
}

export class MaxRetriesExceededError extends Error {
  public failedBatch: LogRecord[];
  constructor(message: string, failedBatch: LogRecord[]) {
    super(message);
    this.name = 'MaxRetriesExceededError';
    this.failedBatch = failedBatch;
  }
}

export class LogCollector {
  private config: Required<Omit<CollectorConfig, 'sendFn' | 'onDrop' | 'onSuccess' | 'onRetry' | 'onError'>> & {
    sendFn: (batch: LogRecord[]) => Promise<void>;
    onDrop?: (droppedLogs: LogRecord[], reason: string) => void;
    onSuccess?: (batch: LogRecord[]) => void;
    onRetry?: (attempt: number, delayMs: number, error: Error) => void;
    onError?: (error: Error, failedBatch: LogRecord[]) => void;
  };

  private buffer: LogRecord[] = [];
  private flushTimer: any = null;
  private isFlushing = false;
  private isDestroyed = false;

  // Telemetry metrics
  private totalCollected = 0;
  private totalDropped = 0;
  private totalSent = 0;
  private totalBatchesSent = 0;
  private retryAttemptsTotal = 0;
  private retrySuccessTotal = 0;
  private failedBatchesTotal = 0;

  constructor(config: CollectorConfig = {}) {
    this.config = {
      batchSize: config.batchSize ?? 50,
      flushIntervalMs: config.flushIntervalMs ?? 1000,
      maxBufferSize: config.maxBufferSize ?? 1000,
      overflowStrategy: config.overflowStrategy ?? 'drop-oldest',
      maxRetries: config.maxRetries ?? 3,
      initialRetryDelayMs: config.initialRetryDelayMs ?? 100,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      maxRetryDelayMs: config.maxRetryDelayMs ?? 5000,
      jitter: config.jitter ?? false,
      jitterFraction: config.jitterFraction ?? 0.2,
      sendFn: config.sendFn ?? (async () => {}),
      onDrop: config.onDrop,
      onSuccess: config.onSuccess,
      onRetry: config.onRetry,
      onError: config.onError
    };

    if (this.config.flushIntervalMs > 0) {
      this.startTimer();
    }
  }

  /**
   * Start or restart the periodic flush timer
   */
  public startTimer(): void {
    if (this.isDestroyed) return;
    this.stopTimer();
    if (this.config.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        if (this.buffer.length > 0 && !this.isFlushing) {
          this.flush().catch(() => {});
        }
      }, this.config.flushIntervalMs);
    }
  }

  /**
   * Stop the periodic flush timer
   */
  public stopTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Ingest a single log record into the buffer
   */
  public collect(log: LogRecord): boolean {
    if (this.isDestroyed) {
      throw new Error('LogCollector has been destroyed');
    }

    // Check buffer overflow
    if (this.buffer.length >= this.config.maxBufferSize) {
      switch (this.config.overflowStrategy) {
        case 'reject':
          throw new BufferOverflowError(
            `Buffer overflow: maximum capacity of ${this.config.maxBufferSize} reached`
          );

        case 'drop-newest':
          this.totalDropped++;
          this.config.onDrop?.([log], 'drop-newest: buffer capacity exceeded');
          return false;

        case 'drop-oldest':
        default: {
          const dropped = this.buffer.shift();
          if (dropped) {
            this.totalDropped++;
            this.config.onDrop?.([dropped], 'drop-oldest: buffer capacity exceeded');
          }
          break;
        }
      }
    }

    this.buffer.push(log);
    this.totalCollected++;

    // Trigger immediate flush if buffer reached batchSize
    if (this.buffer.length >= this.config.batchSize && !this.isFlushing) {
      this.flush().catch(() => {});
    }

    return true;
  }

  /**
   * Ingest multiple log records
   */
  public collectMany(logs: LogRecord[]): number {
    let accepted = 0;
    for (const log of logs) {
      if (this.collect(log)) {
        accepted++;
      }
    }
    return accepted;
  }

  /**
   * Calculate backoff delay for a given retry attempt
   * attempt 1: initialRetryDelayMs
   * attempt 2: initialRetryDelayMs * multiplier^1
   * ... capped at maxRetryDelayMs
   */
  public calculateBackoffDelay(attempt: number): number {
    const exponential = this.config.initialRetryDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    const capped = Math.min(this.config.maxRetryDelayMs, exponential);

    if (this.config.jitter) {
      const min = capped * (1 - this.config.jitterFraction);
      const max = capped * (1 + this.config.jitterFraction);
      return Math.round(min + Math.random() * (max - min));
    }

    return Math.round(capped);
  }

  /**
   * Flushes the current buffer in batches of up to batchSize with exponential backoff retry
   */
  public async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0 || this.isDestroyed) {
      return;
    }

    this.isFlushing = true;

    try {
      while (this.buffer.length > 0 && !this.isDestroyed) {
        // Dequeue batch of up to batchSize
        const batch = this.buffer.splice(0, this.config.batchSize);
        if (batch.length === 0) break;

        await this.sendBatchWithRetry(batch);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Send a batch with exponential backoff retries
   */
  private async sendBatchWithRetry(batch: LogRecord[]): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (this.isDestroyed) return;

      if (attempt > 0) {
        this.retryAttemptsTotal++;
        const delay = this.calculateBackoffDelay(attempt);
        this.config.onRetry?.(attempt, delay, lastError!);
        await this.sleep(delay);
      }

      try {
        await this.config.sendFn(batch);

        // Success
        this.totalSent += batch.length;
        this.totalBatchesSent++;
        if (attempt > 0) {
          this.retrySuccessTotal++;
        }
        this.config.onSuccess?.(batch);
        return;
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    // All retries exhausted
    this.failedBatchesTotal++;
    const finalError = new MaxRetriesExceededError(
      `Failed to send batch of ${batch.length} logs after ${this.config.maxRetries} retries: ${lastError?.message}`,
      batch
    );
    this.config.onError?.(finalError, batch);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Inspection & Getters
  public getBufferDepth(): number {
    return this.buffer.length;
  }

  public getBuffer(): LogRecord[] {
    return [...this.buffer];
  }

  public getMetrics() {
    return {
      bufferDepth: this.buffer.length,
      maxBufferSize: this.config.maxBufferSize,
      batchSize: this.config.batchSize,
      totalCollected: this.totalCollected,
      totalDropped: this.totalDropped,
      totalSent: this.totalSent,
      totalBatchesSent: this.totalBatchesSent,
      retryAttemptsTotal: this.retryAttemptsTotal,
      retrySuccessTotal: this.retrySuccessTotal,
      failedBatchesTotal: this.failedBatchesTotal
    };
  }

  public clearBuffer(): void {
    this.buffer = [];
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.stopTimer();
    this.buffer = [];
  }
}
