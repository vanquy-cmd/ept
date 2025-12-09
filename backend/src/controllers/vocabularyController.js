import {
  getAllVocabularySets,
  getWordsBySetId,
  getVocabularySetDetails,
  createSetWithWords,
  updateSetWithWords,
  deleteSet,
  saveTranslationHistory,
  getTranslationHistory
} from '../models/vocabularyModel.js';
import { translateVocabulary } from '../utils/ai.js';
import { uploadBufferToS3 } from '../utils/s3.js';

// Tải audio từ Google Translate TTS (unofficial) và upload lên S3
const fetchGoogleTtsAudio = async (word, language = 'en') => {
  const normalizedWord = word.trim().toLowerCase();
  const lang = (language || 'en').toLowerCase();
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(normalizedWord)}`;

  const ttsResponse = await fetch(ttsUrl, {
    headers: {
      // Một số endpoint yêu cầu User-Agent hợp lệ
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!ttsResponse.ok) {
    throw new Error(`Google TTS không phản hồi (${ttsResponse.status})`);
  }

  const buffer = Buffer.from(await ttsResponse.arrayBuffer());
  const contentType = ttsResponse.headers.get('content-type') || 'audio/mpeg';
  const key = `vocabulary/${normalizedWord}-tts-${Date.now()}.mp3`;

  const { key: s3Key, publicUrl } = await uploadBufferToS3(buffer, key, contentType);
  return { audioUrl: publicUrl, source: 'google-tts', originUrl: ttsUrl, s3Key };
};

// Lấy audio từ Free Dictionary; nếu thất bại sẽ fallback sang Google TTS
const fetchAndUploadDictionaryAudio = async (word, language = 'en') => {
  const normalizedWord = word.trim().toLowerCase();
  const lang = (language || 'en').toLowerCase();
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(normalizedWord)}`;

  try {
    const dictResponse = await fetch(apiUrl);
    if (!dictResponse.ok) {
      throw new Error(`Không tìm thấy hoặc không lấy được từ ${normalizedWord} (${dictResponse.status})`);
    }

    const dictData = await dictResponse.json();
    const audioUrl =
      dictData?.[0]?.phonetics?.find((p) => p.audio)?.audio ||
      dictData?.[0]?.phonetics?.find((p) => p.audio && p.audio.trim())?.audio;

    if (!audioUrl) {
      throw new Error(`Không có audio cho từ ${normalizedWord}`);
    }

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Không tải được audio nguồn cho từ ${normalizedWord}`);
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
    const extensionFromUrl = audioUrl.split('.').pop()?.split('?')[0] || 'mp3';
    const key = `vocabulary/${normalizedWord}-${Date.now()}.${extensionFromUrl}`;

    const { key: s3Key, publicUrl } = await uploadBufferToS3(buffer, key, contentType);
    return { audioUrl: publicUrl, source: 'dictionary', originUrl: audioUrl, s3Key };
  } catch (error) {
    console.warn(`Dictionary audio thất bại, fallback Google TTS cho "${normalizedWord}":`, error.message);
    // Fallback sang Google TTS
    return await fetchGoogleTtsAudio(normalizedWord, lang);
  }
};

// Bổ sung audio_url cho những từ chưa có
const fillMissingAudioUrls = async (words, language = 'en') => {
  const result = [];
  for (const w of words) {
    if (w.audio_url) {
      result.push(w);
      continue;
    }
    try {
      const { audioUrl } = await fetchAndUploadDictionaryAudio(w.word, language);
      result.push({ ...w, audio_url: audioUrl });
    } catch (error) {
      console.error(`Không thể tự lấy audio cho từ "${w.word}":`, error.message);
      result.push({ ...w, audio_url: w.audio_url || null });
    }
  }
  return result;
};

/**
 * Controller để lấy tất cả các bộ từ vựng
 */
export const handleGetAllVocabularySets = async (req, res) => {
  try {
    const sets = await getAllVocabularySets();
    res.status(200).json(sets);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy bộ từ vựng.' });
  }
};

/**
 * Controller để lấy các từ trong một bộ
 */
export const handleGetWordsBySetId = async (req, res) => {
  try {
    const { id } = req.params; // Lấy set_id từ URL
    const words = await getWordsBySetId(id);

    // Lấy thông tin chi tiết của bộ từ vựng (nếu cần, nhưng hiện tại chỉ cần trả về từ)
    // Nếu muốn trả về cả thông tin set + danh sách từ, chúng ta có thể điều chỉnh
    
    res.status(200).json(words);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách từ vựng.' });
  }
};

// --- CÁC HÀM CỦA ADMIN ---

/**
 * [ADMIN] Lấy chi tiết một bộ từ vựng (cho trang Edit)
 */
export const handleGetSetDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const setDetails = await getVocabularySetDetails(id);
    if (!setDetails) {
      return res.status(404).json({ message: 'Không tìm thấy bộ từ vựng.' });
    }
    res.status(200).json(setDetails);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết bộ từ vựng.' });
  }
};

/**
 * [ADMIN] Tạo bộ từ vựng mới
 */
export const handleCreateSet = async (req, res) => {
  try {
    const { title, description, category_id, words } = req.body;

    // 1. Validation
    if (!title || !Array.isArray(words)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp title và mảng words.' });
    }

    // 2. Tách dữ liệu
    const setData = {
      title,
      description: description || null,
      category_id: category_id || null
    };

    const wordsWithAudio = await fillMissingAudioUrls(words);

    const newSetId = await createSetWithWords(setData, wordsWithAudio);
    
    res.status(201).json({ 
      message: 'Tạo bộ từ vựng thành công.', 
      setId: newSetId 
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo bộ từ vựng.' });
  }
};

/**
 * [ADMIN] Cập nhật bộ từ vựng
 */
export const handleUpdateSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, words } = req.body;

    // 1. Validation
    if (!title || !Array.isArray(words)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp title và mảng words.' });
    }

    // 2. Tách dữ liệu
    const setData = {
      title,
      description: description || null,
      category_id: category_id || null
    };

    // 3. Kiểm tra
    const existingSet = await getVocabularySetDetails(id);
    if (!existingSet) {
      return res.status(404).json({ message: 'Không tìm thấy bộ từ vựng để cập nhật.' });
    }

    const wordsWithAudio = await fillMissingAudioUrls(words);

    await updateSetWithWords(id, setData, wordsWithAudio);
    
    res.status(200).json({ message: 'Cập nhật bộ từ vựng thành công.' });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật bộ từ vựng.' });
  }
};

/**
 * [ADMIN] Xóa bộ từ vựng
 */
export const handleDeleteSet = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await deleteSet(id);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bộ từ vựng để xóa.' });
    }

    res.status(200).json({ message: 'Xóa bộ từ vựng thành công.' });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa bộ từ vựng.' });
  }
};

/**
 * Translate between Vietnamese and English
 */
export const handleTranslateVocabulary = async (req, res) => {
  try {
    const { text, fromLanguage = 'vi', toLanguage = 'en' } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Vui lòng cung cấp từ hoặc cụm từ cần dịch.' });
    }

    if (text.length > 50) {
      return res.status(400).json({ message: 'Vượt quá giới hạn 50 ký tự.' });
    }

    // Validate language codes
    const validLanguages = ['vi', 'en'];
    if (!validLanguages.includes(fromLanguage) || !validLanguages.includes(toLanguage)) {
      return res.status(400).json({ message: 'Ngôn ngữ không hợp lệ. Chỉ hỗ trợ "vi" (Tiếng Việt) và "en" (Tiếng Anh).' });
    }

    if (fromLanguage === toLanguage) {
      return res.status(400).json({ message: 'Ngôn ngữ nguồn và đích phải khác nhau.' });
    }

    const result = await translateVocabulary(text.trim(), fromLanguage, toLanguage);
    
    // Lưu lịch sử tra từ điển
    try {
      await saveTranslationHistory(userId, result);
    } catch (historyError) {
      console.error('Lỗi khi lưu lịch sử tra từ điển:', historyError);
      // Không throw error, chỉ log để không ảnh hưởng đến kết quả dịch
    }
    
    res.status(200).json(result);

  } catch (error) {
    console.error('Lỗi khi dịch từ vựng:', error);
    res.status(500).json({ 
      message: error.message || 'Hệ thống hiện đang quá tải. Vui lòng thử lại sau.' 
    });
  }
};

/**
 * Lấy lịch sử tra từ điển của user
 */
export const handleGetTranslationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const history = await getTranslationHistory(userId, limit);
    res.status(200).json(history);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử tra từ điển:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy lịch sử tra từ điển.' });
  }
};

/**
 * Lấy audio từ Free Dictionary API và lưu lên S3
 * Body: { word: string, language?: string }
 */
export const handleFetchDictionaryAudio = async (req, res) => {
  try {
    const { word, language = 'en' } = req.body;

    if (!word || !word.trim()) {
      return res.status(400).json({ message: 'Vui lòng cung cấp từ vựng cần lấy audio.' });
    }

    const normalizedWord = word.trim().toLowerCase();
    const { audioUrl, source, originUrl, s3Key } = await fetchAndUploadDictionaryAudio(normalizedWord, language);

    res.status(200).json({
      message: 'Tải và lưu audio thành công.',
      word: normalizedWord,
      source,
      sourceUrl: originUrl,
      s3Key,
      audioUrl,
    });
  } catch (error) {
    console.error('Lỗi khi xử lý audio từ điển:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy audio từ điển.' });
  }
};