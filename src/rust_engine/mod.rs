//! SEMOR Rust Engine Core (Stage 2)
//! 儲存核心模組定義

pub mod block;
pub mod index;
pub mod part;
pub mod storage;

pub use block::{
    BlockBuilder, BloomFilterBitArray, DeltaTimestampFields, VictoriaBlock, VictoriaBlockHeader,
    ZstdCompressionHeader, BLOCK_MAGIC, BLOCK_VERSION,
};
pub use index::{
    BlockHeaderIndex, IndexSummaryStats, IndexedBlockMeta, SearchExecutionStats, SearchLogRecord,
    SearchQuery, SearchResponse,
};
pub use part::{
    ActivePartWriter, BlockIndexEntry, PartMetadata, PartState,
    scan_part_file_headers, DEFAULT_MAX_PART_BYTES, DEFAULT_MAX_PART_ROWS,
};
pub use storage::{
    EngineStorageStats, StorageEngine, StreamStorage, StreamWal, WalRecord, WriteManager,
    WriteManagerConfig, WriteManagerMetrics, WAL_MAGIC, WAL_VERSION,
};
