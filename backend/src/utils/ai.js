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
      maxOutputTokens: 8192, // Increased to prevent response truncation
    }
  });
}

// --- JSON Parser (Improved) ---
function extractJsonObject(raw) {
  try {
    let trimmed = raw.trim();
    
    // Remove markdown fence if present
    if (trimmed.startsWith('```')) {
      // Remove opening fence
      trimmed = trimmed.replace(/^```(?:json)?\s*/i, '');
      // Remove closing fence
      trimmed = trimmed.replace(/\s*```\s*$/i, '');
      trimmed = trimmed.trim();
    }
    
    // Try to find JSON object
    let jsonStr = trimmed;
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    // Fix common JSON errors
    // Fix trailing commas in arrays/objects
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    
    // Try to fix incomplete JSON (if response was cut off)
    // Count braces and brackets to see if JSON is incomplete
    let openBraces = (jsonStr.match(/\{/g) || []).length;
    let closeBraces = (jsonStr.match(/\}/g) || []).length;
    let openBrackets = (jsonStr.match(/\[/g) || []).length;
    let closeBrackets = (jsonStr.match(/\]/g) || []).length;
    
    // If JSON seems incomplete, try to close it
    if (openBraces > closeBraces || openBrackets > closeBrackets) {
      // Close incomplete arrays first
      while (openBrackets > closeBrackets) {
        jsonStr += ']';
        closeBrackets++;
      }
      
      // Close incomplete objects
      while (openBraces > closeBraces) {
        jsonStr += '}';
        closeBraces++;
      }
      
      // Remove trailing comma before closing
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    }
    
    // Try parsing
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      // If still fails, try to extract balanced JSON
      let braceCount = 0;
      let bracketCount = 0;
      let startIdx = -1;
      let endIdx = -1;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (inString) continue;
        
        if (char === '{') {
          if (startIdx === -1) startIdx = i;
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && startIdx !== -1) {
            endIdx = i;
            break;
          }
        } else if (char === '[') {
          bracketCount++;
        } else if (char === ']') {
          bracketCount--;
        }
      }
      
      if (startIdx !== -1 && endIdx !== -1) {
        const balancedJson = jsonStr.substring(startIdx, endIdx + 1);
        // Fix trailing commas again
        const fixedJson = balancedJson.replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(fixedJson);
      }
      
      throw parseError;
    }
  } catch (error) {
    console.error("❌ Parse Error:", error.message);
    console.error("📄 Raw response length:", raw.length);
    console.error("📄 Raw (first 1000 chars):", raw.substring(0, 1000));
    console.error("📄 Raw (last 500 chars):", raw.substring(Math.max(0, raw.length - 500)));
    
    // Try to find the problematic position
    if (error.message.includes('position')) {
      const posMatch = error.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const start = Math.max(0, pos - 100);
        const end = Math.min(raw.length, pos + 100);
        console.error(`📄 Around error position ${pos}:`, raw.substring(start, end));
      }
    }
    
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
    
    const systemPrompt = `Bạn là một giám khảo rất nghiêm khắc về viết tiếng Anh với bằng Thạc sĩ Ngôn ngữ tiếng anh. Bạn phải đánh giá khách quan, không khoan nhượng, và phát hiện mọi lỗi dù nhỏ nhất.

Đánh giá bài viết này sử dụng rubric toàn diện (thang điểm 0-100 cho mỗi tiêu chí) với tiêu chuẩn cao. Bạn phải:
- Phát hiện và trừ điểm cho tất cả các lỗi ngữ pháp, dù nhỏ
- Đánh giá từ vựng một cách khắt khe, không chấp nhận từ không chính xác hoặc không phù hợp
- Yêu cầu mạch lạc và liên kết rõ ràng, trừ điểm cho mọi sự thiếu logic
- Đánh giá nghiêm ngặt việc hoàn thành nhiệm vụ, không khoan nhượng cho phần thiếu sót
- Yêu cầu tổ chức chặt chẽ, trừ điểm cho cấu trúc lỏng lẻo

Không được quá khoan dung. Điểm số phải phản ánh dúng chất lượng thực tế của bài viết.

Quan trọng: Bạn phải trả về chỉ json hợp lệ, không có văn bản nào khác. Json phải:
- Không có dấu phẩy thừa (trailing commas)
- Tất cả các mảng và object phải được đóng đúng cách
- Tất cả các chuỗi phải được đặt trong dấu ngoặc kép
- Không có markdown code fences, không có giải thích

Chỉ trả về cấu trúc json này:
{
  "score": 75,
  "feedback": "Phản hồi tổng quan 3-4 câu toàn diện, chỉ ra rõ ràng các điểm yếu",
  "details": {
    "grammar": 70,
    "vocabulary": 80,
    "coherence": 75,
    "task_achievement": 78,
    "organization": 72
  },
  "strengths": ["điểm mạnh cụ thể 1", "điểm mạnh cụ thể 2", "điểm mạnh cụ thể 3"],
  "improvements": ["vấn đề cụ thể 1 kèm ví dụ", "vấn đề cụ thể 2 kèm ví dụ"],
  "grammarErrors": [
    {"error": "cụm từ chính xác từ bài viết", "correction": "cụm từ đã sửa", "explanation": "lý do"}
  ],
  "vocabularyIssues": [
    {"word": "từ có vấn đề", "suggestion": "lựa chọn tốt hơn", "reason": "lý do"}
  ],
  "recommendations": ["lời khuyên hành động 1", "lời khuyên hành động 2", "lời khuyên hành động 3"]
}

Rubric Chi Tiết (mỗi tiêu chí 0-100):

NGỮ PHÁP (GRAMMAR) (0-100):
- 90-100: Gần như hoàn hảo, sử dụng đúng các cấu trúc phức tạp
- 80-89: Rất tốt, có lỗi nhỏ không ảnh hưởng đến giao tiếp
- 70-79: Kiểm soát tốt, có một số lỗi trong cấu trúc phức tạp
- 60-69: Đạt yêu cầu, có lỗi đáng chú ý nhưng ý nghĩa vẫn rõ ràng
- 50-59: Kiểm soát hạn chế, lỗi thường xuyên ảnh hưởng đến sự rõ ràng
- Dưới 50: Kiểm soát kém, lỗi lan tỏa

TỪ VỰNG (VOCABULARY) (0-100):
- 90-100: Tinh tế, lựa chọn từ chính xác, đa dạng cách diễn đạt
- 80-89: Phạm vi rất tốt, sử dụng từ vựng nâng cao phù hợp
- 70-79: Phạm vi tốt, có một số từ vựng nâng cao với sai sót nhỏ
- 60-69: Phạm vi đạt yêu cầu, dựa vào từ thông dụng, có lặp lại
- 50-59: Phạm vi hạn chế, lặp lại thường xuyên, lỗi lựa chọn từ
- Dưới 50: Từ vựng rất hạn chế

MẠCH LẠC VÀ LIÊN KẾT (COHERENCE & COHESION) (0-100):
- 90-100: Luồng xuất sắc, sử dụng hoàn hảo các phương tiện liên kết
- 80-89: Luồng logic rất tốt, liên kết phù hợp
- 70-79: Tổ chức tốt, liên kết đầy đủ với vấn đề nhỏ
- 60-69: Tổ chức đạt yêu cầu, một số chuyển tiếp vụng về
- 50-59: Mạch lạc hạn chế, tiến trình không rõ ràng
- Dưới 50: Thiếu tổ chức rõ ràng

HOÀN THÀNH NHIỆM VỤ (TASK ACHIEVEMENT) (0-100) - QUAN TRỌNG: Đánh giá nghiêm ngặt về việc bài viết có phù hợp với đề bài:
- 90-100: Hoàn toàn phù hợp với đề bài, trả lời đầy đủ tất cả yêu cầu, ý tưởng phát triển cao
- 80-89: Phù hợp tốt với đề bài, trả lời đầy đủ các yêu cầu, quan điểm rõ ràng xuyên suốt
- 70-79: Phù hợp với đề bài, trả lời được nhiệm vụ nhưng một số phần phát triển hơn phần khác
- 60-69: Có phù hợp nhưng chưa đầy đủ, trả lời được nhiệm vụ nhưng phát triển hạn chế
- 50-59: Phù hợp tối thiểu, chỉ trả lời được một phần nhỏ của đề bài, thiếu phát triển
- Dưới 50: Không phù hợp với đề bài, lạc đề hoặc không trả lời được yêu cầu của đề

LƯU Ý ĐẶC BIỆT: Bạn phải kiểm tra kỹ:
- Bài viết có trả lời đúng câu hỏi/đề bài không?
- Nội dung có liên quan trực tiếp đến đề bài không?
- Có bị lạc đề hay viết về chủ đề khác không?
- Có đáp ứng đầy đủ các yêu cầu trong đề bài không?
Nếu bài viết lạc đề hoặc không phù hợp, điểm Task Achievement phải thấp (dưới 50).

TỔ CHỨC (ORGANIZATION) (0-100):
- 90-100: Cấu trúc hoàn hảo, phân đoạn rõ ràng
- 80-89: Tổ chức rất tốt với cấu trúc rõ ràng
- 70-79: Tổ chức tốt, phân đoạn logic
- 60-69: Cấu trúc đạt yêu cầu, một số vấn đề tổ chức
- 50-59: Tổ chức hạn chế, cấu trúc không rõ ràng
- Dưới 50: Tổ chức kém

[Rubric chi tiết cho 5 tiêu chí: Grammar, Vocabulary, Coherence, Task Achievement, Organization]

Điểm cuối cùng = trung bình của tất cả các tiêu chí. Phải đảm bảo điểm số phản ánh đúng chất lượng, không được quá khoan dung.

NHỚ: Trả về chỉ json hợp lệ, không có văn bản nào khác, không có markdown, không có giải thích.`;

    const userPrompt = `CÂU HỎI/ĐỀ BÀI:
${questionPrompt}

BÀI VIẾT CỦA HỌC SINH:
${userEssay}

Số từ: ${userEssay.split(/\s+/).length} từ

Đánh giá kỹ lưỡng sử dụng rubric ở trên. 

QUAN TRỌNG ĐẶC BIỆT VỀ TASK ACHIEVEMENT:
1. Đọc kỹ đề bài và xác định yêu cầu chính
2. Kiểm tra xem bài viết có trả lời ĐÚNG câu hỏi/đề bài không
3. Đánh giá xem nội dung có PHÙ HỢP và LIÊN QUAN trực tiếp đến đề bài không
4. Nếu bài viết lạc đề, viết về chủ đề khác, hoặc không trả lời được yêu cầu → điểm Task Achievement PHẢI thấp (dưới 50)
5. Nếu bài viết phù hợp nhưng chưa đầy đủ → điểm từ 50-69
6. Nếu bài viết phù hợp và đầy đủ → điểm từ 70-100

Trong phần "improvements", nếu bài viết không phù hợp với đề, bạn PHẢI chỉ ra rõ ràng:
- "Bài viết không phù hợp với đề bài: [giải thích cụ thể]"
- "Nội dung lạc đề: [chỉ ra phần nào lạc đề]"
- "Thiếu trả lời yêu cầu: [liệt kê yêu cầu nào chưa được đáp ứng]"

QUAN TRỌNG: CHỈ trả về JSON hợp lệ, không có văn bản nào khác. Đảm bảo:
- Không có dấu phẩy thừa
- Tất cả mảng và object được đóng đúng cách
- JSON có thể parse được ngay lập tức`;
    
    console.log("\n[2/5] Sending to Gemini API...");
    console.log(`      Prompt: ${systemPrompt.length + userPrompt.length} chars`);
    
    // Retry logic for JSON parsing
    let parsed = null;
    let rawText = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`\n      ⚠️  Retry attempt ${attempt}/${maxRetries}...`);
          // Add stricter instruction for retry
          const retryPrompt = userPrompt + "\n\nCRITICAL: Your previous response had invalid JSON. Please return ONLY valid JSON with proper syntax. Ensure all arrays and objects are properly closed, all strings are properly quoted, and there are no trailing commas.";
          const retryResult = await model.generateContent([
            { text: systemPrompt },
            { text: retryPrompt }
          ]);
          rawText = retryResult.response?.text();
        } else {
          const result = await model.generateContent([
            { text: systemPrompt },
            { text: userPrompt }
          ]);
          rawText = result.response?.text();
        }
        
        console.log("      ✓ Response received");

        console.log("\n[3/5] Processing response...");
        console.log(`      Length: ${rawText?.length || 0} chars`);
        console.log(`      Preview: ${rawText?.substring(0, 150).replace(/\n/g, ' ')}...`);

        if (!rawText) {
          throw new Error('Empty response from Gemini');
        }

        console.log("\n[4/5] Parsing JSON...");
        parsed = extractJsonObject(rawText);
        console.log("      ✓ JSON parsed successfully");
        console.log(`      Score: ${parsed.score}`);
        break; // Success, exit retry loop
        
      } catch (parseError) {
        if (attempt === maxRetries) {
          // Last attempt failed, throw error
          console.error(`\n      ❌ All ${maxRetries + 1} attempts failed`);
          throw parseError;
        }
        console.error(`\n      ⚠️  Parse failed on attempt ${attempt + 1}, will retry...`);
        console.error(`      Error: ${parseError.message}`);
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
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