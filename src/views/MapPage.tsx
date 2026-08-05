import { useState, useRef, ReactElement, ChangeEvent, useEffect, InputHTMLAttributes } from 'react';
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
import { listFiles, uploadFile, deleteFile, createDir, DRIVE_ID } from '../api/driveApi';
import { formatDateTime } from '../utils';
import { fileListItemSx, fileListPageSx, fileListPaperSx, fileListSx, pinnedPageHeaderSx } from './pageStyles';

interface IFile {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  updateAt: string;
}

const BASE_PATH = '/retail/maps';

const directoryInputProps: InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory: string;
  directory: string;
} = {
  webkitdirectory: '',
  directory: '',
};

const normalizeRelativePath = (path: string): string => {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter((part) => part.length > 0 && part !== '.' && part !== '..')
    .join('/');
};

const getRelativePath = (file: File): string => {
  return normalizeRelativePath(file.webkitRelativePath || file.name);
};

const getDirectoryPath = (relativePath: string): string => {
  const parts = relativePath.split('/');
  parts.pop();
  return parts.join('/');
};

const joinDrivePath = (basePath: string, relativePath: string): string => {
  return relativePath.length > 0 ? `${basePath}/${relativePath}` : basePath;
};

export default function MapPage(): ReactElement {
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
      setFiles(fileList.filter((f: IFile) => f.isDir));
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
    const selectedFileList = event.target.files;
    if (selectedFileList && selectedFileList.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      for (const file of Array.from(selectedFileList)) {
        const relativePath = getRelativePath(file);
        if (relativePath.length === 0 || !relativePath.includes('/')) {
          invalidFiles.push(file.name);
          continue;
        }
        validFiles.push(file);
      }

      if (invalidFiles.length > 0) {
        let message = '请选择地图文件夹上传';
        if (invalidFiles.length > 0) {
          message += `，以下文件已跳过：${invalidFiles.join(', ')}`;
        }
        setSnackbarMessage(message);
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }

      if (validFiles.length > 0) {
        const uploadRootDirs = new Set(
          validFiles.map((file) => {
            const rootDir = getRelativePath(file).split('/')[0];
            return rootDir ?? '';
          }).filter((rootDir) => rootDir.length > 0),
        );
        const existing = files
          .filter((file) => uploadRootDirs.has(file.name))
          .map((file) => file.name);
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

  const performUpload = async (uploadFiles: File[]) => {
    try {
      setLoading(true);
      const directoryPaths = new Set<string>();
      for (const file of uploadFiles) {
        const directoryPath = getDirectoryPath(getRelativePath(file));
        if (directoryPath.length > 0) {
          directoryPaths.add(directoryPath);
        }
      }

      const sortedDirectoryPaths = Array.from(directoryPaths).sort((a, b) => {
        const depthDiff = a.split('/').length - b.split('/').length;
        return depthDiff !== 0 ? depthDiff : a.localeCompare(b);
      });
      for (const directoryPath of sortedDirectoryPaths) {
        try {
          await createDir(DRIVE_ID, joinDrivePath(BASE_PATH, directoryPath));
        } catch (error) {
          console.warn(`Failed to create directory ${directoryPath}:`, error);
        }
      }

      for (const file of uploadFiles) {
        const relativePath = getRelativePath(file);
        const directoryPath = getDirectoryPath(relativePath);
        setUploadingFile(relativePath);
        await uploadFile(DRIVE_ID, file, joinDrivePath(BASE_PATH, directoryPath));
      }
      setUploadingFile('');
      setSnackbarMessage('地图文件夹上传成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await loadFiles();
    } catch (error) {
      console.error('Failed to upload files:', error);
      setUploadingFile('');
      setSnackbarMessage('地图文件夹上传失败');
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
      setSnackbarMessage('请先选择要删除的地图文件夹');
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
      setSnackbarMessage('地图文件夹删除成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await loadFiles();
    } catch (error) {
      console.error('Failed to delete files:', error);
      setSnackbarMessage('地图文件夹删除失败');
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
    <Box sx={fileListPageSx}>
      <Box sx={pinnedPageHeaderSx}>
        <Typography variant="h4" gutterBottom>地图文件管理</Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleUploadClick} disabled={loading}>
            上传地图文件夹
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteClick} disabled={selectedFiles.size === 0 || loading}>
            删除选中文件夹
          </Button>
        </Box>
        {uploadingFile && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            正在上传: {uploadingFile}
          </Typography>
        )}
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
        {...directoryInputProps}
      />

      <Paper elevation={2} sx={fileListPaperSx}>
        <Typography variant="h6" gutterBottom>已上传的地图文件夹列表</Typography>
        <Divider sx={{ mb: 1 }} />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>加载中...</Typography>
          </Box>
        ) : files.length > 0 ? (
          <List sx={fileListSx}>
            <ListItem sx={fileListItemSx} disableGutters>
              <Checkbox
                checked={isAllSelected}
                onChange={handleSelectAllChange}
                indeterminate={selectedFiles.size > 0 && selectedFiles.size < files.length}
                sx={{ mr: 1 }}
              />
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>全选</Typography>
            </ListItem>
            {files.map((file) => (
              <ListItem key={file.path} sx={fileListItemSx} disableGutters>
                <Checkbox
                  checked={selectedFiles.has(file.path)}
                  onChange={() => handleCheckboxChange(file.path)}
                  sx={{ mr: 1 }}
                />
                <Box>
                  <Typography variant="body1">{file.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    路径: {file.path} | 更新时间: {formatDateTime(file.updateAt)}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">暂无地图文件夹，请点击上方按钮上传。</Typography>
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
        <DialogTitle id="confirm-dialog-title">确认覆盖文件夹</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            以下地图文件夹已存在，是否覆盖其中同名文件？{existingFiles.join(', ')}
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
        <DialogTitle id="delete-dialog-title">确认删除文件夹</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            确定要删除选中的 {selectedFiles.size} 个地图文件夹吗？此操作不可撤销。
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
