import { GoogleGenerativeAI } from "@google/generative-ai";
import { downloadFileBuffer } from "./s3.js";
import dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const IS_MOCK = process.env.AI_EVAL_MOCK === 'true';
const EVAL_MODEL_NAME = process.env.GEMINI_EVAL_MODEL || 'gemini-2.0-flash-exp';
const TRANSCRIBE_MODEL_NAME = process.env.GEMINI_TRANSCRIBE_MODEL || 'gemini-2.0-flash-exp';

console.log("\n🤖 AI Grading System Initialized:");
console.log("  API Key:", API_KEY ? `${API_KEY.substring(0, 15)}...` : "❌ MISSING");
console.log("  Mock Mode:", IS_MOCK);
console.log("  Eval Model:", EVAL_MODEL_NAME);
console.log("  Transcribe Model:", TRANSCRIBE_MODEL_NAME);

// --- Client ---
let geminiClient = null;

function getClient() {
  if (!API_KEY) {
    throw new Error('❌ GEMINI_API_KEY not configured');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(API_KEY);
  }
  return geminiClient;
}

function getModel(modelName) {
  const client = getClient();
  return client.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.4, // Lower for more consistent grading
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096, // Increased for detailed feedback
    }
  });
}

// --- JSON Parser ---
function extractJsonObject(raw) {
  try {
    const trimmed = raw.trim();
    
    // Try markdown fence
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1].trim());
    }
    
    // Try to find JSON object
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Direct parse
    return JSON.parse(trimmed);
  } catch (error) {
    console.error("❌ Parse Error:", error.message);
    console.error("📄 Raw (500 chars):", raw.substring(0, 500));
    throw new Error(`JSON parse failed: ${error.message}`);
  }
}

function inferMimeType(filename) {
  if (!filename) return undefined;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.webm')) return 'audio/webm';
  return undefined;
}

// --- Transcribe Audio ---
async function transcribeAudio(audioBuffer, audioFileKey) {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('No audio data');
  }

  const model = getModel(TRANSCRIBE_MODEL_NAME);
  const data = audioBuffer.toString('base64');
  const type = inferMimeType(audioFileKey) || 'audio/webm';

  const result = await model.generateContent([
    { 
      text: `Bạn là một hệ thống nhận dạng giọng nói (speech-to-text) RẤT NGHIÊM KHẮC.
            Nhiệm vụ:
            - Phiên âm lại tiếng Anh trong audio thành văn bản CHÍNH XÁC như người nói.
            - KHÔNG được sửa ngữ pháp, KHÔNG đổi thứ tự từ, KHÔNG thay lời cho “hay” hơn, kể cả khi câu sai hoặc không tự nhiên.
            - Giữ nguyên đúng thứ tự từ như trong audio.
            - Giữ lại tất cả các từ đệm / từ lấp (vd: uh, um, ah, like, you know, v.v.) và cả các chỗ lặp từ.
            - Nếu có đoạn nghe không rõ, hãy ghi đúng vị trí đó là [unclear].
            - Tuyệt đối KHÔNG được viết lại, diễn đạt lại hay cải thiện câu nói theo bất kỳ cách nào.

            Quy tắc xuất ra:
            - CHỈ trả về chuỗi transcript thô (văn bản người nói).
            - KHÔNG giải thích, KHÔNG thêm JSON, KHÔNG thêm nhận xét hay ghi chú nào khác.

            Nếu bạn phân vân giữa phiên bản “đúng ngữ pháp” và phiên bản “nghe được nhưng có thể sai”, LUÔN CHỌN phiên bản NGHE ĐƯỢC (kể cả khi sai).` 
    },
    { inlineData: { data, mimeType: type } }
  ]);

  const text = result.response?.text()?.trim();
  if (!text) {
    throw new Error('No transcript received');
  }

  return text;
}

