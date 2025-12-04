// Đo độ tương đồng văn bản dựa trên mô hình vec-tơ + Cosine
// Áp dụng cho transcript Speaking sau khi đã chuyển audio -> text.

// Danh sách stopword tiếng Anh đơn giản (có thể mở rộng sau)
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but',
  'of', 'to', 'in', 'on', 'for', 'with',
  'at', 'by', 'from', 'up', 'about', 'into',
  'over', 'after', 'before', 'between', 'through',
  'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'that', 'this', 'these', 'those', 'it', 'its',
  'as', 'so', 'such', 'than', 'too', 'very',
  'i', 'you', 'he', 'she', 'we', 'they', 'them',
  'my', 'your', 'his', 'her', 'our', 'their',
]);

/**
 * Tiền xử lý văn bản: lower-case, bỏ ký tự đặc biệt, tách từ, bỏ stopword.
 */
export function preprocessText(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  // Giữ lại chữ cái và khoảng trắng
  const cleaned = lower.replace(/[^a-z\s]/g, ' ');
  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t)); // loại bỏ từ quá ngắn & stopword
  return tokens;
}

/**
 * Xây dựng vector tần suất từ hai tập token.
 */
function buildFrequencyVectors(tokensA, tokensB) {
  const vocab = new Map(); // từ -> index
  const addToVocab = (token) => {
    if (!vocab.has(token)) {
      vocab.set(token, vocab.size);
    }
  };

  tokensA.forEach(addToVocab);
  tokensB.forEach(addToVocab);

  const size = vocab.size || 1;
  const vecA = new Array(size).fill(0);
  const vecB = new Array(size).fill(0);

  tokensA.forEach((t) => {
    const idx = vocab.get(t);
    vecA[idx] += 1;
  });
  tokensB.forEach((t) => {
    const idx = vocab.get(t);
    vecB[idx] += 1;
  });

  return { vecA, vecB };
}

/**
 * Tính Cosine similarity giữa 2 vector số.
 */
function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Tính độ tương đồng Cosine giữa hai đoạn văn bản.
 * Trả về số trong khoảng [0, 1].
 */
export function textCosineSimilarity(textA, textB) {
  const tokensA = preprocessText(textA);
  const tokensB = preprocessText(textB);
  if (!tokensA.length || !tokensB.length) return 0;
  const { vecA, vecB } = buildFrequencyVectors(tokensA, tokensB);
  return cosineSimilarity(vecA, vecB);
}


