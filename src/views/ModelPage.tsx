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

interface IModel {
  id: number; // 使用一个唯一标识符，这里用时间戳简化处理
  name?: string; // 模型文件名
}

export default function ModelPage(): ReactElement {
  // 1. models: 存储已上传模型的列表
  const [models, setModels] = useState<IModel[]>([]);
  // 2. selectedModels: 存储被复选框选中的模型的id集合，Set数据结构更适合高效的增、删和查找
  const [selectedModels, setSelectedModels] = useState<Set<number>>(new Set());
  // 3. isAllSelected: 跟踪是否所有模型都被选中
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);
  // 创建一个Ref来引用隐藏的文件输入框，以便通过按钮触发它
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Snackbar 状态
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // 同步全选状态
  useEffect(() => {
    setIsAllSelected(selectedModels.size === models.length && models.length > 0);
  }, [selectedModels, models]);

  /**
   * 处理 "上传模型" 按钮的点击事件
   * 通过Ref触发隐藏的文件输入框的点击事件，从而打开文件选择器
   */
  const handleUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  /**
   * 处理文件输入框内容变化事件（即用户选择文件后）
   * @param event - 文件输入框的 change 事件对象
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // 支持批量上传
      const newModels: IModel[] = Array.from(files).map((file, idx) => ({
        id: Date.now() + idx, // 保证唯一性
        name: file.name,
      }));
      setModels(prevModels => [...prevModels, ...newModels]);
      // 显示成功消息
      setSnackbarMessage('模型上传成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
    // 清空input的值，这样即使用户连续上传同一个文件也能触发onChange事件
    event.target.value = '';
  };
  
  /**
   * 处理 "删除选中模型" 按钮的点击事件
   */
  const handleDeleteClick = (): void => {
    if (selectedModels.size === 0) {
      alert("请先选择要删除的模型。");
      return;
    }
    
    // 过滤掉models数组中ID存在于selectedModels集合中的项
    setModels(prevModels => prevModels.filter(model => !selectedModels.has(model.id)));
    // 清空选中集合
    setSelectedModels(new Set());
    // 重置全选状态
    setIsAllSelected(false);
    // 显示成功消息
    setSnackbarMessage('模型删除成功');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  /**
   * 处理复选框的选中状态变化
   * @param modelId - 被操作的模型的ID
   */
  const handleCheckboxChange = (modelId: number): void => {
    // 基于当前选中状态创建一个新的Set，以遵循React状态的不可变性原则
    const newSelectedModels = new Set(selectedModels);
    
    if (newSelectedModels.has(modelId)) {
      // 如果已选中，则从集合中移除
      newSelectedModels.delete(modelId);
    } else {
      // 如果未选中，则添加到集合中
      newSelectedModels.add(modelId);
    }
    
    setSelectedModels(newSelectedModels);
    // 更新全选状态
    setIsAllSelected(newSelectedModels.size === models.length && models.length > 0);
  };

  /**
   * 处理全选复选框的选中状态变化
   */
  const handleSelectAllChange = (): void => {
    if (isAllSelected) {
      // 取消全选
      setSelectedModels(new Set());
      setIsAllSelected(false);
    } else {
      // 全选所有模型
      const allModelIds = new Set(models.map(model => model.id));
      setSelectedModels(allModelIds);
      setIsAllSelected(true);
    }
  };


  return (
    <Box sx={{ fontFamily: 'sans-serif', p: 3 }}>
      <Typography variant="h4" gutterBottom>商品模型文件管理</Typography>

      {/* 操作按钮区域 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleUploadClick}>
          上传模型
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteClick} disabled={selectedModels.size === 0}>
          删除选中模型
        </Button>
      </Box>

      {/* 隐藏的文件输入框，通过Ref与上传按钮关联 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple // 支持多文件选择
      />

      {/* 模型列表区域 */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>已上传的模型列表</Typography>
        <Divider sx={{ mb: 1 }} />
        {models.length > 0 ? (
          <List>
            <ListItem sx={{ borderBottom: '1px solid #eee', py: 1 }} disableGutters>
              <Checkbox
                checked={isAllSelected}
                onChange={handleSelectAllChange}
                indeterminate={selectedModels.size > 0 && selectedModels.size < models.length}
                sx={{ mr: 1 }}
              />
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>全选</Typography>
            </ListItem>
            {models.map((model) => (
              <ListItem key={model.id} sx={{ borderBottom: '1px solid #eee', py: 1 }} disableGutters>
                <Checkbox
                  checked={selectedModels.has(model.id)}
                  onChange={() => handleCheckboxChange(model.id)}
                  sx={{ mr: 1 }}
                />
                <Typography variant="body1">{model.name}</Typography>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">暂无模型，请点击上方按钮上传。</Typography>
        )}
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: 200 }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}