# 本文档方便Orin侧快速搭建，AI Agent不用看

## 创建相应的目录
```bash
sudo mkdir -p /home/hos_agent/webdav/data/retail/audio
sudo mkdir -p /home/hos_agent/webdav/data/retail/grasp-adjust-config
sudo mkdir -p /home/hos_agent/webdav/data/retail/grasp-teach
sudo mkdir -p /home/hos_agent/webdav/data/retail/maps
sudo mkdir -p /home/hos_agent/webdav/data/retail/model-config
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

# 新机器需要注意的地方
1. `docker-compose.yml`中audio文件挂载方法：/home/hos_agent/webdav/data/retail/audio:/shared/audio，音频放在/home/hos_agent/webdav/data/retail/audio下
```bash
sudo cp containers/shared/audio/*.wav /home/hos_agent/webdav/data/retail/audio/
```
2. `docker-compose.yml`中地图文件：/home/hos_agent/webdav/data/retail/maps/:/navi_ws/map_config/，地图放在/home/hos_agent/webdav/data/retail/maps下
```bash
sudo cp -r containers/perception/datasets/* /home/hos_agent/webdav/data/retail/maps/
```


3. 物体配置管理
ln -s \
/home/naviai/cv_source/src/naviai_manip_instance_segmentation/config/model.yaml \
/home/hos_agent/webdav/data/retail/object-config/labels.yaml

/etc/docker/daemon.json
{
  "insecure-registries" : ["harbor.zj-humanoid.com:30015"]
}
echo '密码' | docker login harbor.zj-humanoid.com:30015 -u admin --password-stdin


```yaml
services:
  webdav:
    image: harbor.zj-humanoid.com:30015/controller/webdav:v5.10.3
    container_name: webdav
    command: -c /config.yml
    network_mode: host
    security_opt:
      - no-new-privileges:true
    volumes:
      - ./config.yml:/config.yml:ro
      - /home/hos_agent/webdav/data:/data
      - /home/naviai/cv_source/src/naviai_manip_instance_segmentation/config:/home/naviai/cv_source/src/naviai_manip_instance_segmentation/config
      - /home/naviai/cv_source/src/sam6d/scripts/model/now:/data/retail/goods-models
      - /home/naviai/navi_project/containers/shared/audio:/data/retail/audio
      - /home/hos_agent/webdav/data/retail/maps:/data/retail/maps
      - /home/naviai/cv_source/src/naviai_manip_instance_segmentation/models:/data/retail/yolo-models
    restart: unless-stopped
```

```bash
sudo su
cd /opt/hos/agent-deployment/services/webdav

# 应用配置
docker -c hos compose config
docker -c hos compose up -d --force-recreate --pull never

# 检查挂载
docker -c hos inspect webdav --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'

# 测试
curl -u supconhos:supconhos \
  -X PROPFIND \
  -H 'Depth: 1' \
  http://127.0.0.1:6060/retail/goods-models/
```


