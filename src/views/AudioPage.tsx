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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import { listFiles, uploadFile, deleteFile, DRIVE_ID } from '../api/driveApi';
import { formatDateTime } from '../utils';

interface IFile {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  updateAt: string;
}

const BASE_PATH = '/retail/audio/';

export default function AudioPage(): ReactElement {
  const [files, setFiles] = useState<IFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      const oversizedFiles: string[] = [];

      for (const file of Array.from(selectedFiles)) {
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!allowedExtensions.includes(extension)) {
          invalidFiles.push(file.name);
          continue;
        }
        if (file.size > maxSize) {
          oversizedFiles.push(file.name);
          continue;
        }
        validFiles.push(file);
      }

      if (invalidFiles.length > 0 || oversizedFiles.length > 0) {
        let message = '';
        if (invalidFiles.length > 0) {
          message += `以下文件类型不支持，已跳过：${invalidFiles.join(', ')}`;
        }
        if (oversizedFiles.length > 0) {
          if (message) message += '；';
          message += `以下文件超过5MB，已跳过：${oversizedFiles.join(', ')}`;
        }
        setSnackbarMessage(message);
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }

      if (validFiles.length > 0) {
        // 检查哪些文件已存在
        const existing = files.filter(f => validFiles.some(vf => vf.name === f.name)).map(f => f.name);
        if (existing.length > 0) {
          setFilesToUpload(validFiles);
          setExistingFiles(existing);
          setConfirmDialogOpen(true);
        } else {
          await performUpload(validFiles);
        }
      }
    }
    event.target.value = '';
  };

  const performUpload = async (files: File[]) => {
    try {
      setLoading(true);
      for (const file of files) {
        setUploadingFile(file.name);
        await uploadFile(DRIVE_ID, file, BASE_PATH);
      }
      setUploadingFile('');
      setSnackbarMessage('语音文件上传成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await loadFiles();
    } catch (error) {
      console.error('Failed to upload files:', error);
      setUploadingFile('');
      setSnackbarMessage('语音文件上传失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpload = async () => {
    setConfirmDialogOpen(false);
    await performUpload(filesToUpload);
    setFilesToUpload([]);
    setExistingFiles([]);
  };

  const handleCancelUpload = () => {
    setConfirmDialogOpen(false);
    setFilesToUpload([]);
    setExistingFiles([]);
  };

  const handleDeleteClick = async (): Promise<void> => {
    if (selectedFiles.size === 0) {
      setSnackbarMessage('请先选择要删除的语音文件');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    try {
      setLoading(true);
      for (const path of selectedFiles) {
        await deleteFile(DRIVE_ID, path);
      }
      setSelectedFiles(new Set());
      setSnackbarMessage('语音文件删除成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await loadFiles();
    } catch (error) {
      console.error('Failed to delete files:', error);
      setSnackbarMessage('语音文件删除失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
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
      <Typography variant="h4" gutterBottom>语音文件管理</Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleUploadClick} disabled={loading}>
          上传语音
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteClick} disabled={selectedFiles.size === 0 || loading}>
          删除选中语音
        </Button>
      </Box>
      {uploadingFile && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          正在上传: {uploadingFile}
        </Typography>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
        accept=".mp3,.wav,.ogg,.m4a,.aac,.flac"
      />

      <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>已上传的语音列表</Typography>
        <Divider sx={{ mb: 1 }} />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>加载中...</Typography>
          </Box>
        ) : files.length > 0 ? (
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
                    大小: {(file.size / 1024).toFixed(2)} KB | 更新时间: {formatDateTime(file.updateAt)}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">暂无语音文件，请点击上方按钮上传。</Typography>
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
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelUpload}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">确认覆盖文件</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            以下文件已存在，是否覆盖？{existingFiles.join(', ')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpload} color="primary">
            取消
          </Button>
          <Button onClick={handleConfirmUpload} color="primary" autoFocus>
            覆盖
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">确认删除文件</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            确定要删除选中的 {selectedFiles.size} 个文件吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            取消
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}