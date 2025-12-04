// Các types liên quan đến Từ vựng

// Kiểu tóm tắt cho một bộ từ vựng (từ API /api/vocabulary/sets)
export interface VocabularySet {
  id: number;
  title: string;
  description: string | null;
  word_count?: number; 
  updated_at?: string;
  category_id?: number | null;
}

// Kiểu chi tiết cho một từ vựng (từ API /api/vocabulary/sets/:id/words)
export interface VocabularyWord {
  id: number;
  word: string;
  part_of_speech: string | null;
  definition: string;
  example_sentence: string | null;
  audio_url: string | null;
}

// Kiểu tóm tắt bộ từ vựng cho danh sách Admin
export interface AdminVocabularySetSummary {
  id: number;
  title: string;
  updated_at: string;
  category_name: string | null; // Category có thể là null
  word_count: number;
}