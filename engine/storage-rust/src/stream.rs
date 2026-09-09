use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};
use std::sync::RwLock;

/// StreamID 標識日誌來源串流
pub type StreamId = u64;

/// StreamManager 管理日誌標籤組合至 StreamID 的映射
#[derive(Debug, Default)]
pub struct StreamManager {
    tag_to_id: RwLock<HashMap<String, StreamId>>,
    id_to_tags: RwLock<HashMap<StreamId, BTreeMap<String, String>>>,
}

impl StreamManager {
    pub fn new() -> Self {
        StreamManager {
            tag_to_id: RwLock::new(HashMap::new()),
            id_to_tags: RwLock::new(HashMap::new()),
        }
    }

    /// 依據日誌 Labels 計算或分配唯一的 StreamID
    pub fn get_or_create_stream_id(&self, labels: &BTreeMap<String, String>) -> StreamId {
        let canonical_key = self.canonicalize_labels(labels);

        {
            let reader = self.tag_to_id.read().unwrap();
            if let Some(&id) = reader.get(&canonical_key) {
                return id;
            }
        }

        let mut writer = self.tag_to_id.write().unwrap();
        if let Some(&id) = writer.get(&canonical_key) {
            return id;
        }

        // 使用 64-bit FNV-1a Hash 產生確定性的 StreamID
        let mut hash: u64 = 0xcbf29ce484222325;
        for byte in canonical_key.as_bytes() {
            hash ^= *byte as u64;
            hash = hash.wrapping_mul(0x100000001b3);
        }

        let stream_id = hash;
        writer.insert(canonical_key, stream_id);

        let mut id_writer = self.id_to_tags.write().unwrap();
        id_writer.insert(stream_id, labels.clone());

        stream_id
    }

    pub fn get_labels(&self, stream_id: StreamId) -> Option<BTreeMap<String, String>> {
        self.id_to_tags.read().unwrap().get(&stream_id).cloned()
    }

    fn canonicalize_labels(&self, labels: &BTreeMap<String, String>) -> String {
        let mut parts = Vec::with_capacity(labels.len());
        for (k, v) in labels {
            parts.push(format!("{}={}", k, v));
        }
        parts.join(",")
    }
}
