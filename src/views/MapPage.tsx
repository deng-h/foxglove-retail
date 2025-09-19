import { ReactElement, useState, useRef } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { uploadFile } from '../api/driveApi';

const DRIVE_ID = 'brain-drive';
const MAP_PATH = '/maps/';

export default function MapPage(): ReactElement {
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
    } else {
      setFileName("");
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setSnackbarMessage('请先选择文件');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);
      await uploadFile(DRIVE_ID, selectedFile, MAP_PATH + selectedFile.name);
      setSnackbarMessage('地图文件上传成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setFileName("");
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to upload map file:', error);
      setSnackbarMessage('地图文件上传失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
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
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" onClick={handleButtonClick} disabled={loading}>
            选择文件
          </Button>
          <Button variant="contained" color="primary" onClick={handleUpload} disabled={!selectedFile || loading}>
            上传地图
          </Button>
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {fileName ? `已选择地图文件：${fileName}` : '未选择地图文件'}
        </Typography>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}