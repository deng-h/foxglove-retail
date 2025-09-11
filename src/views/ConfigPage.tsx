
import { ReactElement, useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MonacoEditor from 'react-monaco-editor';


export default function ConfigPage(): ReactElement {
  const [yamlContent, setYamlContent] = useState<string>("");

  useEffect(() => {
    // 模拟获取yaml内容
    const fakeYaml = `server:\n  port: 8080\n  host: 127.0.0.1\ndatabase:\n  user: admin\n  password: secret\n  name: test_db\n`;
    setYamlContent(fakeYaml);
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h4" gutterBottom>配置管理</Typography>
      <Box sx={{ mb: 2 }}>
        <MonacoEditor
          height="400"
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
          onChange={val => setYamlContent(val ?? '')}
        />
      </Box>
    </Box>
  );
}