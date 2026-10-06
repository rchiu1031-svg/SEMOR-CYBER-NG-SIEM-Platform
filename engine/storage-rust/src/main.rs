use anyhow::Result;
use std::sync::Arc;
use std::time::Duration;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

mod block;
mod bloom;
mod ipc_server;
mod ndr_engine;
mod network_engine;
mod regex_pipeline;
mod storage;
mod stream;
mod xdr_engine;

use ipc_server::IpcServer;
use ndr_engine::NdrEngine;
use network_engine::NetworkEngine;
use regex_pipeline::RegexParserPipeline;
use storage::VictoriaStorageEngine;
use stream::StreamManager;
use xdr_engine::XdrEngine;

const APP_NAME: &str = "SEMOR VictoriaLogs Storage Core (Rust Engine)";
const APP_VERSION: &str = "v1.0.0-Block-Engine (Stage 5: NDR, XDR & Network Performance Core)";

#[tokio::main]
async fn main() -> Result<()> {
    // 1. 初始化結構化日誌記錄器
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    println!("========================================================");
    println!("   {}", APP_NAME);
    println!("   壓縮引擎: VictoriaLogs Block + Delta-of-Delta + ZSTD");
    println!("   儲存分區結構: /data/{{stream_id}}/{{part_id}}.block");
    println!("   分析核心: NDR 流量鑑識 + XDR 跨層級 MITRE 關聯 + 網路 NPM 拓撲監控");
    println!("   版本: {}", APP_VERSION);
    println!("========================================================");

    let data_dir = std::env::var("VLOG_DATA_DIR").unwrap_or_else(|_| "/data".to_string());
    let uds_path = std::env::var("RUST_UDS_PATH").unwrap_or_else(|_| "/tmp/semor_rust.sock".to_string());
    let tcp_addr = std::env::var("RUST_TCP_ADDR").unwrap_or_else(|_| "127.0.0.1:9527".to_string());

    // 2. 初始化 Stream 管理器、儲存引擎、Regex 解析管線、NDR 鑑識、XDR 關聯與網路監控引擎
    let stream_mgr = Arc::new(StreamManager::new());
    let storage = Arc::new(VictoriaStorageEngine::open(&data_dir, stream_mgr.clone())?);
    let regex_pipeline = Arc::new(RegexParserPipeline::new(&uds_path));
    let ndr_engine = Arc::new(NdrEngine::new(storage.clone()));
    let xdr_engine = Arc::new(XdrEngine::new(storage.clone()));
    let network_engine = Arc::new(NetworkEngine::new(storage.clone()));

    info!("儲存引擎分區結構就緒: {}/{{stream_id}}/{{part_id}}.block", data_dir);
    info!("Regex 解析與 ECS 標準化管線已啟動，監聽 UDS Socket: {}", uds_path);
    info!("NDR 網路威脅啟發式鑑識引擎已啟動 (支援 JA3 特徵庫、C2 Beaconing 與掃描阻斷)");
    info!("XDR 多層複合威脅關聯引擎已啟動 (支援 EDR/Sysmon + AD + K8s 滑動視窗攻擊鏈分析)");
    info!("NPM 網路效能與基礎架構監控引擎已啟動 (支援 SNMP Trap, MIB-II Delta, 微突發與 Flapping 鑑識)");

    // 3. 建立 IPC 服務實例
    let ipc = Arc::new(IpcServer::new(
        storage.clone(),
        stream_mgr.clone(),
        regex_pipeline.clone(),
        ndr_engine.clone(),
        xdr_engine.clone(),
        network_engine.clone(),
        &uds_path,
        &tcp_addr,
    ));

    // 4. 背景啟動 UDS IPC 監聽
    let ipc_uds = ipc.clone();
    tokio::spawn(async move {
        if let Err(e) = ipc_uds.run_uds().await {
            tracing::error!("UDS 服務異常中斷: {:?}", e);
        }
    });

    // 5. 背景啟動 TCP IPC 備援監聽
    let ipc_tcp = ipc.clone();
    tokio::spawn(async move {
        if let Err(e) = ipc_tcp.run_tcp().await {
            tracing::error!("TCP 服務異常中斷: {:?}", e);
        }
    });

    // 6. 啟動定期遙測報告器 (向終端輸出壓縮效能、塊計量、NDR、XDR 與 NPM 網路監控指標)
    let storage_telemetry = storage.clone();
    let ndr_telemetry = ndr_engine.clone();
    let xdr_telemetry = xdr_engine.clone();
    let network_telemetry = network_engine.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(5));
        loop {
            interval.tick().await;
            let stats = storage_telemetry.stats();
            let uncomp_mb = stats.uncompressed_bytes as f64 / (1024.0 * 1024.0);
            let comp_mb = stats.compressed_bytes as f64 / (1024.0 * 1024.0);
            let ndr_stats = ndr_telemetry.telemetry();
            let xdr_stats = xdr_telemetry.telemetry();
            let net_stats = network_telemetry.telemetry();

            info!(
                "[儲存核心遙測] 串流數: {} | Part分區數: {} | 總Block塊數: {} | 總筆數: {} | 原始: {:.2} MB | 壓縮後: {:.2} MB | 壓縮比率: {:.2}x",
                stats.total_streams, stats.total_parts, stats.total_blocks, stats.total_rows, uncomp_mb, comp_mb, stats.compression_ratio
            );
            info!(
                "[NDR 鑑識遙測] 累計流分析: {} 筆 | 威脅阻斷: {} 件 | C2 Beaconing: {} | 埠掃描: {} | 活躍Session: {}",
                ndr_stats["total_flows_processed"], ndr_stats["threats_blocked"], ndr_stats["c2_beacons_detected"], ndr_stats["port_scans_detected"], ndr_stats["active_tracked_sessions"]
            );
            info!(
                "[XDR 聯防遙測] 跨維度事件: {} 筆 | 攻擊鏈鏈路: {} 條 | 重大遏止: {} 件 | 監控主機資產: {} 台",
                xdr_stats["total_events_ingested"], xdr_stats["incidents_correlated"], xdr_stats["critical_containments"], xdr_stats["active_tracked_assets"]
            );
            info!(
                "[NPM 網路遙測] 介面指標: {} 筆 | SNMP Trap: {} 件 | 探針: {} 筆 | 飽和鏈路: {} | Flapping: {} | 微突發: {}",
                net_stats["total_metrics_ingested"], net_stats["total_traps_received"], net_stats["total_probes_received"], net_stats["saturated_links_detected"], net_stats["link_flaps_detected"], net_stats["microbursts_detected"]
            );
        }
    });

    // 7. 優雅關閉監聽
    tokio::signal::ctrl_c().await?;
    info!("接收到關閉信號，正在將記憶體緩衝區落盤並安全退出...");
    Ok(())
}
