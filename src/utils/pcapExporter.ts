/**
 * SEMOR Flow NDR - Standard PCAP & PCAPNG Exporter
 * Generates standards-compliant binary packet capture files (.pcap and .pcapng)
 * fully compatible with Wireshark, tshark, tcpdump, Arkime, and Zeek.
 */

export interface PacketDefinition {
  timestampSec: number;
  timestampUsec: number;
  data: Uint8Array;
}

export interface RawSessionInput {
  id: number;
  stream_id: string;
  time?: string;
  src_ip: string;
  src_port: number;
  dst_ip: string;
  dst_port: number;
  proto: string;
  tcp_flags?: string;
  messages?: Array<{
    seq: number;
    time_offset: string;
    dir: 'out' | 'in';
    msg_type: string;
    payload_preview: string;
    length: number;
  }>;
  hex_dump?: Array<{
    offset: string;
    hex: string;
    ascii?: string;
  }>;
}

/**
 * Parse an IPv4 string into 4 bytes.
 */
export function parseIPv4(ip: string): [number, number, number, number] {
  const parts = ip.split('.').map(n => parseInt(n.trim(), 10));
  if (parts.length === 4 && parts.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
    return [parts[0], parts[1], parts[2], parts[3]];
  }
  return [10, 0, 0, 1];
}

/**
 * Internet checksum (RFC 1071) for IPv4 headers.
 */
export function computeChecksum(buffer: Uint8Array, start: number = 0, len: number = buffer.length): number {
  let sum = 0;
  for (let i = start; i < start + len - 1; i += 2) {
    sum += (buffer[i] << 8) | buffer[i + 1];
  }
  if (len % 2 === 1) {
    sum += buffer[start + len - 1] << 8;
  }
  while (sum >> 16) {
    sum = (sum & 0xffff) + (sum >> 16);
  }
  return (~sum) & 0xffff;
}

/**
 * Convert hex dump entries into a raw Uint8Array.
 */
