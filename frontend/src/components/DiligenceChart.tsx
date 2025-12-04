import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Button, CircularProgress } from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PracticeDay {
  date: string;
  practiced: boolean;
}

const DiligenceChart: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [practiceDays, setPracticeDays] = useState<PracticeDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPracticeData = () => {
      try {
        setIsLoading(true);
        
        // Danh sách các ngày đã luyện tập (theo định dạng yyyy-MM-dd)
        const practicedDates = [
          '2025-11-23', // Ngày 23/11
          '2025-12-01'  // Ngày 1/12
        ];
        
        // Tạo mảng practiceDays từ danh sách các ngày đã luyện tập
        const practiceData: PracticeDay[] = practicedDates.map(date => ({
          date,
          practiced: true
        }));
        
        setPracticeDays(practiceData);
      } catch (error) {
        console.error('Error loading practice data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPracticeData();
  }, [currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  
  const emptyDays = Array(startDay).fill(null);
  
  const practicedDates = new Set(practiceDays.filter(day => day.practiced).map(day => day.date));

  const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

  const isToday = (date: Date) => isSameDay(date, new Date());

  const getDayName = (dayIndex: number) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[dayIndex];
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Typography variant="h6" component="h2" sx={{ 
          fontWeight: 600,
          color: 'text.primary'
        }}>
          Biểu đồ chăm chỉ
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 0.5,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            size="small" 
            onClick={prevMonth} 
            sx={{ 
              minWidth: 36, 
              minHeight: 36,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            &lt;
          </Button>
          <Typography 
            variant="subtitle1" 
            component="div" 
            sx={{ 
              mx: 2,
              fontWeight: 500,
              minWidth: 160,
              textAlign: 'center'
            }}
          >
            {format(currentMonth, 'MMMM yyyy', { locale: vi })}
          </Typography>
          <Button 
            size="small" 
            onClick={nextMonth} 
            sx={{ 
              minWidth: 36, 
              minHeight: 36,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            &gt;
          </Button>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'center',
        mb: 2,
        gap: 1
      }}>
        {Array.from({ length: 7 }).map((_, index) => (
          <Box key={index} sx={{ py: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            >
              {getDayName(index)}
            </Typography>
          </Box>
        ))}
      </Box>

      {isLoading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 200
        }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: 1,
          mb: 3
        }}>
          {emptyDays.map((_, index) => (
            <Box key={`empty-${index}`} sx={{ visibility: 'hidden' }}>
              <Box sx={{ height: 32 }} />
            </Box>
          ))}
          
          {daysInMonth.map((day) => {
            const dayStr = formatDate(day);
            const practiced = practicedDates.has(dayStr);
            const today = isToday(day);
            
            return (
              <Box key={dayStr} sx={{ 
                aspectRatio: '1', 
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: practiced ? 'success.light' : 'background.paper',
                    border: today 
                      ? '2px solid' 
                      : practiced 
                        ? 'none' 
                        : '1px solid',
                    borderColor: today 
                      ? 'primary.main' 
                      : practiced 
                        ? 'transparent' 
                        : 'divider',
                    color: practiced ? 'white' : 'text.primary',
                    fontWeight: today ? 'bold' : 'normal',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '& .day-tooltip': {
                        visibility: 'visible',
                        opacity: 1,
                      }
                    },
                    ...(practiced && {
                      background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)'
                    })
                  }}
                >
                  <Typography 
                    variant="body2" 
                    component="span"
                    sx={{ 
                      fontSize: '0.8rem',
                      lineHeight: 1
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  
                  <Box 
                    className="day-tooltip"
                    sx={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      visibility: 'hidden',
                      opacity: 0,
                      transition: 'all 0.2s ease',
                      zIndex: 1,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        marginLeft: '-5px',
                        borderWidth: '5px',
                        borderStyle: 'solid',
                        borderColor: 'rgba(0, 0, 0, 0.8) transparent transparent transparent',
                      },
                    }}
                  >
                    {practiced ? 'Có luyện tập' : 'Chưa luyện tập'}
                    {today && ' • Hôm nay'}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
      
      {/* Chú thích */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 3,
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 16, 
            height: 16, 
            borderRadius: '50%',
            bgcolor: 'success.light',
            mr: 1 
          }} />
          <Typography variant="caption" color="text.secondary">
            Đã luyện tập
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 16, 
            height: 16, 
            borderRadius: '50%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            mr: 1 
          }} />
          <Typography variant="caption" color="text.secondary">
            Chưa luyện tập
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default DiligenceChart;