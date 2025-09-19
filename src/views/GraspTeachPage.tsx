import { useState, useRef, ReactElement, ChangeEvent, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { listFiles, uploadFile, deleteFile } from '../api/driveApi';

interface IFile {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  updateAt: string;
}

const DRIVE_ID = 'brain-drive';
const BASE_PATH = '/grasp-teach/';

export default function GraspTeachPage(): ReactElement {
  const [files, setFiles] = useState<IFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    setIsAllSelected(selectedFiles.size === files.length && files.length > 0);
  }, [selectedFiles, files]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const fileList = await listFiles(DRIVE_ID, BASE_PATH);
      setFiles(fileList.filter((f: IFile) => !f.isDir)); // 只显示文件
    } catch (error) {
      console.error('Failed to load files:', error);
      setSnackbarMessage('加载文件列表失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        setLoading(true);
        for (const file of Array.from(files)) {
          await uploadFile(DRIVE_ID, file, BASE_PATH + file.name);
        }
        setSnackbarMessage('文件上传成功');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        await loadFiles();
      } catch (error) {
        console.error('Failed to upload files:', error);
        setSnackbarMessage('文件上传失败');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    }
    event.target.value = '';
  };

  const handleDeleteClick = async (): Promise<void> => {
    if (selectedFiles.size === 0) {
      setSnackbarMessage('请先选择要删除的文件');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);
      for (const path of selectedFiles) {
        await deleteFile(DRIVE_ID, path);
      }
      setSelectedFiles(new Set());
      setSnackbarMessage('文件删除成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await loadFiles();
    } catch (error) {
      console.error('Failed to delete files:', error);
      setSnackbarMessage('文件删除失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (filePath: string): void => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAllChange = (): void => {
    if (isAllSelected) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.path)));
    }
  };

  return (
    <Box sx={{ fontFamily: 'sans-serif', p: 3 }}>
      <Typography variant="h4" gutterBottom>抓取示教文件管理</Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleUploadClick} disabled={loading}>
          上传文件
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteClick} disabled={selectedFiles.size === 0 || loading}>
          删除选中文件
        </Button>
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
      />

      <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>文件列表</Typography>
        <Divider sx={{ mb: 1 }} />
        {files.length > 0 ? (
          <List>
            <ListItem sx={{ borderBottom: '1px solid #eee', py: 1 }} disableGutters>
              <Checkbox
                checked={isAllSelected}
                onChange={handleSelectAllChange}
                indeterminate={selectedFiles.size > 0 && selectedFiles.size < files.length}
                sx={{ mr: 1 }}
              />
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>全选</Typography>
            </ListItem>
            {files.map((file) => (
              <ListItem key={file.path} sx={{ borderBottom: '1px solid #eee', py: 1 }} disableGutters>
                <Checkbox
                  checked={selectedFiles.has(file.path)}
                  onChange={() => handleCheckboxChange(file.path)}
                  sx={{ mr: 1 }}
                />
                <Box>
                  <Typography variant="body1">{file.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    大小: {(file.size / 1024).toFixed(2)} KB | 更新时间: {file.updateAt}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">暂无文件，请点击上方按钮上传。</Typography>
        )}
      </Paper>
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