// --- Evaluate Speaking ---
async function evaluateSpeaking(prompt, transcript) {
  const model = getModel(EVAL_MODEL_NAME);

  const systemPrompt = `You are an expert IELTS Speaking examiner with 10+ years of experience.

Evaluate the speaking response based on IELTS criteria adapted for EPT (0-100 scale).

Return ONLY this JSON structure (no markdown, no extra text):
{
  "overall": 75,
  "bands": {
    "fluency": 70,
    "pronunciation": 75,
    "grammar": 80,
    "vocabulary": 75,
    "coherence": 70
  },
  "summary": "Brief 2-3 sentence overall assessment",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "transcriptAnalysis": {
    "grammarIssues": ["issue with correction"],
    "vocabularyIssues": ["issue with suggestion"],
    "improvedTranscript": "Corrected version of transcript"
  },
  "recommendations": ["actionable tip 1", "actionable tip 2"]
}

Scoring Guide (0-100):
- 90-100: Exceptional, native-like fluency
- 80-89: Very good, minor errors
- 70-79: Good, some errors but clear communication
- 60-69: Satisfactory, noticeable errors
- 50-59: Limited, frequent errors
- Below 50: Needs significant improvement`;

  const userPrompt = `QUESTION/PROMPT:
${prompt || 'General speaking task'}

STUDENT'S TRANSCRIPT:
${transcript}

Evaluate thoroughly and return JSON only.`;

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userPrompt }
  ]);

  const text = result.response?.text();
  if (!text) {
    throw new Error('No response');
  }

  return extractJsonObject(text);
}

// === EXPORT FUNCTIONS ===

/**
 * Grade Writing with Enhanced Rubric
 */
