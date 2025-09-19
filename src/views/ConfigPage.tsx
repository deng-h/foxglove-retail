
import { ReactElement, useEffect, useState, useRef } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import MonacoEditor from '@monaco-editor/react';
import { uploadFile, downloadFile } from '../api/driveApi';

const DRIVE_ID = 'brain-drive'; // 假设的driveId
const CONFIG_PATH = '/config.yaml';

export default function ConfigPage(): ReactElement {
  const [yamlContent, setYamlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const blob = await downloadFile(DRIVE_ID, CONFIG_PATH);
      const text = await blob.text();
      setYamlContent(text);
      setSnackbarMessage('配置加载成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to load config:', error);
      setSnackbarMessage('配置加载失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        await uploadFile(DRIVE_ID, file, CONFIG_PATH);
        setSnackbarMessage('配置上传成功');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        // 重新加载配置
        await loadConfig();
      } catch (error) {
        console.error('Failed to upload config:', error);
        setSnackbarMessage('配置上传失败');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    }
    event.target.value = '';
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await downloadFile(DRIVE_ID, CONFIG_PATH);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'config.yaml';
      a.click();
      URL.revokeObjectURL(url);
      setSnackbarMessage('配置下载成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to download config:', error);
      setSnackbarMessage('配置下载失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h4" gutterBottom>配置管理</Typography>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleUploadClick} disabled={loading}>
          上传配置
        </Button>
        <Button variant="outlined" onClick={handleDownload} disabled={loading}>
          下载配置
        </Button>
      </Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".yaml,.yml"
      />
      <Box sx={{ mb: 2 }}>
        <MonacoEditor
          height="500px"
          width="1000px"
          language="yaml"
          theme="vs"
          value={yamlContent}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            fontFamily: 'monospace',
            automaticLayout: true,
            colorDecorators: true,
            lineNumbers: 'on',
            folding: true,
          }}
          onChange={(val) => setYamlContent(val ?? '')}
        />
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