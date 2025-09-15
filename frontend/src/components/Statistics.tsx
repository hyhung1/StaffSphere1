import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Statistics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Statistics & Reports
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Statistics dashboard - Coming soon</Typography>
      </Paper>
    </Box>
  );
};

export default Statistics;