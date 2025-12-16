# ĐỀ XUẤT CÁC MODEL GEMINI CHO DỰ ÁN EPT LEARNING PLATFORM

## 📋 Tổng quan dự án

Dự án EPT Learning Platform sử dụng Google Gemini AI cho các chức năng:
- ✅ **Chấm điểm Writing** (5 tiêu chí: Grammar, Vocabulary, Coherence, Task Achievement, Organization)
- ✅ **Chấm điểm Speaking** (STT + Vector Similarity + LCS Algorithm)
- ✅ **Transcribe Audio** (Speech-to-Text cho tiếng Anh)
- ✅ **Translate Vocabulary** (Dịch từ vựng Việt ↔ Anh)
- ✅ **Extract Questions** (Trích xuất câu hỏi từ văn bản)

**Model hiện tại:** `gemini-2.0-flash-exp` (experimental)

---

## 🎯 CÁC MODEL GEMINI ĐỀ XUẤT

### 1. **Gemini 2.5 Pro** ⭐⭐⭐⭐⭐ (Khuyến nghị cho chấm điểm)

**Model Code:** `gemini-2.5-pro`

**Đặc điểm:**
- ✅ **Token Limits:** Input: 1,048,576 tokens | Output: 65,536 tokens
- ✅ **Hỗ trợ:** Audio, Images, Video, Text, PDF
- ✅ **Structured JSON Output:** Có (quan trọng cho chấm điểm)
- ✅ **Audio Transcription:** Hỗ trợ tốt
- ✅ **Reasoning:** Mạnh nhất trong dòng 2.5

**Phù hợp cho:**
- 🎯 **Chấm điểm Writing** (EVAL_MODEL) - Cần reasoning tốt để đánh giá 5 tiêu chí
- 🎯 **Chấm điểm Speaking** (EVAL_MODEL) - Cần phân tích transcript phức tạp
- 🎯 **Translate Vocabulary** - Cần hiểu ngữ cảnh tốt

**Lý do:**
- Reasoning tốt nhất → Đánh giá chính xác hơn
- JSON output ổn định → Giảm lỗi parse
- Xử lý prompt dài tốt → Phù hợp với rubric chi tiết

**Nhược điểm:**
- ⚠️ Chi phí cao hơn Flash
- ⚠️ Tốc độ chậm hơn Flash

**Cấu hình đề xuất:**
```env
GEMINI_EVAL_MODEL=gemini-2.5-pro
```

---

### 2. **Gemini 2.5 Flash** ⭐⭐⭐⭐ (Cân bằng tốt)

**Model Code:** `gemini-2.5-flash`

**Đặc điểm:**
- ✅ **Token Limits:** Input: 1,048,576 tokens | Output: 65,536 tokens
- ✅ **Hỗ trợ:** Text, Images, Video, Audio
- ✅ **Structured JSON Output:** Có
- ✅ **Audio Transcription:** Hỗ trợ tốt
- ✅ **Tốc độ:** Nhanh hơn Pro
- ✅ **Chi phí:** Rẻ hơn Pro

**Phù hợp cho:**
- 🎯 **Transcribe Audio** (TRANSCRIBE_MODEL) - Cần tốc độ + độ chính xác
- 🎯 **Chấm điểm Writing** (EVAL_MODEL) - Nếu cần cân bằng tốc độ/chất lượng
- 🎯 **Extract Questions** - Xử lý nhanh

**Lý do:**
- Cân bằng tốt giữa chất lượng và tốc độ
- Chi phí hợp lý cho production
- JSON output ổn định

**Cấu hình đề xuất:**
```env
GEMINI_TRANSCRIBE_MODEL=gemini-2.5-flash
GEMINI_EVAL_MODEL=gemini-2.5-flash  # Nếu muốn tiết kiệm chi phí
```

---

### 3. **Gemini 2.5 Flash-Lite** ⭐⭐⭐ (Tiết kiệm chi phí)

**Model Code:** `gemini-2.5-flash-lite`

**Đặc điểm:**
- ✅ **Token Limits:** Input: 1,048,576 tokens | Output: 65,536 tokens
- ✅ **Hỗ trợ:** Text, Image, Video, Audio, PDF
- ✅ **Structured JSON Output:** Có
- ✅ **Tốc độ:** Nhanh nhất
- ✅ **Chi phí:** Rẻ nhất ($0.10/1M input, $0.40/1M output)

**Phù hợp cho:**
- 🎯 **Transcribe Audio** (TRANSCRIBE_MODEL) - Nếu cần xử lý volume lớn
- 🎯 **Extract Questions** - Tác vụ đơn giản, cần tốc độ
- 🎯 **Translate Vocabulary** - Tác vụ đơn giản

**Lý do:**
- Chi phí thấp nhất → Phù hợp cho scale lớn
- Tốc độ cao → Phù hợp cho real-time transcription
- Vẫn hỗ trợ JSON output

**Nhược điểm:**
- ⚠️ Reasoning yếu hơn Pro/Flash → Không nên dùng cho chấm điểm

**Cấu hình đề xuất:**
```env
GEMINI_TRANSCRIBE_MODEL=gemini-2.5-flash-lite
```

---

