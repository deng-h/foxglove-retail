import { ReactElement } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function AudioPage(): ReactElement {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>语音更新</Typography>
    </Box>
  );
}