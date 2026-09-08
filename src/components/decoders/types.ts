export type FieldType = 
  | 'string' 
  | 'ip' 
  | 'port' 
  | 'timestamp' 
  | 'number' 
  | 'action' 
  | 'mac' 
  | 'email' 
  | 'url' 
  | 'hash' 
  | 'json';

export interface ExtractedField {
  id: string;
  name: string;
  value: string;
  regex: string;
  type: FieldType;
  ecsMapping?: string;
  ocsfMapping?: string;
  description?: string;
  confidence?: number;
  required?: boolean;
  colorTag?: string;
}

export type LogFilterOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'regex' 
  | 'starts_with';

export interface LogFilterCondition {
  id: string;
  field: string;
  operator: LogFilterOperator;
  value: string;
  active: boolean;
  highlightColor?: string;
}

export interface DecoderItem {
  id: string;
  name: string;
  brand: string;
  category: 'firewall' | 'os' | 'web' | 'cloud' | 'ids' | 'edr' | 'custom';
  version: string;
  description: string;
  iconType?: string;
  isCustom?: boolean;
  fields: ExtractedField[];
  sampleLog?: string;
  timestamp?: string;
  grokPattern?: string;
  avgParseMicros?: number;
  tags?: string[];
}

export interface LogSelectionContext {
  text: string;
  startIndex: number;
  endIndex: number;
  lineIndex: number;
  detectedType: FieldType;
  suggestedName: string;
  suggestedRegex: string;
  suggestedEcs: string;
}

export interface TokenSpan {
  id: string;
  text: string;
  start: number;
  end: number;
  isExtracted: boolean;
  extractedFieldId?: string;
  extractedFieldName?: string;
  extractedColor?: string;
  type?: FieldType;
  isFiltered?: boolean;
}

export interface DecoderBenchmarkMetric {
  decoderId: string;
  decoderName: string;
  epsThroughput: number;
  latencyMicros: number;
  matchRate: number;
  failedTokens: number;
  testSampleCount: number;
}
