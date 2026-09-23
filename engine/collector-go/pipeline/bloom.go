package pipeline

import (
	"hash/fnv"
	"strings"
	"unicode"
)

// DefaultBloomFilterBits VictoriaLogs 設計模式中單個 Block 預設布隆過濾器位元大小 (16384 bits = 2048 Bytes)
const (
	DefaultBloomFilterBits  = 16384
	DefaultBloomFilterBytes = DefaultBloomFilterBits / 8
	BloomHashFunctions      = 3
)

// FastTokenBloomFilter 實作 VictoriaLogs 區塊級詞彙布隆過濾器
// 用於在日誌收集器入庫聚合階段預先萃取詞彙並建立位元索引，供後續檢索時達成 95%+ 區塊免解壓剪枝
type FastTokenBloomFilter struct {
	bits     []byte
	numBits  uint32
	numBytes uint32
	tokens   uint32
}

func NewFastTokenBloomFilter() *FastTokenBloomFilter {
	return &FastTokenBloomFilter{
		bits:     make([]byte, DefaultBloomFilterBytes),
		numBits:  DefaultBloomFilterBits,
		numBytes: DefaultBloomFilterBytes,
		tokens:   0,
	}
}

// AddToken 將單一詞彙加入布隆過濾器
func (bf *FastTokenBloomFilter) AddToken(token string) {
	if len(token) < 2 {
		return
	}
	h1, h2 := hashTokenPair(token)
	for i := uint32(0); i < BloomHashFunctions; i++ {
		combined := (h1 + i*h2) % bf.numBits
		byteIdx := combined / 8
		bitIdx := combined % 8
		bf.bits[byteIdx] |= (1 << bitIdx)
	}
	bf.tokens++
}

// MayContain 檢查詞彙是否存在於此區塊中 (若回傳 false 則百分之百不包含，可跳過此區塊解壓)
func (bf *FastTokenBloomFilter) MayContain(token string) bool {
	if len(token) < 2 {
		return true
	}
	h1, h2 := hashTokenPair(token)
	for i := uint32(0); i < BloomHashFunctions; i++ {
		combined := (h1 + i*h2) % bf.numBits
		byteIdx := combined / 8
		bitIdx := combined % 8
		if (bf.bits[byteIdx] & (1 << bitIdx)) == 0 {
			return false
		}
	}
	return true
}

// AddTokensFromText 依據 VictoriaLogs 詞彙切分模式解構文字並寫入過濾器
// 規則：以非英數字及特殊分隔符切分，篩選長度 >= 3 的關鍵字彙 (如 IP、使用者、錯誤碼、網域名稱)
func (bf *FastTokenBloomFilter) AddTokensFromText(text string) int {
	var count int
	var tokenStart = -1

	runes := []rune(text)
	for i, r := range runes {
		isTokenChar := unicode.IsLetter(r) || unicode.IsDigit(r) || r == '.' || r == '_' || r == '-' || r == ':'
		if isTokenChar {
			if tokenStart < 0 {
				tokenStart = i
			}
		} else {
			if tokenStart >= 0 {
				tokenLen := i - tokenStart
				if tokenLen >= 3 && tokenLen <= 64 {
					token := strings.ToLower(string(runes[tokenStart:i]))
					bf.AddToken(token)
					count++
				}
				tokenStart = -1
			}
		}
	}

	if tokenStart >= 0 {
		tokenLen := len(runes) - tokenStart
		if tokenLen >= 3 && tokenLen <= 64 {
			token := strings.ToLower(string(runes[tokenStart:]))
			bf.AddToken(token)
			count++
		}
	}

	return count
}

// Bytes 輸出布隆過濾器二進位位元組陣列
func (bf *FastTokenBloomFilter) Bytes() []byte {
	return bf.bits
}

// TokensCount 取得此過濾器累計記錄的詞彙總數
func (bf *FastTokenBloomFilter) TokensCount() uint32 {
	return bf.tokens
}

// hashTokenPair 計算雙重雜湊因子 (Double-Hashing)
func hashTokenPair(s string) (uint32, uint32) {
	h := fnv.New32a()
	_, _ = h.Write([]byte(s))
	h1 := h.Sum32()

	// 第二組雜湊使用位元旋轉與質數加權
	h2 := (h1 >> 16) ^ (h1 * 0x85ebca6b)
	if h2 == 0 {
		h2 = 1
	}
	return h1, h2
}
