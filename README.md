# Serverless API 使用文档

包括**来访者信息api**(ip、位置、时区)、**一言api**、**随机图api**。基于serverless，可快速部署，可托管于**vercel、cloudflare、netlify....**

# 快速部署

fork此仓库，vercel上绑定此项目。配置的话直接在仓库里改文件，具体见**配置说明**

## 1. 目录结构说明

```
/
├── config/
│   ├── domain.txt          # 域名白名单配置
│   ├── hitokoto/           # 一言（句子）分类文件夹
│   │   ├── default.txt     # 默认分类
│   │   └── anime.txt       # 示例：动漫分类
│   └── image/              # 图片分类文件夹
│       ├── default.txt     # 默认分类
│       └── nature.txt      # 示例：自然风景分类
├── src/                    # 源代码
├── server.ts               # 服务端入口
└── package.json            # 项目配置
```

## 2. 接口文档 (API Reference)

### 2.1 访客信息 API (Visitor)
返回调用者的 IP 地址及地理位置信息。

- **接口地址**: `/api/visitor`
- **请求方式**: `GET`
- **参数**: 无
- **返回示例**:
  ```json
  {
    "ip": "1.1.1.1",
    "country": "AU",
    "region": "VIC",
    "city": "Melbourne",
    "ll": [-37.81, 144.96],
    "timezone": "Australia/Melbourne"
  }
  ```

### 2.2 一言 API (Hitokoto)
返回一句随机的名言或句子。

- **接口地址**: `/api/hitokoto`
- **请求方式**: `GET`
- **参数**:
  - `c` (可选): 分类名称，对应 `config/hitokoto/` 下的文件名（不含 .txt）。默认为 `default`。
  - `format` (可选): 返回格式。
    - `text` (默认): 直接返回纯文本句子。
    - `json`: 返回 JSON 格式，包含句子和分类信息。
- **示例**:
  - `GET /api/hitokoto?c=anime` -> 返回一句动漫台词
  - `GET /api/hitokoto?format=json` -> `{"hitokoto": "...", "category": "default"}`

### 2.3 随机图片 API (Image)
返回一张随机图片的地址或直接跳转。

- **接口地址**: `/api/image`
- **请求方式**: `GET`
- **参数**:
  - `c` (可选): 分类名称，对应 `config/image/` 下的文件名（不含 .txt）。默认为 `default`。
  - `format` (可选): 返回格式。
    - `redirect` (默认): HTTP 302 跳转到图片地址。
    - `json`: 返回 JSON 格式，包含图片 URL。
- **示例**:
  - `GET /api/image?c=nature` -> 跳转到一张自然风景图片
  - `GET /api/image?format=json` -> `{"url": "...", "category": "default"}`

## 3. 配置说明

### 3.1 域名白名单 (`config/domain.txt`)
只有在该文件中列出的域名（或其子域名）才能调用 API。
- 每行一个域名。
- 如果文件为空，则允许所有域名（开发模式）。
- 示例：
  ```
  example.com
  myapp.com
  localhost
  ```

### 3.2 添加一言分类
1. 在 `config/hitokoto/` 目录下新建 `.txt` 文件，例如 `love.txt`。
2. 在文件中每行写入一个句子。
3. 调用时使用 `?c=love`。

### 3.3 添加图片分类
1. 在 `config/image/` 目录下新建 `.txt` 文件，例如 `cat.txt`。
2. 在文件中每行写入一个图片 URL（必须是 `http` 或 `https` 开头）。
3. 调用时使用 `?c=cat`。

## 4. 本地部署与运行

- **安装依赖**: `npm install`
- **开发模式**: `npm run dev` (端口 3000)
- **构建生产**: `npm run build`
- **生产运行**: `npm start`
