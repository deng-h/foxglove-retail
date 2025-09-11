import { PanelExtensionContext } from "@foxglove/extension";
import React, { ReactElement, useState } from "react";
// useState: 用于在组件内部创建和管理状态（state）。当状态改变时，React会自动重新渲染组件以反映最新的状态
// useEffect/useLayoutEffect: 用于处理“副作用 (Side Effects)”，例如与外部系统（如此处的 Foxglove context）进行交互、设置订阅、或者在组件渲染后执行某些操作
import { createRoot } from "react-dom/client";

// --- 页面组件定义 ---
// 1. 仪表盘页面
function DashboardPage(): ReactElement {
  return (
    <div>
      <h1>仪表盘</h1>
      <p>这里是系统的主概览页面。您可以放置一些关键性能指标 (KPIs) 或者机器人状态的摘要信息。</p>
    </div>
  );
}

// 2. 数据查看器页面
function DataViewerPage(): ReactElement {
  // 在这个组件里，您可以集成我们第一个例子中的代码，
  // 用来显示 ROS 话题、消息等。
  return (
    <div>
      <h1>数据查看器</h1>
      <p>这个页面可以用来订阅和可视化具体的 ROS 话题数据，例如 /joint_states 或 /odom。</p>
      {/* 在这里可以添加显示话题列表和消息的逻辑 */}
    </div>
  );
}

// 3. 系统设置页面
function SettingsPage(): ReactElement {
  return (
    <div>
      <h1>系统设置</h1>
      <p>在这里放置配置项，例如调整机器人运动参数、修改算法阈值等。</p>
      <div style={{ marginTop: "20px" }}>
        <label>参数 A: </label>
        <input type="text" placeholder="Value A" />
      </div>
      <div style={{ marginTop: "10px" }}>
        <label>参数 B: </label>
        <input type="range" />
      </div>
    </div>
  );
}


// 函数式组件：React 函数式组件，负责定义面板的用户界面和业务逻辑。它决定了面板上显示什么内容以及如何响应数据的变化
function ExamplePanel({ }: { context: PanelExtensionContext }): ReactElement {
  const [activeView, setActiveView] = useState<string>('dashboard');

  // 一个辅助函数，根据 activeView 的值来决定渲染哪个页面组件。
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'data_viewer':
        return <DataViewerPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        // 默认情况下也返回仪表盘页面，防止意外情况。
        return <DashboardPage />;
    }
  };

   // --- 样式定义 ---
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
        <h2>导航菜单</h2>
        <button
          style={activeView === 'dashboard' ? activeNavStyle : navButtonStyle}
          onClick={() => setActiveView('dashboard')}
        >
          仪表盘
        </button>
        <button
          style={activeView === 'data_viewer' ? activeNavStyle : navButtonStyle}
          onClick={() => setActiveView('data_viewer')}
        >
          数据查看器
        </button>
        <button
          style={activeView === 'settings' ? activeNavStyle : navButtonStyle}
          onClick={() => setActiveView('settings')}
        >
          系统设置
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