export function parseHexDumpToBytes(hexDump?: Array<{ offset: string; hex: string; ascii?: string }>): Uint8Array {
  if (!hexDump || hexDump.length === 0) return new Uint8Array(0);
  const bytes: number[] = [];
  for (const line of hexDump) {
    const tokens = line.hex.trim().split(/\s+/);
    for (const tok of tokens) {
      if (/^[0-9a-fA-F]{2}$/.test(tok)) {
        bytes.push(parseInt(tok, 16));
      }
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Build a complete Ethernet II + IPv4 + TCP/UDP frame.
 */
export function buildEthernetIpFrame(options: {
  srcMac?: [number, number, number, number, number, number];
  dstMac?: [number, number, number, number, number, number];
  srcIp: string;
  dstIp: string;
  isUdp?: boolean;
  srcPort: number;
  dstPort: number;
  tcpFlags?: number; // e.g. 0x02 = SYN, 0x12 = SYN-ACK, 0x10 = ACK, 0x18 = PSH-ACK, 0x11 = FIN-ACK
  seqNum?: number;
  ackNum?: number;
  payload?: Uint8Array;
  ipId?: number;
}): Uint8Array {
  const {
    srcMac = [0x00, 0x0c, 0x29, 0xd2, 0x3f, 0x5a],
    dstMac = [0x00, 0x50, 0x56, 0xc0, 0x00, 0x08],
    srcIp,
    dstIp,
    isUdp = false,
    srcPort,
    dstPort,
    tcpFlags = 0x18,
    seqNum = 1000,
    ackNum = 1,
    payload = new Uint8Array(0),
    ipId = 0x4a12,
  } = options;

  const ethLen = 14;
  const ipLen = 20;
  const transportLen = isUdp ? 8 : 20;
  const totalLen = ethLen + ipLen + transportLen + payload.length;

  const frame = new Uint8Array(totalLen);
  const view = new DataView(frame.buffer);

  // 1. Ethernet II Header (14 bytes)
  for (let i = 0; i < 6; i++) {
    frame[i] = dstMac[i];
    frame[6 + i] = srcMac[i];
  }
  view.setUint16(12, 0x0800, false); // EtherType: IPv4 (0x0800)

  // 2. IPv4 Header (20 bytes)
  const ipStart = ethLen;
  frame[ipStart] = 0x45; // Version 4, IHL 5 (20 bytes)
  frame[ipStart + 1] = 0x00; // DSCP / ECN
  view.setUint16(ipStart + 2, ipLen + transportLen + payload.length, false); // Total Length
  view.setUint16(ipStart + 4, ipId & 0xffff, false); // Identification
  view.setUint16(ipStart + 6, 0x4000, false); // Flags: Don't Fragment (0x4000)
  frame[ipStart + 8] = 64; // TTL
  frame[ipStart + 9] = isUdp ? 17 : 6; // Protocol: 17 (UDP) or 6 (TCP)
  view.setUint16(ipStart + 10, 0x0000, false); // Clear checksum before calc

  const [s1, s2, s3, s4] = parseIPv4(srcIp);
  const [d1, d2, d3, d4] = parseIPv4(dstIp);
  frame[ipStart + 12] = s1;
  frame[ipStart + 13] = s2;
  frame[ipStart + 14] = s3;
  frame[ipStart + 15] = s4;
  frame[ipStart + 16] = d1;
  frame[ipStart + 17] = d2;
  frame[ipStart + 18] = d3;
  frame[ipStart + 19] = d4;

  // Compute IPv4 Header Checksum
  const ipChecksum = computeChecksum(frame.subarray(ipStart, ipStart + ipLen));
  view.setUint16(ipStart + 10, ipChecksum, false);

  // 3. Transport Header
  const transStart = ipStart + ipLen;
  if (isUdp) {
    // UDP Header (8 bytes)
    view.setUint16(transStart, srcPort & 0xffff, false);
    view.setUint16(transStart + 2, dstPort & 0xffff, false);
    view.setUint16(transStart + 4, 8 + payload.length, false);
    view.setUint16(transStart + 6, 0x0000, false); // Checksum optional for IPv4 UDP
  } else {
    // TCP Header (20 bytes)
    view.setUint16(transStart, srcPort & 0xffff, false);
    view.setUint16(transStart + 2, dstPort & 0xffff, false);
    view.setUint32(transStart + 4, seqNum >>> 0, false);
    view.setUint32(transStart + 8, ackNum >>> 0, false);
    frame[transStart + 12] = 0x50; // Data Offset: 5 words (20 bytes)
    frame[transStart + 13] = tcpFlags & 0xff; // Flags
    view.setUint16(transStart + 14, 64240, false); // Window size
    view.setUint16(transStart + 16, 0x0000, false); // Checksum
    view.setUint16(transStart + 18, 0x0000, false); // Urgent pointer
  }

  // 4. Payload
  if (payload.length > 0) {
    frame.set(payload, transStart + transportLen);
  }

  return frame;
}

/**
 * Generate a complete sequence of realistic packets from a session.
 * Reconstructs 3-way handshake, request/response payload stream, and teardown.
 */
export function generatePacketsForSession(
  session: RawSessionInput,
  baseTimeSec: number = Math.floor(Date.now() / 1000) - 300
): PacketDefinition[] {
  const packets: PacketDefinition[] = [];
  const isUdp = session.proto.toUpperCase() === 'UDP' || session.proto.toUpperCase() === 'DNS';

  // MAC addresses
  const clientMac: [number, number, number, number, number, number] = [0x00, 0x0c, 0x29, 0x11, 0x22, 0x33];
  const serverMac: [number, number, number, number, number, number] = [0x00, 0x50, 0x56, 0xaa, 0xbb, 0xcc];

  let clientSeq = 1000000 + (session.id * 7777);
  let serverSeq = 5000000 + (session.id * 9999);
  let ipId = 1000 + (session.id * 100);

  // Time calculation helper
  const parseOffsetUsec = (offsetStr: string): number => {
    // format like '+18.2 ms' or '+0.000 ms'
    const match = offsetStr.match(/([0-9.]+)\s*ms/);
    if (match) {
      return Math.round(parseFloat(match[1]) * 1000);
    }
    return 0;
  };

  let startUsec = (session.id * 250000) % 1000000;

  // 1. TCP 3-Way Handshake (if TCP)
  if (!isUdp) {
    // SYN (Client -> Server)
    const synFrame = buildEthernetIpFrame({
      srcMac: clientMac,
      dstMac: serverMac,
      srcIp: session.src_ip,
      dstIp: session.dst_ip,
      srcPort: session.src_port,
      dstPort: session.dst_port,
      tcpFlags: 0x02, // SYN
      seqNum: clientSeq,
      ackNum: 0,
      ipId: ipId++
    });
    packets.push({ timestampSec: baseTimeSec, timestampUsec: startUsec, data: synFrame });
    clientSeq++;

    // SYN-ACK (Server -> Client)
    startUsec += 15000;
    const synAckFrame = buildEthernetIpFrame({
      srcMac: serverMac,
      dstMac: clientMac,
      srcIp: session.dst_ip,
      dstIp: session.src_ip,
      srcPort: session.dst_port,
      dstPort: session.src_port,
      tcpFlags: 0x12, // SYN-ACK
      seqNum: serverSeq,
      ackNum: clientSeq,
      ipId: ipId++
    });
    packets.push({ timestampSec: baseTimeSec, timestampUsec: startUsec, data: synAckFrame });
    serverSeq++;

    // ACK (Client -> Server)
    startUsec += 2000;
    const ackFrame = buildEthernetIpFrame({
      srcMac: clientMac,
      dstMac: serverMac,
      srcIp: session.src_ip,
      dstIp: session.dst_ip,
      srcPort: session.src_port,
      dstPort: session.dst_port,
      tcpFlags: 0x10, // ACK
      seqNum: clientSeq,
      ackNum: serverSeq,
      ipId: ipId++
    });
    packets.push({ timestampSec: baseTimeSec, timestampUsec: startUsec, data: ackFrame });
  }

  // 2. Data Messages
  const hexBytes = parseHexDumpToBytes(session.hex_dump);
  const messages = session.messages && session.messages.length > 0 ? session.messages : [];

  if (messages.length > 0) {
    let hexDumpAssigned = false;

    messages.forEach((msg, idx) => {
      const isOut = msg.dir === 'out';
      const offsetUsec = parseOffsetUsec(msg.time_offset);
      const curUsec = startUsec + offsetUsec + (idx * 5000);
      const secInc = Math.floor(curUsec / 1000000);
      const finalUsec = curUsec % 1000000;

      // Prepare payload
      let payload: Uint8Array;
      if (!hexDumpAssigned && isOut && hexBytes.length > 0) {
        payload = hexBytes;
        hexDumpAssigned = true;
      } else {
        // Synthesize payload from message string
        const encoder = new TextEncoder();
        const textPayload = msg.payload_preview || `Session ${session.stream_id} Msg #${msg.seq}: ${msg.msg_type}`;
        payload = encoder.encode(textPayload);
      }

      const frame = buildEthernetIpFrame({
        srcMac: isOut ? clientMac : serverMac,
        dstMac: isOut ? serverMac : clientMac,
        srcIp: isOut ? session.src_ip : session.dst_ip,
        dstIp: isOut ? session.dst_ip : session.src_ip,
        isUdp,
        srcPort: isOut ? session.src_port : session.dst_port,
        dstPort: isOut ? session.dst_port : session.src_port,
        tcpFlags: 0x18, // PSH-ACK
        seqNum: isOut ? clientSeq : serverSeq,
        ackNum: isOut ? serverSeq : clientSeq,
        payload,
        ipId: ipId++
      });

      packets.push({
        timestampSec: baseTimeSec + secInc,
        timestampUsec: finalUsec,
        data: frame
      });

      if (isOut) {
        clientSeq += payload.length;
      } else {
        serverSeq += payload.length;
      }
    });
  } else if (hexBytes.length > 0) {
    // Single payload frame if no granular message array
    startUsec += 10000;
    const frame = buildEthernetIpFrame({
      srcMac: clientMac,
      dstMac: serverMac,
      srcIp: session.src_ip,
      dstIp: session.dst_ip,
      isUdp,
      srcPort: session.src_port,
      dstPort: session.dst_port,
      tcpFlags: 0x18,
      seqNum: clientSeq,
      ackNum: serverSeq,
      payload: hexBytes,
      ipId: ipId++
    });
    packets.push({ timestampSec: baseTimeSec, timestampUsec: startUsec, data: frame });
    clientSeq += hexBytes.length;
  }

  // 3. TCP Teardown (FIN-ACK / ACK)
  if (!isUdp) {
    startUsec += 50000;
    // FIN-ACK from client
    const finFrame = buildEthernetIpFrame({
      srcMac: clientMac,
      dstMac: serverMac,
      srcIp: session.src_ip,
      dstIp: session.dst_ip,
      srcPort: session.src_port,
      dstPort: session.dst_port,
      tcpFlags: 0x11, // FIN-ACK
      seqNum: clientSeq,
      ackNum: serverSeq,
      ipId: ipId++
    });
    packets.push({
      timestampSec: baseTimeSec + Math.floor(startUsec / 1000000),
      timestampUsec: startUsec % 1000000,
      data: finFrame
    });
    clientSeq++;

    // ACK from server
    startUsec += 10000;
    const finAckFrame = buildEthernetIpFrame({
      srcMac: serverMac,
      dstMac: clientMac,
      srcIp: session.dst_ip,
      dstIp: session.src_ip,
      srcPort: session.dst_port,
      dstPort: session.src_port,
      tcpFlags: 0x10, // ACK
      seqNum: serverSeq,
      ackNum: clientSeq,
      ipId: ipId++
    });
    packets.push({
      timestampSec: baseTimeSec + Math.floor(startUsec / 1000000),
      timestampUsec: startUsec % 1000000,
      data: finAckFrame
    });
  }

  return packets;
}

/**
 * Generate standard libpcap (PCAP 2.4) binary format Uint8Array.
 */
export function generatePcapBinary(packets: PacketDefinition[]): Uint8Array {
  // Sort packets chronologically
  const sorted = [...packets].sort((a, b) => {
    if (a.timestampSec !== b.timestampSec) {
      return a.timestampSec - b.timestampSec;
    }
    return a.timestampUsec - b.timestampUsec;
  });

  // Calculate total file size: 24-byte global header + sum(16 + pkt.length)
  let totalSize = 24;
  for (const pkt of sorted) {
    totalSize += 16 + pkt.data.length;
  }

  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // Global Header (24 bytes, little-endian)
  view.setUint32(0, 0xa1b2c3d4, true); // Magic Number: standard microsecond PCAP
  view.setUint16(4, 2, true);          // Version Major: 2
  view.setUint16(6, 4, true);          // Version Minor: 4
  view.setInt32(8, 0, true);           // Thiszone (GMT to local correction): 0
  view.setUint32(12, 0, true);         // Sigfigs: 0
  view.setUint32(16, 65535, true);     // Snaplen: 65535
  view.setUint32(20, 1, true);         // LinkType: LINKTYPE_ETHERNET = 1

  let offset = 24;

  // Packet Records
  for (const pkt of sorted) {
    const len = pkt.data.length;
    // Packet Header (16 bytes)
    view.setUint32(offset, pkt.timestampSec, true);   // ts_sec
    view.setUint32(offset + 4, pkt.timestampUsec, true); // ts_usec
    view.setUint32(offset + 8, len, true);             // incl_len
    view.setUint32(offset + 12, len, true);            // orig_len

    offset += 16;
    buffer.set(pkt.data, offset);
    offset += len;
  }

  return buffer;
}

/**
 * Generate standard PCAPNG (pcap Next Generation) binary format Uint8Array.
 * Uses Section Header Block (SHB), Interface Description Block (IDB),
 * and Enhanced Packet Blocks (EPB).
 */
export function generatePcapngBinary(packets: PacketDefinition[]): Uint8Array {
  // Sort packets chronologically
  const sorted = [...packets].sort((a, b) => {
    if (a.timestampSec !== b.timestampSec) {
      return a.timestampSec - b.timestampSec;
    }
    return a.timestampUsec - b.timestampUsec;
  });

  // Calculate total size:
  // SHB: 28 bytes
  // IDB: 20 bytes
  // EPBs: for each packet: 32 + ceil4(pkt.data.length)
  const shbLen = 28;
  const idbLen = 20;
  let totalSize = shbLen + idbLen;

  for (const pkt of sorted) {
    const paddedLen = (pkt.data.length + 3) & ~3;
    totalSize += 32 + paddedLen;
  }

  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);
  let offset = 0;

  // 1. Section Header Block (SHB - 28 bytes)
  view.setUint32(offset, 0x0a0d0d0a, true);      // Block Type: SHB
  view.setUint32(offset + 4, shbLen, true);        // Block Total Length
  view.setUint32(offset + 8, 0x1a2e3b4c, true);    // Byte-Order Magic
  view.setUint16(offset + 12, 1, true);            // Major Version: 1
  view.setUint16(offset + 14, 0, true);            // Minor Version: 0
  // Section Length: -1 (unspecified)
  view.setUint32(offset + 16, 0xffffffff, true);
  view.setUint32(offset + 20, 0xffffffff, true);
  view.setUint32(offset + 24, shbLen, true);       // Block Total Length (repeat)
  offset += shbLen;

  // 2. Interface Description Block (IDB - 20 bytes)
  view.setUint32(offset, 0x00000001, true);      // Block Type: IDB
  view.setUint32(offset + 4, idbLen, true);        // Block Total Length
  view.setUint16(offset + 8, 1, true);             // LinkType: 1 (LINKTYPE_ETHERNET)
  view.setUint16(offset + 10, 0, true);            // Reserved: 0
  view.setUint32(offset + 12, 65535, true);        // SnapLen: 65535
  view.setUint32(offset + 16, idbLen, true);       // Block Total Length (repeat)
  offset += idbLen;

  // 3. Enhanced Packet Blocks (EPB)
  for (const pkt of sorted) {
    const pktLen = pkt.data.length;
    const paddedLen = (pktLen + 3) & ~3;
    const epbLen = 32 + paddedLen;

    // Convert sec + usec into 64-bit microsecond timestamp
    const totalUsec = BigInt(pkt.timestampSec) * 1000000n + BigInt(pkt.timestampUsec);
    const tsHigh = Number((totalUsec >> 32n) & 0xffffffffn);
    const tsLow = Number(totalUsec & 0xffffffffn);

    view.setUint32(offset, 0x00000006, true);       // Block Type: EPB
    view.setUint32(offset + 4, epbLen, true);         // Block Total Length
    view.setUint32(offset + 8, 0, true);              // Interface ID: 0
    view.setUint32(offset + 12, tsHigh, true);        // Timestamp High
    view.setUint32(offset + 16, tsLow, true);         // Timestamp Low
    view.setUint32(offset + 20, pktLen, true);        // Captured Packet Length
    view.setUint32(offset + 24, pktLen, true);        // Original Packet Length

    // Packet Data
    buffer.set(pkt.data, offset + 28);

    // Padding with zeroes
    for (let p = pktLen; p < paddedLen; p++) {
      buffer[offset + 28 + p] = 0;
    }

    // Block Total Length (repeat at end)
    view.setUint32(offset + 28 + paddedLen, epbLen, true);

    offset += epbLen;
  }

  return buffer;
}

/**
 * Trigger download in the browser.
 */
export function downloadCaptureFile(
  content: Uint8Array,
  filename: string,
  format: 'pcap' | 'pcapng'
) {
  const mimeType = format === 'pcapng' ? 'application/vnd.tcpdump.pcap' : 'application/vnd.tcpdump.pcap';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * High-level helper to export filtered sessions into PCAP or PCAPNG.
 */
export function exportSessionsToPcap(
  sessions: RawSessionInput[],
  format: 'pcap' | 'pcapng',
  customFilename?: string
): { filename: string; packetCount: number; byteSize: number } {
  const allPackets: PacketDefinition[] = [];
  const baseTimeSec = Math.floor(Date.now() / 1000) - (sessions.length * 60);

  sessions.forEach((s, idx) => {
    const sessionBaseTime = baseTimeSec + (idx * 30);
    const pkts = generatePacketsForSession(s, sessionBaseTime);
    allPackets.push(...pkts);
  });

  const binaryData = format === 'pcapng'
    ? generatePcapngBinary(allPackets)
    : generatePcapBinary(allPackets);

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const defaultFilename = sessions.length === 1
    ? `${sessions[0].stream_id}_${sessions[0].proto.toLowerCase()}_${timestamp}.${format}`
    : `semor_flow_filtered_${sessions.length}sessions_${timestamp}.${format}`;

  const filename = customFilename || defaultFilename;
  downloadCaptureFile(binaryData, filename, format);

  return {
    filename,
    packetCount: allPackets.length,
    byteSize: binaryData.byteLength
  };
}