export const gradeWriting = async (questionPrompt, userEssay) => {
  const timestamp = new Date().toISOString();
  console.log("\n" + "=".repeat(70));
  console.log(`📝 GRADING WRITING [${timestamp}]`);
  console.log("=".repeat(70));
  console.log(`📊 Essay: ${userEssay?.length || 0} chars`);
  console.log(`🤖 Model: ${EVAL_MODEL_NAME}`);
  
  if (IS_MOCK) {
    console.log("⚠️  MOCK MODE ACTIVE");
    return { 
      score: 80, 
      feedback: "Mock feedback: Good essay with minor grammar issues.",
      details: {
        grammar: 75,
        vocabulary: 85,
        coherence: 80,
        task_achievement: 80
      }
    };
  }

  try {
    console.log("\n[1/5] Initializing AI model...");
    const model = getModel(EVAL_MODEL_NAME);
    console.log("      ✓ Model ready");
    
    const systemPrompt = `You are an expert EPT English writing examiner with a Master's degree in Applied Linguistics.

Evaluate this essay using a comprehensive rubric (0-100 scale for each criterion).

Return ONLY this JSON structure:
{
  "score": 75,
  "feedback": "Comprehensive 3-4 sentence overall feedback",
  "details": {
    "grammar": 70,
    "vocabulary": 80,
    "coherence": 75,
    "task_achievement": 78,
    "organization": 72
  },
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["specific issue 1 with example", "specific issue 2 with example"],
  "grammarErrors": [
    {"error": "exact phrase from essay", "correction": "corrected phrase", "explanation": "why"}
  ],
  "vocabularyIssues": [
    {"word": "problematic word", "suggestion": "better alternative", "reason": "why"}
  ],
  "recommendations": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
}

Detailed Rubric (each 0-100):

GRAMMAR (0-100):
- 90-100: Near-perfect grammar, complex structures used correctly
- 80-89: Very good, minor errors that don't impede communication
- 70-79: Good control, some errors in complex structures
- 60-69: Adequate, noticeable errors but meaning is clear
- 50-59: Limited control, frequent errors affecting clarity
- Below 50: Poor control, pervasive errors

VOCABULARY (0-100):
- 90-100: Sophisticated, precise word choice, varied expressions
- 80-89: Very good range, appropriate use of advanced vocabulary
- 70-79: Good range, some advanced vocabulary with minor inaccuracies
- 60-69: Adequate range, relies on common words, some repetition
- 50-59: Limited range, frequent repetition, word choice errors
- Below 50: Very limited vocabulary

COHERENCE & COHESION (0-100):
- 90-100: Excellent flow, perfect use of cohesive devices
- 80-89: Very good logical flow, appropriate linking
- 70-79: Good organization, adequate linking with minor issues
- 60-69: Adequate organization, some awkward transitions
- 50-59: Limited coherence, unclear progression
- Below 50: Lacks clear organization

TASK ACHIEVEMENT (0-100):
- 90-100: Fully addresses all parts, highly developed ideas
- 80-89: Addresses all parts well, clear position throughout
- 70-79: Addresses task, some parts more developed than others
- 60-69: Addresses task but with limited development
- 50-59: Minimally addresses task, lacks development
- Below 50: Does not adequately address task

ORGANIZATION (0-100):
- 90-100: Perfect structure, clear paragraphing
- 80-89: Very well organized with clear structure
- 70-79: Good organization, logical paragraphing
- 60-69: Adequate structure, some organizational issues
- 50-59: Limited organization, unclear structure
- Below 50: Poor organization

Final score = average of all criteria.`;

    const userPrompt = `QUESTION/PROMPT:
${questionPrompt}

STUDENT'S ESSAY:
${userEssay}

Word count: ${userEssay.split(/\s+/).length} words

Evaluate thoroughly using the rubric above. Return ONLY JSON.`;
    
    console.log("\n[2/5] Sending to Gemini API...");
    console.log(`      Prompt: ${systemPrompt.length + userPrompt.length} chars`);
    
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);
    console.log("      ✓ Response received");

    const rawText = result.response?.text();
    console.log("\n[3/5] Processing response...");
    console.log(`      Length: ${rawText?.length || 0} chars`);
    console.log(`      Preview: ${rawText?.substring(0, 150).replace(/\n/g, ' ')}...`);

    if (!rawText) {
      throw new Error('Empty response from Gemini');
    }

    console.log("\n[4/5] Parsing JSON...");
    const parsed = extractJsonObject(rawText);
    console.log("      ✓ JSON parsed successfully");
    console.log(`      Score: ${parsed.score}`);
    
    // Validate
    if (typeof parsed.score !== 'number') {
      throw new Error(`Invalid score type: ${typeof parsed.score}`);
    }
    
    if (parsed.score < 0 || parsed.score > 100) {
      throw new Error(`Score out of range: ${parsed.score}`);
    }

    // Format detailed feedback - IMPROVED VERSION
    const detailedScores = [
      { label: 'Grammar', score: parsed.details?.grammar || 0, icon: '📝' },
      { label: 'Vocabulary', score: parsed.details?.vocabulary || 0, icon: '📚' },
      { label: 'Coherence', score: parsed.details?.coherence || 0, icon: '🔗' },
      { label: 'Task Achievement', score: parsed.details?.task_achievement || 0, icon: '🎯' },
      { label: 'Organization', score: parsed.details?.organization || 0, icon: '📋' }
    ];

    const feedbackSections = {
      overallScore: Math.round(parsed.score),
      detailedScores: detailedScores,
      overallFeedback: parsed.feedback || "No feedback provided",
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      grammarErrors: (parsed.grammarErrors || []).slice(0, 5),
      vocabularyIssues: (parsed.vocabularyIssues || []).slice(0, 5),
      recommendations: parsed.recommendations || []
    };

    const finalResult = {
      score: Math.round(parsed.score),
      feedback: JSON.stringify(feedbackSections), // Store as JSON string
      details: parsed.details || null
    };
    
    console.log("\n[5/5] ✅ SUCCESS");
    console.log(`      Final score: ${finalResult.score}/100`);
    console.log(`      Feedback length: ${finalResult.feedback.length} chars`);
    console.log("=".repeat(70) + "\n");
    
    return finalResult;

  } catch (error) {
    console.error("\n❌ ERROR in gradeWriting:");
    console.error(`   Type: ${error.name}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack?.split('\n').slice(0, 3).join('\n   ')}`);
    console.error("=".repeat(70) + "\n");
    
    throw new Error(`AI grading failed: ${error.message}`);
  }
};

/**
 * Grade Speaking with Enhanced Analysis
 */
