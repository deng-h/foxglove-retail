import { PanelExtensionContext } from "@foxglove/extension";
import React, { ReactElement, useState } from "react";
// useState: 用于在组件内部创建和管理状态（state）。当状态改变时，React会自动重新渲染组件以反映最新的状态
// useEffect/useLayoutEffect: 用于处理“副作用 (Side Effects)”，例如与外部系统（如此处的 Foxglove context）进行交互、设置订阅、或者在组件渲染后执行某些操作
import { createRoot } from "react-dom/client";
import ModelPage from "./views/ModelPage";
import GoodsManagerPage from "./views/GoodsManagerPage";
import GraspTeach from "./views/GraspTeachPage";
import AudioPage from "./views/AudioPage";
import MapPage from "./views/MapPage";


// 函数式组件：React 函数式组件，负责定义面板的用户界面和业务逻辑。它决定了面板上显示什么内容以及如何响应数据的变化
function ExamplePanel({ }: { context: PanelExtensionContext }): ReactElement {
  const [activeView, setActiveView] = useState<string>('dashboard');

  // 一个辅助函数，根据 activeView 的值来决定渲染哪个页面组件。
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
      default:
        return <ModelPage />;
    }
  };

  // 为了可读性，将样式对象提取出来。
  const panelStyle: React.CSSProperties = {
    display: 'flex',
    height: '100%', // 占满整个面板高度
    fontFamily: 'sans-serif',
  };

  const navStyle: React.CSSProperties = {
    width: '200px',
    padding: '1rem',
    borderRight: '1px solid #ccc',
    backgroundColor: '#f4f4f4',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1, // 占据剩余的所有空间
    padding: '1rem',
    overflowY: 'auto', // 如果内容超长，则显示滚动条
  };
  
  const navButtonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '16px',
  };

  const activeNavStyle: React.CSSProperties = {
    ...navButtonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  };

  return (
    <div style={panelStyle}>
      {/* 左侧导航栏 */}
      <nav style={navStyle}>
        <button style={activeView === 'model' ? activeNavStyle : navButtonStyle} onClick={() => setActiveView('model')}>
          商品模型更新
        </button>

        <button style={activeView === 'grasp_teach' ? activeNavStyle : navButtonStyle} onClick={() => setActiveView('grasp_teach')}>
          抓取示教更新
        </button>

        <button style={activeView === 'map' ? activeNavStyle : navButtonStyle} onClick={() => setActiveView('map')}>
          地图更新
        </button>

        <button style={activeView === 'audio' ? activeNavStyle : navButtonStyle} onClick={() => setActiveView('audio')}>
          语音更新
        </button>

        <button style={activeView === 'goods_manager' ? activeNavStyle : navButtonStyle}
          // 点击事件：先更新活跃视图，再跳转百度
          onClick={() => {
            setActiveView('goods_manager');
            window.open('https://www.baidu.com', '_blank');
          }}
        >
        商品管理后台<br />
        (点击跳转到新页面)
        </button>

      </nav>
      
      {/* 右侧内容区 */}
      <main style={contentStyle}>
        {renderContent()}
      </main>
    </div>
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
