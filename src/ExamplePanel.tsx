import { PanelExtensionContext } from "@foxglove/extension";
import { ReactElement, useState } from "react";
import { createRoot } from "react-dom/client";
import ModelPage from "./views/ModelPage";
import GoodsManagerPage from "./views/GoodsManagerPage";
import GraspTeach from "./views/GraspTeachPage";
import AudioPage from "./views/AudioPage";
import MapPage from "./views/MapPage";
import ConfigPage from "./views/ConfigPage";

// 引入 Material-UI 组件
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';


// 函数式组件：React 函数式组件，负责定义面板的用户界面和业务逻辑。它决定了面板上显示什么内容以及如何响应数据的变化
function ExamplePanel({ }: { context: PanelExtensionContext }): ReactElement {
  const [activeView, setActiveView] = useState<string>('dashboard');

  // 辅助函数：根据 activeView 渲染内容
  const renderContent = () => {
    switch (activeView) {
      case 'model':
        return <ModelPage />;
      case 'goods_manager':
        return <GoodsManagerPage />;
      case 'grasp_teach':
        return <GraspTeach />;
      case 'audio':
        return <AudioPage />;
      case 'map':
        return <MapPage />;
      case 'config':
        return <ConfigPage />;
      default:
        return <ModelPage />;
    }
  };

  // Material-UI 风格化侧边栏
  const NavBox = styled(Box)(({ theme }) => ({
    width: 220,
    background: '#f4f4f4',
    borderRight: '1px solid #e0e0e0',
    height: '100%',
    padding: theme?.spacing ? theme.spacing(2) : 16,
    boxSizing: 'border-box',
  }));

  const ContentBox = styled(Box)(({ theme }) => ({
    flex: 1,
    padding: theme?.spacing ? theme.spacing(3) : 24,
    overflowY: 'auto',
    background: '#fafbfc',
    height: '100%',
  }));

  // 导航项配置
  const navItems = [
    { key: 'model', label: '商品模型管理' },
    { key: 'grasp_teach', label: '抓取示教' },
    { key: 'config', label: '配置管理' },
    { key: 'map', label: '地图更新' },
    { key: 'audio', label: '语音更新' },
    { key: 'goods_manager', label: <span>商品管理后台<br />(点击跳转)</span>, external: true },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* 左侧导航栏 */}
      <NavBox>
        <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 700 }}>
          商品管理后台
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.key} disablePadding sx={{ mb: 1 }}>
              {item.external ? (
                <ListItemButton
                  onClick={() => window.open('https://www.baidu.com', '_blank')}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ) : (
                <ListItemButton
                  selected={activeView === item.key}
                  onClick={() => setActiveView(item.key)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              )}
            </ListItem>
          ))}
        </List>
      </NavBox>
      {/* 右侧内容区 */}
      <ContentBox>
        {renderContent()}
      </ContentBox>
    </Box>
  );
}

// 这是一个导出函数，是整个面板的入口点。当在Foxglove Studio中添加这个面板时，Foxglove会调用这个函数来初始化面板，并将React组件渲染到指定的DOM元素上
export function initExamplePanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<ExamplePanel context={context} />);

  return () => {
    root.unmount();
  };
}