export const gradeSpeaking = async (questionPrompt, audioFileKey) => {
  const timestamp = new Date().toISOString();
  console.log("\n" + "=".repeat(70));
  console.log(`🎤 GRADING SPEAKING [${timestamp}]`);
  console.log("=".repeat(70));
  console.log(`📁 Audio: ${audioFileKey}`);
  
  if (IS_MOCK) {
    console.log("⚠️  MOCK MODE ACTIVE");
    return { 
      score: 70, 
      feedback: 'Mock speaking: transcript scoring is disabled in mock mode.' 
    };
  }
  
  if (!audioFileKey) {
    throw new Error("No audio file");
  }

  try {
    console.log("\n[1/3] Downloading from S3...");
    const audioBuffer = await downloadFileBuffer(audioFileKey);
    console.log(`      ✓ Downloaded: ${audioBuffer.length} bytes`);

    console.log("\n[2/3] Transcribing audio...");
    const transcript = await transcribeAudio(audioBuffer, audioFileKey);
    console.log(`      ✓ Transcript (${transcript.length} chars): ${transcript.substring(0, 100)}...`);

    // 2b. Chấm điểm “chặt” hơn: mô hình vectơ + giữ thứ tự, phạt từ thừa/thiếu
    const normalize = (text) =>
      (text || '')
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);

    const refWords = normalize(questionPrompt || '');
    const transcriptWords = normalize(transcript || '');
    const rawTranscriptWords = (transcript || '').split(/\s+/).filter(Boolean);
    const totalRef = refWords.length || 1; // tránh chia 0

    // Vector space model: TF vectors + cosine similarity
    const buildTf = (words) => {
      const tf = new Map();
      for (const w of words) tf.set(w, (tf.get(w) || 0) + 1);
      return tf;
    };
    const refTf = buildTf(refWords);
    const transTf = buildTf(transcriptWords);
    const allTerms = new Set([...refTf.keys(), ...transTf.keys()]);
    let dot = 0, refNorm = 0, transNorm = 0;
    for (const term of allTerms) {
      const a = refTf.get(term) || 0;
      const b = transTf.get(term) || 0;
      dot += a * b;
      refNorm += a * a;
      transNorm += b * b;
    }
    const cosineSim = dot === 0 ? 0 : dot / (Math.sqrt(refNorm) * Math.sqrt(transNorm) || 1);

    // Longest Common Subsequence (LCS) để giữ thứ tự từ
    const lcsLength = (() => {
      const m = refWords.length;
      const n = transcriptWords.length;
      const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (refWords[i - 1] === transcriptWords[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }
      return dp[m][n];
    })();

    // Vocab coverage (không xét thứ tự) dùng tập giao/đề mẫu
    const uniqueRef = new Set(refWords);
    const uniqueTranscript = new Set(transcriptWords);
    let vocabMatches = 0;
    for (const w of uniqueTranscript) {
      if (uniqueRef.has(w)) vocabMatches++;
    }
    const vocabCoverage = vocabMatches / Math.max(uniqueRef.size, 1);

    // Phạt từ thừa và thiếu
    const extraWords = Math.max(transcriptWords.length - refWords.length, 0) / totalRef;
    const missingWords = Math.max(refWords.length - lcsLength, 0) / totalRef;

    // Điểm cuối: ưu tiên thứ tự (LCS), kết hợp cosine (mô hình vectơ) + coverage, trừ phạt
    const orderedRatio = lcsLength / totalRef; // [0..1]
    const baseScore = 0.5 * orderedRatio + 0.3 * cosineSim + 0.2 * vocabCoverage;
    const penalty = Math.min(1, 0.5 * extraWords + 0.5 * missingWords);
    const finalRatio = Math.max(0, Math.min(1, baseScore - penalty));
    const finalScore = Math.round(finalRatio * 100);

    // Đánh dấu token theo thứ tự (greedy scan)
    let refIdx = 0;
    const tokenMatches = rawTranscriptWords.map((rawWord) => {
      const normWord = normalize(rawWord)[0];
      if (!normWord) return { word: rawWord, match: false };
      while (refIdx < refWords.length && refWords[refIdx] !== normWord) {
        refIdx++;
      }
      if (refIdx < refWords.length && refWords[refIdx] === normWord) {
        refIdx++;
        return { word: rawWord, match: true };
      }
      return { word: rawWord, match: false };
    });

    console.log(
      `      ✓ Scoring: LCS ${lcsLength}/${totalRef}, vocab ${vocabMatches}/${uniqueRef.size}, penalty extra=${extraWords.toFixed(2)} missing=${missingWords.toFixed(2)} -> score ${finalScore}/100`
    );

    const feedbackParts = [
      `Transcript (AI chuyển từ audio):`,
      `"${transcript}"`,
      ``,
      `Vector scoring (giữ thứ tự + phạt từ thừa/thiếu):`,
      `- Tổng số từ trong đề mẫu: ${totalRef}`,
      `- Độ phủ theo thứ tự (LCS): ${lcsLength}/${totalRef} -> ${(orderedRatio * 100).toFixed(1)}%`,
      `- Cosine similarity (TF vector): ${(cosineSim * 100).toFixed(1)}%`,
      `- Độ phủ từ vựng (không xét thứ tự): ${(vocabCoverage * 100).toFixed(1)}%`,
      `- Phạt từ thừa: ${(extraWords * 100).toFixed(1)}% | Phạt thiếu: ${(missingWords * 100).toFixed(1)}%`,
      `- Điểm cuối (0-100): ${finalScore}`
    ];

    // Gắn thêm JSON tokenMatches để frontend tô màu từng từ
    try {
      const tokensJson = JSON.stringify(tokenMatches);
      feedbackParts.push('');
      feedbackParts.push(`__TOKENS_JSON_START__${tokensJson}__TOKENS_JSON_END__`);
    } catch {
      // Nếu stringify lỗi thì vẫn bỏ qua
    }

    const feedback = feedbackParts.join('\n');

    const finalResult = {
      score: finalScore,
      feedback
    };
    
    console.log("\n[3/3] ✅ SUCCESS");
    console.log(`      Final score (0-100): ${finalResult.score}`);
    console.log("=".repeat(70) + "\n");
    
    return finalResult;

  } catch (error) {
    console.error("\n❌ ERROR in gradeSpeaking:");
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack?.split('\n').slice(0, 3).join('\n   ')}`);
    console.error("=".repeat(70) + "\n");
    
    // Kiểm tra nếu là lỗi AccessDenied từ S3
    if (error.message && error.message.includes('AccessDenied') && error.message.includes('GetObject')) {
      const detailedError = `AI speaking grading failed: IAM user không có quyền tải file từ S3. 
Vui lòng cập nhật IAM policy để thêm quyền s3:GetObject.
Xem file backend/AWS_IAM_FIX.md để biết cách sửa.
Chi tiết: ${error.message}`;
      throw new Error(detailedError);
    }
    
    throw new Error(`AI speaking grading failed: ${error.message}`);
  }
};

/**
 * Translate between Vietnamese and English with suggestions
 * @param {string} text - The text to translate
 * @param {string} fromLanguage - 'vi' for Vietnamese or 'en' for English
 * @param {string} toLanguage - 'vi' for Vietnamese or 'en' for English
 */
export const translateVocabulary = async (text, fromLanguage = 'vi', toLanguage = 'en') => {
  const timestamp = new Date().toISOString();
  console.log("\n" + "=".repeat(70));
  console.log(`🔤 TRANSLATING VOCABULARY [${timestamp}]`);
  console.log("=".repeat(70));
  console.log(`📝 ${fromLanguage === 'vi' ? 'Vietnamese' : 'English'}: ${text}`);
  console.log(`🔄 Direction: ${fromLanguage.toUpperCase()} → ${toLanguage.toUpperCase()}`);
  
  if (IS_MOCK) {
    console.log("⚠️  MOCK MODE ACTIVE");
    if (fromLanguage === 'vi') {
      return {
        original: text,
        originalLanguage: 'vi',
        translated: "I love you",
        translatedLanguage: 'en',
        suggestions: ["I adore you", "I'm in love with you", "You mean the world to me"]
      };
    } else {
      return {
        original: text,
        originalLanguage: 'en',
        translated: "Tôi yêu bạn",
        translatedLanguage: 'vi',
        suggestions: ["Anh yêu em", "Em yêu anh", "Tôi thích bạn"]
      };
    }
  }

  try {
    const model = getModel(EVAL_MODEL_NAME);
    
    const fromLangName = fromLanguage === 'vi' ? 'Vietnamese' : 'English';
    const toLangName = toLanguage === 'vi' ? 'Vietnamese' : 'English';
    
    const systemPrompt = `You are a JSON-only translator. You MUST respond with ONLY valid JSON, no other text.

Translate the ${fromLangName} word or phrase to ${toLangName} and provide alternative suggestions plus a natural example sentence.

CRITICAL: Your response must be ONLY a valid JSON object, nothing else. No explanations, no markdown, no code blocks, no greetings.

Required JSON format:
{
  "translated": "main translation here",
  "suggestions": ["alternative 1", "alternative 2", "alternative 3"],
  "example_sentence": "A natural, meaningful ${toLangName} sentence that MUST contain the translated word/phrase"
}

Rules:
- Return ONLY the JSON object
- No text before or after the JSON
- No markdown code fences
- No explanations or comments
- Start directly with { and end with }
- The example_sentence MUST include the translated word/phrase (the value in "translated" field)
- The example_sentence must be natural, grammatically correct, and make sense
- The example_sentence should demonstrate how to use the translated word/phrase in real context
- Do NOT use the original ${fromLangName} text in the example_sentence, only use the ${toLangName} translation
- The translated word/phrase must appear naturally in the example_sentence`;

    const userPrompt = `Translate this ${fromLangName} text to ${toLangName}: "${text}"

Return ONLY the JSON object with "translated", "suggestions", and "example_sentence" fields.
IMPORTANT: The example_sentence MUST contain the translated word/phrase from the "translated" field.`;

    console.log("\n[1/2] Sending to Gemini API...");
    
    // Retry logic for better reliability
    let parsed;
    let rawText;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const result = await model.generateContent([
          { text: systemPrompt },
          { text: userPrompt }
        ]);

        rawText = result.response?.text();
        console.log("\n[2/2] Processing response...");
        
        if (!rawText) {
          throw new Error('Empty response from Gemini');
        }

        // Clean the response - remove any leading/trailing text
        let cleanedText = rawText.trim();
        
        // Remove markdown code blocks if present
        cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        
        // Find JSON object in the response
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
        
        parsed = JSON.parse(cleanedText);
        console.log(`      ✓ Translation: ${parsed.translated}`);
        break; // Success, exit retry loop
        
      } catch (parseError) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error("❌ Parse Error after", maxAttempts, "attempts:", parseError.message);
          console.error("📄 Raw response (500 chars):", rawText?.substring(0, 500));
          throw new Error(`JSON parse failed after ${maxAttempts} attempts: ${parseError.message}`);
        }
        console.log(`      ⚠️  Parse attempt ${attempts} failed, retrying...`);
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Validate response
    if (!parsed || !parsed.translated) {
      throw new Error(`Missing ${toLangName} translation in response`);
    }

    return {
      original: text,
      originalLanguage: fromLanguage,
      translated: parsed.translated,
      translatedLanguage: toLanguage,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      example_sentence: parsed.example_sentence || null
    };

  } catch (error) {
    console.error("❌ Translation Error:", error.message);
    throw new Error(`Translation failed: ${error.message}`);
  }
};

/**
 * Extract Questions (unchanged)
 */
export async function extractQuestionsWithGemini(params) {
  const { text, defaultTopicTitle } = params;
  if (!text || !text.trim()) return [];

  const model = getModel(EVAL_MODEL_NAME);

  const prompt = `Extract questions. Return ONLY JSON array:
[{"prompt":"text","type":"mcq"|"text","topic":"name","answer":"text","choices":[{"text":"opt","is_correct":true}],"max_score":1}]

Topic: ${defaultTopicTitle || 'General'}
Content: ${text}`;

  const result = await model.generateContent(prompt);
  const raw = result.response?.text();
  
  if (!raw) throw new Error('No response');
  const parsed = extractJsonObject(raw);
  if (!Array.isArray(parsed)) throw new Error('Must return array');
  
  return parsed;
}