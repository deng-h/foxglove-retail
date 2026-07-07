// API服务模块：大脑云盘管理
const BASE_URL = `https://${window.location.hostname}:${window.location.port}/hos-service/api/v1/devicemanager/drive/storage`;
export const DRIVE_ID = sessionStorage.getItem('projectDeviceId') || 'hos-24:41:8c:18:6c:99';

interface ApiResponse<T = unknown> {
  code?: number;
  data?: T;
  msg?: string;
}

const isSuccessCode = (code: number | undefined): boolean => {
  return code === undefined || code === 0 || code === 200;
};

const getBusinessErrorMessage = (data: ApiResponse, fallback: string): string => {
  if (typeof data.msg === 'string' && data.msg.length > 0) {
    return `${fallback}: ${data.msg}`;
  }
  if (typeof data.code === 'number') {
    return `${fallback}: code ${data.code}`;
  }
  return fallback;
};

const normalizeDrivePath = (path: string): string => {
  return path.replace(/^\/+/, '');
};

const assertHttpOk = (response: Response, fallback: string): void => {
  if (!response.ok) {
    throw new Error(`${fallback}: ${response.statusText}`);
  }
};

const readJsonIfPresent = async (response: Response): Promise<ApiResponse | undefined> => {
  const text = await response.text();
  if (text.trim().length === 0) {
    return undefined;
  }
  return JSON.parse(text) as ApiResponse;
};

const assertBusinessOk = (data: ApiResponse | undefined, fallback: string): void => {
  if (data && !isSuccessCode(data.code)) {
    throw new Error(getBusinessErrorMessage(data, fallback));
  }
};

const readJsonResponse = async <T = unknown>(response: Response, fallback: string): Promise<ApiResponse<T>> => {
  assertHttpOk(response, fallback);
  const data = await readJsonIfPresent(response);
  assertBusinessOk(data, fallback);
  return (data ?? {}) as ApiResponse<T>;
};

const assertVoidResponse = async (response: Response, fallback: string): Promise<void> => {
  assertHttpOk(response, fallback);
  const data = await readJsonIfPresent(response);
  assertBusinessOk(data, fallback);
};

// 获取认证头
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token'); // 假设token存储在localStorage中
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// 1. 列出文件和目录
export const listFiles = async (driveId: string, path: string = ''): Promise<any[]> => {
  const url = `${BASE_URL}/${driveId}/list?path=${encodeURIComponent(normalizeDrivePath(path))}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await readJsonResponse<any[]>(response, 'Failed to list files');
  return data.data || [];
};

// 2. 删除文件或目录
export const deleteFile = async (driveId: string, path: string): Promise<void> => {
  const url = `${BASE_URL}/${driveId}/file?path=${encodeURIComponent(normalizeDrivePath(path))}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await assertVoidResponse(response, 'Failed to delete file');
};

// 3. 上传文件
// path 参数应该是目录路径，文件名从 file.name 中获取
export const uploadFile = async (driveId: string, file: File, path: string): Promise<any> => {
  const url = `${BASE_URL}/${driveId}/upload`;
  const formData = new FormData();
  formData.append('attachment', file);
  formData.append('path', normalizeDrivePath(path));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      // 注意：不要设置Content-Type，浏览器会自动设置multipart/form-data
    },
    body: formData,
  });
  return await readJsonResponse(response, 'Failed to upload file');
};

// 4. 下载文件
export const downloadFile = async (driveId: string, path: string): Promise<Blob> => {
  const url = `${BASE_URL}/${driveId}/download?path=${encodeURIComponent(normalizeDrivePath(path))}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  assertHttpOk(response, 'Failed to download file');
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    const data = await readJsonIfPresent(response.clone());
    assertBusinessOk(data, 'Failed to download file');
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
    body: JSON.stringify({ path: normalizeDrivePath(path) }),
  });
  await assertVoidResponse(response, 'Failed to create directory');
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
    body: JSON.stringify({
      oldPath: normalizeDrivePath(oldPath),
      newPath: normalizeDrivePath(newPath),
      overWrite,
    }),
  });
  await assertVoidResponse(response, 'Failed to copy file');
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
    body: JSON.stringify({
      oldPath: normalizeDrivePath(oldPath),
      newPath: normalizeDrivePath(newPath),
      overWrite,
    }),
  });
  await assertVoidResponse(response, 'Failed to move file');
};
