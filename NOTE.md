# 本文档方便Orin侧快速搭建，AI Agent不用看

## 创建相应的目录
```bash
sudo mkdir -p /home/hos_agent/webdav/data/retail/audio
sudo mkdir -p /home/hos_agent/webdav/data/retail/grasp-adjust-config
sudo mkdir -p /home/hos_agent/webdav/data/retail/grasp-teach
sudo mkdir -p /home/hos_agent/webdav/data/retail/maps
sudo mkdir -p /home/hos_agent/webdav/data/retail/model-config
sudo mkdir -p /home/hos_agent/webdav/data/retail/goods-models
sudo mkdir -p /home/hos_agent/webdav/data/retail/goods-models
sudo mkdir -p /home/hos_agent/webdav/data/retail/object-config
sudo mkdir -p /home/hos_agent/webdav/data/retail/yolo-models
```

## 上传文件与实际使用文件之间的链接
### 核心思路
既然算法侧的代码不好改动，而前端接口的上传路径又是固定的，最优雅的解决办法就是**在操作系统层面做路径映射**，或者**通过自动化脚本进行文件同步**。
---
## 方案一：创建软链接（Symbolic Link）—— **最推荐，工作量为零**
这是最简单、最快且不占用额外磁盘空间的方法。你可以让算法需要访问的路径直接指向前端上传的路径。
假设前端上传路径为：`/home/abc/webdav/data/`
算法顽固认定的路径为：`/path/to/algorithm/input/`
**操作步骤：**
1. 确保算法认定的那个旧目录（如 `input`）是空的，或者先把它删掉（记得备份里面的重要文件）。
2. 在终端执行以下命令，把算法路径“指”向上传路径：
```bash
ln -s /home/abc/webdav/data /path/to/algorithm/input
```

3. **效果：** 当算法去读取 `/path/to/algorithm/input/file.txt` 时，操作系统会自动带它去读 `/home/abc/webdav/data/file.txt`。代码一个字都不用改。
> ⚠️ **注意：** 确保运行算法的用户对 `/home/abc/webdav/data/` 目录拥有**读取权限**。
---

## 方案二：目录绑定挂载（Bind Mount）—— **软链接失效时的底层大招**
有时候，某些编程语言的库或特定的安全机制（比如 Docker 容器、某些特定的权限管理）会因安全策略拒绝追踪软链接。这时候可以用 Linux 系统的“绑定挂载”。
它可以把一个目录直接“挂载”并映射到另一个目录上，在软件眼里它们就是同一个物理地方。
**操作步骤：**
1. 执行挂载命令（需要 root 或 sudo 权限）：
```bash
sudo mount --bind /home/abc/webdav/data /path/to/algorithm/input
```

2. 如果希望设备重启后依然有效，需要将其写入 `/etc/fstab` 配置文件中：
```text
/home/abc/webdav/data  /path/to/algorithm/input  none  bind  0  0
```

