// API服务模块：大脑云盘管理
const BASE_URL = '/hos-service/api/v1/taskmanager/drive/storage';

// 获取认证头
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('userToken'); // 假设token存储在localStorage中
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// 1. 列出文件和目录
export const listFiles = async (driveId: string, path: string = ''): Promise<any[]> => {
  const url = `${BASE_URL}/${driveId}/list?path=${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data || [];
};

// 2. 删除文件或目录
export const deleteFile = async (driveId: string, path: string): Promise<void> => {
  const url = `${BASE_URL}/${driveId}/file?path=${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.statusText}`);
  }
};

// 3. 上传文件
export const uploadFile = async (driveId: string, file: File, path: string): Promise<any> => {
  const url = `${BASE_URL}/${driveId}/upload`;
  const formData = new FormData();
  formData.append('attachment', file);
  formData.append('path', path);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      // 注意：不要设置Content-Type，浏览器会自动设置multipart/form-data
    },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }
  return await response.json();
};

// 4. 下载文件
export const downloadFile = async (driveId: string, path: string): Promise<Blob> => {
  const url = `${BASE_URL}/${driveId}/download?path=${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  return await response.blob();
};

// 5. 创建目录
export const createDir = async (driveId: string, path: string): Promise<void> => {
  const url = `${BASE_URL}/${driveId}/dir`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create directory: ${response.statusText}`);
  }
};

// 6. 复制文件或目录
export const copyFile = async (driveId: string, oldPath: string, newPath: string, overWrite: boolean = false): Promise<void> => {
  const url = `${BASE_URL}/${driveId}/copy`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ oldPath, newPath, overWrite }),
  });
  if (!response.ok) {
    throw new Error(`Failed to copy file: ${response.statusText}`);
  }
};

// 7. 移动文件或目录
export const moveFile = async (driveId: string, oldPath: string, newPath: string, overWrite: boolean = false): Promise<void> => {
  const url = `${BASE_URL}/${driveId}/move`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ oldPath, newPath, overWrite }),
  });
  if (!response.ok) {
    throw new Error(`Failed to move file: ${response.statusText}`);
  }
};