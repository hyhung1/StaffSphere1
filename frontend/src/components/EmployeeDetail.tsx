import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const EmployeeDetail: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Employee Detail
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Employee detail view - Coming soon</Typography>
      </Paper>
    </Box>
  );
};

export default EmployeeDetail;