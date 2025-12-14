import React from 'react';
import { Grid, Card, CardContent, Skeleton, Box } from '@mui/material';

const CategoryCardSkeleton: React.FC = () => {
  return (
    // Grid item giữ nguyên cấu trúc responsive
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card sx={{ height: '100%', display: 'flex' }}>
        <CardContent sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {/* Skeleton cho Icon */}
            <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
            {/* Skeleton cho Tiêu đề */}
            <Skeleton variant="text" width="80%" height={40} />
          </Box>
          {/* Skeleton cho Mô tả */}
          <Skeleton variant="rectangular" width="100%" height={40} />
        </CardContent>
      </Card>
    </Grid>
  );
};

export default CategoryCardSkeleton;