### 4. **Gemini 2.0 Flash** ⭐⭐⭐ (Model hiện tại)

**Model Code:** `gemini-2.0-flash` hoặc `gemini-2.0-flash-exp`

**Đặc điểm:**
- ✅ Đã được test và hoạt động ổn định
- ✅ MAE Writing: 4.2 điểm | Speaking: 5.3 điểm
- ✅ WER Transcription: 8.5%
- ⚠️ Đã có phiên bản 2.5 mới hơn

**Phù hợp cho:**
- 🎯 Tiếp tục sử dụng nếu đã ổn định
- 🎯 Nâng cấp lên 2.5 để có hiệu năng tốt hơn

---

## 📊 BẢNG SO SÁNH

| Model | Reasoning | Tốc độ | Chi phí | JSON Output | Audio | Khuyến nghị |
|-------|-----------|--------|---------|-------------|-------|-------------|
| **2.5 Pro** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ✅ | ✅ | Chấm điểm |
| **2.5 Flash** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | ✅ | Cân bằng |
| **2.5 Flash-Lite** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ | Transcription |
| **2.0 Flash** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | ✅ | Hiện tại |

---

## 🎯 KHUYẾN NGHỊ CẤU HÌNH

### **Option 1: Tối ưu chất lượng** (Khuyến nghị)

```env
# Chấm điểm: Dùng Pro cho độ chính xác cao
GEMINI_EVAL_MODEL=gemini-2.5-pro

# Transcription: Dùng Flash cho tốc độ + chất lượng
GEMINI_TRANSCRIBE_MODEL=gemini-2.5-flash
```

**Lý do:**
- Chấm điểm cần reasoning tốt → Dùng Pro
- Transcription cần tốc độ → Dùng Flash
- Cân bằng tốt giữa chất lượng và chi phí

---

### **Option 2: Tiết kiệm chi phí**

```env
# Chấm điểm: Dùng Flash (vẫn đủ tốt)
GEMINI_EVAL_MODEL=gemini-2.5-flash

# Transcription: Dùng Flash-Lite (rẻ nhất)
GEMINI_TRANSCRIBE_MODEL=gemini-2.5-flash-lite
```

**Lý do:**
- Giảm chi phí đáng kể
- Vẫn đảm bảo chất lượng chấp nhận được
- Phù hợp cho production với volume lớn

---

### **Option 3: Cân bằng** (Khuyến nghị cho production)

```env
# Chấm điểm Writing: Dùng Pro (quan trọng nhất)
GEMINI_EVAL_MODEL=gemini-2.5-pro

# Transcription: Dùng Flash-Lite (volume lớn, cần tốc độ)
GEMINI_TRANSCRIBE_MODEL=gemini-2.5-flash-lite
```

**Lý do:**
- Tối ưu chi phí cho transcription (volume lớn)
- Đảm bảo chất lượng chấm điểm (quan trọng nhất)

---

## ⚙️ CÁCH CẬP NHẬT

### Bước 1: Cập nhật file `.env`

```env
# Thay đổi từ
GEMINI_EVAL_MODEL=gemini-2.0-flash-exp
GEMINI_TRANSCRIBE_MODEL=gemini-2.0-flash-exp

# Thành (ví dụ Option 1)
GEMINI_EVAL_MODEL=gemini-2.5-pro
GEMINI_TRANSCRIBE_MODEL=gemini-2.5-flash
```

### Bước 2: Test lại các chức năng

```bash
# Test chấm điểm Writing
# Test chấm điểm Speaking
# Test transcription
# Test translate vocabulary
```

### Bước 3: Monitor hiệu năng

- So sánh MAE (Mean Absolute Error) với model cũ
- So sánh WER (Word Error Rate) cho transcription
- So sánh chi phí API

---

## 📝 LƯU Ý

1. **Structured JSON Output:**
   - Tất cả model 2.5 đều hỗ trợ `response_mime_type: "application/json"`
   - Có thể cải thiện độ ổn định JSON parsing
   - Xem thêm: https://ai.google.dev/gemini-api/docs/structured-output

2. **Audio Format:**
   - Hỗ trợ: MP3, WAV, M4A, OGG, WEBM
   - Đảm bảo file audio có chất lượng tốt để transcription chính xác

3. **Token Limits:**
   - Tất cả model 2.5 có cùng token limits (1M input, 65K output)
   - Đủ cho prompt dài và rubric chi tiết

4. **Chi phí:**
   - Pro: Cao nhất
   - Flash: Trung bình
   - Flash-Lite: Thấp nhất
   - Nên test với volume nhỏ trước khi scale

5. **Backward Compatibility:**
   - Model 2.0 vẫn hoạt động
   - Có thể rollback nếu cần

---

## 🔗 TÀI LIỆU THAM KHẢO

- [Gemini API Models Documentation](https://ai.google.dev/gemini-api/docs/models)
- [Structured Output Guide](https://ai.google.dev/gemini-api/docs/structured-output)
- [Audio Input Guide](https://ai.google.dev/gemini-api/docs/audio)

---

**Cập nhật:** Tháng 12/2025  
**Dự án:** EPT Learning Platform  
**Tác giả:** Trần Văn Quý






