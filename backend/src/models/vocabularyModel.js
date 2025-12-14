import pool from '../config/db.js';

/**
 * Lấy tất cả các bộ từ vựng (vocabulary_sets)
 * Chúng ta cũng đếm số lượng từ (word_count) trong mỗi bộ
 */
export const getAllVocabularySets = async () => {
  try {
    const query = `
      SELECT 
        vs.id, 
        vs.title, 
        vs.description, 
        COUNT(vw.id) AS word_count
      FROM 
        vocabulary_sets vs
      LEFT JOIN 
        vocabulary_words vw ON vs.id = vw.set_id
      GROUP BY 
        vs.id
      ORDER BY 
        vs.title ASC;
    `;
    const [rows] = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('Lỗi khi lấy các bộ từ vựng model:', error);
    throw error;
  }
};

/**
 * Lấy tất cả các từ (words) thuộc về một bộ (set_id)
 */
export const getWordsBySetId = async (setId) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, word, part_of_speech, definition, example_sentence, audio_url FROM vocabulary_words WHERE set_id = ? ORDER BY word ASC',
      [setId]
    );
    return rows;
  } catch (error) {
    console.error('Lỗi khi lấy từ vựng theo set ID model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Lấy chi tiết một bộ từ vựng (bao gồm các từ)
 * Tương thích MySQL 5.7
 */
export const getVocabularySetDetails = async (setId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('SET SESSION group_concat_max_len = 100000;');

    const query = `
      SELECT
          vs.*,
          (
            SELECT CONCAT('[', 
                IFNULL(GROUP_CONCAT(
                    JSON_OBJECT(
                        'id', vw.id,
                        'word', vw.word,
                        'part_of_speech', vw.part_of_speech,
                        'definition', vw.definition,
                        'example_sentence', vw.example_sentence,
                        'audio_url', vw.audio_url
                    )
                    ORDER BY vw.word ASC
                ), '')
            , ']')
            FROM vocabulary_words vw
            WHERE vw.set_id = vs.id
          ) AS words
      FROM
          vocabulary_sets vs
      WHERE
          vs.id = ?;
    `;
    const [rows] = await connection.query(query, [setId]);
    connection.release();

    if (!rows[0]) return undefined;

    // Parse chuỗi JSON
    if (rows[0] && rows[0].words) {
      rows[0].words = JSON.parse(rows[0].words);
    } else {
      rows[0].words = [];
    }
    return rows[0];

  } catch (error) {
    if (connection) connection.release();
    console.error('Lỗi khi lấy chi tiết bộ từ vựng model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Tạo bộ từ vựng mới (Transaction)
 * @param {object} setData - Dữ liệu cho 'vocabulary_sets'
 * @param {array} wordsData - Mảng các đối tượng từ vựng
 */
export const createSetWithWords = async (setData, wordsData) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Chèn vào 'vocabulary_sets'
    const [setResult] = await connection.query(
      'INSERT INTO vocabulary_sets SET ?',
      [setData]
    );
    const newSetId = setResult.insertId;

    // 2. Nếu có từ vựng, chèn vào 'vocabulary_words'
    if (wordsData && wordsData.length > 0) {
      const wordsValues = wordsData.map(word => [
        newSetId,
        word.word,
        word.part_of_speech,
        word.definition,
        word.example_sentence,
        word.audio_url || null
      ]);
      await connection.query(
        'INSERT INTO vocabulary_words (set_id, word, part_of_speech, definition, example_sentence, audio_url) VALUES ?',
        [wordsValues]
      );
    }
    
    // 3. Commit
    await connection.commit();
    connection.release();
    return newSetId;

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Lỗi khi tạo bộ từ vựng model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Cập nhật bộ từ vựng (Transaction)
 */
export const updateSetWithWords = async (setId, setData, wordsData) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Cập nhật 'vocabulary_sets'
    await connection.query(
      'UPDATE vocabulary_sets SET ? WHERE id = ?',
      [setData, setId]
    );

    // 2. Xóa tất cả các từ cũ
    await connection.query(
      'DELETE FROM vocabulary_words WHERE set_id = ?',
      [setId]
    );

    // 3. Chèn lại các từ mới
    if (wordsData && wordsData.length > 0) {
      const wordsValues = wordsData.map(word => [
        setId,
        word.word,
        word.part_of_speech,
        word.definition,
        word.example_sentence,
        word.audio_url || null
      ]);
      await connection.query(
        'INSERT INTO vocabulary_words (set_id, word, part_of_speech, definition, example_sentence, audio_url) VALUES ?',
        [wordsValues]
      );
    }
    
    // 4. Commit
    await connection.commit();
    connection.release();

  } catch (error)
 {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Lỗi khi cập nhật bộ từ vựng model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Xóa một bộ từ vựng
 * (Bảng 'vocabulary_words' sẽ tự xóa nhờ 'ON DELETE CASCADE')
 */
export const deleteSet = async (setId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM vocabulary_sets WHERE id = ?',
      [setId]
    );
    return result.affectedRows; // 1 nếu thành công
  } catch (error) {
    console.error('Lỗi khi xóa bộ từ vựng model:', error);
    throw error;
  }
};

/**
 * Lưu lịch sử tra từ điển
 */
export const saveTranslationHistory = async (userId, translationData) => {
  try {
    const { original, originalLanguage, translated, translatedLanguage, suggestions, example_sentence } = translationData;
    
    const query = `
      INSERT INTO vocabulary_translation_history 
      (user_id, original_text, original_language, translated_text, translated_language, suggestions, example_sentence, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const suggestionsJson = JSON.stringify(suggestions || []);
    
    const [result] = await pool.query(query, [
      userId,
      original,
      originalLanguage,
      translated,
      translatedLanguage,
      suggestionsJson,
      example_sentence || null
    ]);
    
    return result.insertId;
  } catch (error) {
    console.error('Lỗi khi lưu lịch sử tra từ điển:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử tra từ điển của user
 */
export const getTranslationHistory = async (userId, limit = 50) => {
  try {
    const query = `
      SELECT 
        id,
        original_text,
        original_language,
        translated_text,
        translated_language,
        suggestions,
        example_sentence,
        created_at
      FROM vocabulary_translation_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    const [rows] = await pool.query(query, [userId, limit]);
    
    // Parse JSON suggestions
    return rows.map(row => ({
      ...row,
      suggestions: row.suggestions ? JSON.parse(row.suggestions) : []
    }));
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử tra từ điển:', error);
    throw error;
  }
};

/**
 * Xóa lịch sử tra từ điển của user
 */
export const deleteTranslationHistory = async (userId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM vocabulary_translation_history WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Lỗi khi xóa lịch sử tra từ điển:', error);
    throw error;
  }
};