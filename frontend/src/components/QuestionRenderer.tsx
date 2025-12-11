import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios'; // Import axios gốc để tải file lên S3
import api from '../services/api'; // Import instance api của chúng ta
import type { QuizQuestion, UserAnswerValue, QuizQuestionOption } from '../types';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import * as lamejs from '@breezystack/lamejs';

// Xác định loại asset để hiển thị đúng (audio hoặc ảnh)
const isAudioUrl = (url?: string | null) =>
  !!url && /\.(mp3|wav|ogg|m4a|aac)$/i.test(url);

const isImageUrl = (url?: string | null) =>
  !!url && /\.(png|jpg|jpeg|gif|webp)$/i.test(url);

interface QuestionRendererProps {
  question: QuizQuestion;
  currentAnswer: UserAnswerValue | undefined;
  onAnswerChange: (questionId: number, answer: UserAnswerValue) => void;
  onUploadReady?: (uploadFn: () => Promise<void>) => void; // Callback để expose hàm upload
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ 
  question, 
  currentAnswer, 
  onAnswerChange,
  onUploadReady
}) => {
  // State cho upload file (dùng cho các loại câu hỏi khác nếu cần)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // State cho ghi âm trực tiếp (speaking)
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const uploadFnRef = useRef<(() => Promise<void>) | null>(null);

  // --- HÀM XỬ LÝ CHO CÁC LOẠI CÂU HỎI ---

  // Hàm convert WebM sang MP3
  const convertWebMToMP3 = async (webmBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const sampleRate = audioBuffer.sampleRate;
          const numChannels = audioBuffer.numberOfChannels;
          const length = audioBuffer.length;

          // Lấy dữ liệu từ tất cả các channels
          const channels: Float32Array[] = [];
          for (let i = 0; i < numChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
          }

          // Convert float32 to int16 cho từng channel
          const samplesInt16: Int16Array[] = [];
          for (let ch = 0; ch < numChannels; ch++) {
            const channelSamples = new Int16Array(length);
            for (let i = 0; i < length; i++) {
              const s = Math.max(-1, Math.min(1, channels[ch][i]));
              channelSamples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            samplesInt16.push(channelSamples);
          }

          // Encode MP3 với lamejs
          const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128); // 128 kbps
          const sampleBlockSize = 1152;
          const mp3Data: Int8Array[] = [];

          // Encode từng block
          for (let i = 0; i < length; i += sampleBlockSize) {
            const left = samplesInt16[0].subarray(i, i + sampleBlockSize);
            const right = numChannels > 1 ? samplesInt16[1].subarray(i, i + sampleBlockSize) : left;
            
            const mp3buf = mp3encoder.encodeBuffer(left, right);
            if (mp3buf.length > 0) {
              mp3Data.push(mp3buf);
            }
          }

          // Flush encoder
          const mp3buf = mp3encoder.flush();
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }

          // Tạo Blob từ MP3 data
          const mp3Blob = new Blob(mp3Data as BlobPart[], { type: 'audio/mpeg' });
          resolve(mp3Blob);
        } catch (err) {
          reject(err);
        }
      };

      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(webmBlob);
    });
  };

  // 1. Xử lý cho Trắc nghiệm
  const handleOptionChange = (optionId: number) => {
    onAnswerChange(question.question_id, { option_id: optionId });
  };

  // 2. Xử lý cho Điền từ & Viết luận
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onAnswerChange(question.question_id, { answer_text: e.target.value });
  };
  
  // 3. Xử lý ghi âm trực tiếp (Bài Nói)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(chunks, { type: 'audio/webm' });
        
        try {
          // Convert WebM sang MP3
          setIsUploading(true); // Hiển thị đang xử lý
          const mp3Blob = await convertWebMToMP3(webmBlob);
          setAudioBlob(mp3Blob);
          
          // Tạo URL từ MP3 để phát lại
          const url = URL.createObjectURL(mp3Blob);
          setAudioUrl(url);
        } catch (err: any) {
          console.error("Lỗi khi convert sang MP3:", err);
          setUploadError('Lỗi khi xử lý file audio. Vui lòng thử lại.');
          // Fallback: sử dụng WebM nếu convert thất bại
          setAudioBlob(webmBlob);
          const url = URL.createObjectURL(webmBlob);
          setAudioUrl(url);
        } finally {
          setIsUploading(false);
        }
        
        // Dừng stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setUploadError(null);

      // Bắt đầu đếm thời gian
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Lỗi khi bắt đầu ghi âm:", err);
      setUploadError('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setUploadError(null);
    onAnswerChange(question.question_id, { user_answer_url: null });
  };

  const uploadRecordedAudio = async () => {
    if (!audioBlob) {
      console.warn("Không có audioBlob để upload");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Tạo file từ blob (MP3)
      const file = new File([audioBlob], 'recording.mp3', { type: 'audio/mpeg' });
      console.log("Uploading audio file:", file.size, "bytes, type:", file.type);

      // BƯỚC 1: Xin link Presigned URL từ backend
      const presignedResponse = await api.post('/api/upload/presigned-url', {
        fileType: file.type,
      });
      
      if (!presignedResponse.data?.presignedUrl || !presignedResponse.data?.key) {
        throw new Error("Backend không trả về presigned URL hoặc key");
      }
      
      const { presignedUrl, key } = presignedResponse.data;
      console.log("Got presigned URL, key:", key);

      // BƯỚC 2: Tải file lên S3 bằng 'PUT'
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      console.log("Upload to S3 successful, key:", key);

      // BƯỚC 3: Tải lên thành công, cập nhật câu trả lời
      onAnswerChange(question.question_id, { user_answer_url: key });

    } catch (err: any) {
      console.error("Lỗi khi tải file:", err);
      const errorMessage = err.response?.data?.message || err.message || 'Tải file thất bại. Vui lòng thử lại.';
      setUploadError(errorMessage);
      throw err; // Ném lỗi để caller có thể xử lý
    } finally {
      setIsUploading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Expose hàm upload cho parent component (để tự động upload trước khi submit)
  // Sử dụng useRef để lưu các giá trị mới nhất
  const audioBlobRef = useRef(audioBlob);
  const currentAnswerRef = useRef(currentAnswer);
  const isUploadingRef = useRef(isUploading);
  
  useEffect(() => {
    audioBlobRef.current = audioBlob;
    currentAnswerRef.current = currentAnswer;
    isUploadingRef.current = isUploading;
  }, [audioBlob, currentAnswer, isUploading]);

  useEffect(() => {
    if (question.question_type === 'speaking') {
      uploadFnRef.current = async () => {
        // Kiểm tra lại state mới nhất trước khi upload
        const currentBlob = audioBlobRef.current;
        const currentAnswer = currentAnswerRef.current;
        const currentlyUploading = isUploadingRef.current;
        
        // Nếu có audioBlob nhưng chưa upload, tự động upload
        if (currentBlob && !currentAnswer?.user_answer_url && !currentlyUploading) {
          // Tạo file từ blob (MP3)
          const file = new File([currentBlob], 'recording.mp3', { type: 'audio/mpeg' });

          try {
            // Đánh dấu đang upload để tránh upload trùng
            setIsUploading(true);
            
            // BƯỚC 1: Xin link Presigned URL từ backend
            const presignedResponse = await api.post('/api/upload/presigned-url', {
              fileType: file.type,
            });
            
            const { presignedUrl, key } = presignedResponse.data;

            // BƯỚC 2: Tải file lên S3 bằng 'PUT'
            await axios.put(presignedUrl, file, {
              headers: {
                'Content-Type': file.type,
              },
            });

            // BƯỚC 3: Tải lên thành công, cập nhật câu trả lời
            onAnswerChange(question.question_id, { user_answer_url: key });
            
            // Cập nhật ref
            currentAnswerRef.current = { user_answer_url: key };
          } catch (err: any) {
            console.error("Lỗi khi tự động tải file:", err);
            setIsUploading(false);
            throw err; // Ném lỗi để QuizDoingPage có thể xử lý
          } finally {
            setIsUploading(false);
          }
        }
      };
      
      if (onUploadReady && uploadFnRef.current) {
        onUploadReady(uploadFnRef.current);
      }
    } else {
      // Nếu không phải speaking, xóa upload function
      uploadFnRef.current = null;
    }
  }, [question.question_id, question.question_type, onUploadReady, onAnswerChange]);

  // Reset state khi chuyển câu hỏi (chỉ áp dụng cho speaking)
  useEffect(() => {
    if (question.question_type === 'speaking') {
      // Nếu đang ghi âm, dừng lại
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      
      // Cleanup
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Reset state (nhưng giữ currentAnswer nếu đã có)
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setIsPlaying(false);
    }
  }, [question.question_id]); // Chỉ reset khi question_id thay đổi

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Format thời gian (giây -> mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Hàm render nội dung dựa trên loại câu hỏi
  const renderQuestionBody = () => {
    switch (question.question_type) {
      
      // --- TRẮC NGHIỆM (multiple_choice) ---
      case 'multiple_choice': {
        const optionsArray = (typeof question.options === 'string')
          ? JSON.parse(question.options) as QuizQuestionOption[]
          : question.options;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {optionsArray?.map((option) => (
              <label 
                key={option.option_id} 
                style={{
                  display: 'block', padding: '10px', border: '1px solid #ccc',
                  borderRadius: '5px',
                  backgroundColor: currentAnswer?.option_id === option.option_id ? '#d4edda' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name={`question_${question.question_id}`}
                  value={option.option_id}
                  checked={currentAnswer?.option_id === option.option_id}
                  onChange={() => handleOptionChange(option.option_id)}
                  style={{ marginRight: '10px' }}
                />
                {option.option_text}
              </label>
            ))}
          </div>
        );
      }
      
      // --- ĐIỀN TỪ (fill_blank) ---
      case 'fill_blank':
        return (
          <input
            type="text"
            placeholder="Điền câu trả lời của bạn"
            value={currentAnswer?.answer_text || ''}
            onChange={handleTextChange}
            style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          />
        );
      
      // --- VIẾT LUẬN (essay) ---
      case 'essay':
        return (
          <textarea
            rows={10}
            placeholder="Viết bài luận của bạn..."
            value={currentAnswer?.answer_text || ''}
            onChange={handleTextChange}
            style={{ width: '100%', padding: '10px', fontSize: '16px', fontFamily: 'sans-serif' }}
          />
        );

      // --- NÓI (speaking) ---
      case 'speaking':
        return (
          <Box sx={{ mt: 2 }}>
            {uploadError && (
              <Typography color="error" sx={{ mb: 2 }}>
                {uploadError}
              </Typography>
            )}

            {/* Trạng thái: Chưa ghi âm hoặc đã xóa */}
            {!audioBlob && !isRecording && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<MicIcon />}
                  onClick={startRecording}
                  disabled={isUploading}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Bắt đầu ghi âm
                </Button>
                {currentAnswer?.user_answer_url && (
                  <Typography color="success.main" sx={{ mt: 1 }}>
                    ✅ Đã tải lên thành công
                  </Typography>
                )}
              </Box>
            )}

            {/* Trạng thái: Đang ghi âm */}
            {isRecording && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: 'error.main',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                      },
                    }}
                  />
                  <Typography variant="h6" color="error">
                    Đang ghi âm: {formatTime(recordingTime)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={stopRecording}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Dừng ghi âm
                </Button>
              </Box>
            )}

            {/* Trạng thái: Đã ghi âm xong, chưa upload */}
            {audioBlob && !isRecording && !currentAnswer?.user_answer_url && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Thời lượng: {formatTime(recordingTime)}
                </Typography>

                {/* Audio player */}
                {audioUrl && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                      onClick={togglePlayback}
                    >
                      {isPlaying ? 'Tạm dừng' : 'Phát lại'}
                    </Button>
                  </Box>
                )}

                {/* Các nút điều khiển */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={uploadRecordedAudio}
                    disabled={isUploading}
                    startIcon={isUploading ? <CircularProgress size={16} /> : null}
                  >
                    {isUploading ? 'Đang tải lên...' : 'Tải lên'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={deleteRecording}
                    disabled={isUploading}
                  >
                    Xóa và ghi lại
                  </Button>
                </Box>
              </Box>
            )}

            {/* Trạng thái: Đã upload thành công */}
            {currentAnswer?.user_answer_url && !audioBlob && !isRecording && (
              <Box sx={{ mt: 2 }}>
                <Typography color="success.main" sx={{ mb: 2 }}>
                  ✅ Đã tải lên thành công
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<MicIcon />}
                  onClick={startRecording}
                  disabled={isUploading}
                >
                  Ghi âm lại
                </Button>
              </Box>
            )}
          </Box>
        );

      default:
        return <p>Lỗi: Loại câu hỏi không được hỗ trợ.</p>;
    }
  };

  return (
    <div>
      {/* Asset cho Listening/Speaking: ưu tiên audio, nhưng cho phép ảnh minh họa */}
      {(() => {
        let audioUrl: string | null = null;
        let imageUrl: string | null = null;

        if (question.asset_url) {
          const looksAudio = isAudioUrl(question.asset_url);
          const looksImage = isImageUrl(question.asset_url);

          // Ưu tiên phân loại theo đuôi file
          if (looksAudio) audioUrl = question.asset_url;
          if (looksImage) imageUrl = question.asset_url;

          // Trường hợp file không rõ đuôi: 
          // - Với listening/speaking: hiển thị audio (ưu tiên) và thử hiển thị ảnh nếu không phải audio rõ ràng
          if (!looksAudio && (question.skill_focus === 'listening' || question.skill_focus === 'speaking')) {
            // Nếu không xác định là audio, thử hiển thị như ảnh minh họa
            imageUrl = imageUrl || question.asset_url;
          }
        }

        return (
          <>
            {audioUrl && (
              <audio
                controls
                src={audioUrl}
                crossOrigin="anonymous"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                Trình duyệt của bạn không hỗ trợ file audio.
              </audio>
            )}

            {imageUrl && (
              <img
                src={imageUrl}
                alt="Minh họa câu hỏi"
                style={{ width: '100%', maxHeight: 320, objectFit: 'contain', marginBottom: '12px' }}
              />
            )}
          </>
        );
      })()}
      
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
        {question.question_text}
      </p>
      
      {renderQuestionBody()}
    </div>
  );
};

export default QuestionRenderer;