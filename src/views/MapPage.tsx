import { ReactElement } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Button from '@mui/material/Button';
import { useRef, useState } from 'react';

export default function MapPage(): ReactElement {
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>地图更新</Typography>
      <Box sx={{ mt: 4 }}>
        <input
          type="file"
          ref={inputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <Button variant="contained" onClick={handleButtonClick}>
          选择文件
        </Button>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {fileName ? `已选择地图文件：${fileName}` : '未选择地图文件'}
        </Typography>
      </Box>
    </Box>
  );
}