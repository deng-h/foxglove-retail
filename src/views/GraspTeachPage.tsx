import { useState, useRef, ReactElement, ChangeEvent } from 'react';

// 为模型对象定义一个接口，增强代码的健壮性和可读性
interface IModel {
  id: number; // 使用一个唯一标识符，这里用时间戳简化处理
  name?: string; // 模型文件名
}

export default function GraspTeachPage(): ReactElement {
  // 1. models: 存储已上传模型的列表
  const [models, setModels] = useState<IModel[]>([]);
  // 2. selectedModels: 存储被复选框选中的模型的id集合，Set数据结构更适合高效的增、删和查找
  const [selectedModels, setSelectedModels] = useState<Set<number>>(new Set());
  // 创建一个Ref来引用隐藏的文件输入框，以便通过按钮触发它
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 事件处理函数 ---

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
      const file = files[0];
      // 创建一个新的模型对象
      const newModel: IModel = {
        id: Date.now(), // 使用当前时间戳作为简化的唯一ID
        name: file?.name,
      };
      // 使用函数式更新，确保在之前的最新状态上追加新模型
      setModels(prevModels => [...prevModels, newModel]);
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
  };


  // --- 组件渲染 ---
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>商品示教文件管理</h1>
      <p style={{ color: '#666' }}>在这里您可以上传、查看和删除机器人所需的算法模型文件。</p>

      {/* 操作按钮区域 */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleUploadClick} style={{ padding: '10px 15px', cursor: 'pointer' }}>
          上传模型
        </button>
        <button 
          onClick={handleDeleteClick}
          disabled={selectedModels.size === 0} // 当没有模型被选中时，禁用删除按钮
          style={{ 
            padding: '10px 15px', 
            cursor: selectedModels.size === 0 ? 'not-allowed' : 'pointer',
            backgroundColor: selectedModels.size > 0 ? '#dc3545' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          删除选中模型
        </button>
      </div>

      {/* 隐藏的文件输入框，通过Ref与上传按钮关联 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }} // 关键：在界面上隐藏此元素
        // accept=".onnx,.pt,.pb" // 扩展：可以限制可选的文件类型
      />

      {/* 模型列表区域 */}
      <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
        <h3>已上传的模型列表</h3>
        {models.length > 0 ? (
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            {models.map((model) => (
              <li key={model.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedModels.has(model.id)}
                  onChange={() => handleCheckboxChange(model.id)}
                  style={{ marginRight: '10px' }}
                />
                <span>{model.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无模型，请点击上方按钮上传。</p>
        )}
      </div>
    </div>
  );
}