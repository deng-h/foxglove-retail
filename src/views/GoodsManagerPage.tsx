import { ReactElement } from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function GoodsManagerPage(): ReactElement {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>商品管理后台</Typography>
      <Button
        variant="contained"
        color="primary"
        href="https://www.baidu.com"
        target="_blank"
        sx={{ mt: 2 }}
      >
        跳转到管理后台
      </Button>
    </Box>
  );
}