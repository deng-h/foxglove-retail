import { ReactElement, useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import MonacoEditor from "@monaco-editor/react";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { uploadFile, downloadFile, DRIVE_ID } from "../api/driveApi";

const CONFIG_PATH = "/retail/object-config/config.yml";
const CONFIG_DIR = "/retail/object-config/";
const CONFIG_FILENAME = "config.yml";

// 配置 Monaco Editor 使用本地导入的实例，避免 CDN 加载和 CSP 限制
loader.config({ monaco });

export default function ObjectConfigPage(): ReactElement {
  const [yamlContent, setYamlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const yamlContentRef = useRef<string>("");

  // 配置 Monaco Editor 环境，解决 Foxglove 桌面版（Electron）中的 worker 加载问题
  const handleEditorWillMount = () => {
    // 设置 Monaco 环境，创建空 worker 避免路径问题
    (window as any).MonacoEnvironment = {
      getWorker() {
        return new Worker(
          URL.createObjectURL(
            new Blob(["self.onmessage = () => {};"], { type: "text/javascript" }),
          ),
        );
      },
    };
  };

  useEffect(() => {
    loadConfig();

    // 组件卸载时自动保存（离开页面时）
    return () => {
      if (yamlContentRef.current) {
        setLoading(true);
        saveConfigSync(yamlContentRef.current).finally(() => setLoading(false));
      }
    };
  }, []);

  // 保存配置的同步版本(用于组件卸载时)
  const saveConfigSync = async (content: string) => {
    if (!content) return;

    try {
      setLoading(true);
      const blob = new Blob([content], { type: "application/x-yaml" });
      // 根据 API 文档：path 使用文件夹路径(末尾带/)，attachment 使用实际文件名
      const file = new File([blob], CONFIG_FILENAME, { type: "application/x-yaml" });

      // 使用文件夹路径，API 会自动使用 attachment 的文件名
      await uploadFile(DRIVE_ID, file, CONFIG_DIR);
    } catch (error) {
      console.error("Error preparing config for auto-save:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const blob = await downloadFile(DRIVE_ID, CONFIG_PATH);
      const text = await blob.text();
      setYamlContent(text);
      yamlContentRef.current = text;
      setHasUnsavedChanges(false);
      setSnackbarMessage("配置加载成功");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to load config:", error);
      setSnackbarMessage("配置加载失败");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const blob = new Blob([yamlContent], { type: "application/x-yaml" });
      // 根据 API 文档：path 使用文件夹路径(末尾带/)，attachment 使用实际文件名
      const file = new File([blob], CONFIG_FILENAME, { type: "application/x-yaml" });

      // 使用文件夹路径，API 会自动使用 attachment 的文件名
      await uploadFile(DRIVE_ID, file, CONFIG_DIR);
      yamlContentRef.current = yamlContent;
      setHasUnsavedChanges(false);
      setSnackbarMessage("配置保存成功");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to save config:", error);
      setSnackbarMessage("配置保存失败");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value ?? "";
    setYamlContent(newContent);
    yamlContentRef.current = newContent;
    setHasUnsavedChanges(true);
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await downloadFile(DRIVE_ID, CONFIG_PATH);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "config.yaml";
      a.click();
      URL.revokeObjectURL(url);
      setSnackbarMessage("配置下载成功");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to download config:", error);
      setSnackbarMessage("配置下载失败");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h4" gutterBottom>
        物体配置管理
      </Typography>
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading || !hasUnsavedChanges}
        >
          {hasUnsavedChanges ? "保存配置 *" : "保存配置"}
        </Button>
        <Button variant="outlined" onClick={handleDownload} disabled={loading}>
          下载配置
        </Button>
        {hasUnsavedChanges && (
          <Typography
            variant="body2"
            color="warning.main"
            sx={{ display: "flex", alignItems: "center" }}
          >
            有未保存的更改
          </Typography>
        )}
      </Box>
      <Box sx={{ mb: 2 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <CircularProgress />
          </Box>
        )}
        <MonacoEditor
          height="500px"
          width="1000px"
          language="yaml"
          theme="vs"
          value={yamlContent}
          beforeMount={handleEditorWillMount}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            fontFamily: "monospace",
            automaticLayout: true,
            colorDecorators: true,
            lineNumbers: "on",
            folding: true,
          }}
          onChange={handleEditorChange}
        />
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
