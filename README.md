# 微信文章批量总结工具

一个简单的微信公众号文章批量总结工具，使用 DeepSeek API 进行智能文章总结。

## 功能特性

- 🧠 **批量总结**: 输入微信文章URL列表，一键批量生成AI总结
- 📊 **智能分析**: 自动提取关键点、情感分析和内容分类
- 💾 **数据存储**: 自动保存文章内容和总结结果
- 📱 **简洁界面**: 基于 React + Tailwind CSS 的现代化界面
- 📈 **历史记录**: 查看所有批量处理的历史记录

## 技术架构

### 后端技术栈
- **Node.js + TypeScript**: 服务端运行环境
- **Express**: Web 框架
- **Prisma**: 数据库 ORM
- **SQLite**: 数据库
- **Puppeteer**: 网页自动化抓取

### 前端技术栈
- **React 18**: 前端框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **Vite**: 构建工具
- **Axios**: HTTP 客户端

### AI集成
- **DeepSeek API**: 文章智能总结
- **情感分析**: 自动识别文章情感倾向
- **内容分类**: 智能文章分类

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd wechat-article-summarizer
```

2. **安装依赖**
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下参数：
```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库
DATABASE_URL="file:./dev.db"

# DeepSeek API 配置
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# 微信配置
WECHAT_RATE_LIMIT_REQUESTS=10
WECHAT_RATE_LIMIT_WINDOW=60000

# 日志级别
LOG_LEVEL=info
```

4. **初始化数据库**
```bash
npm run db:generate
npm run db:push
```

5. **启动开发服务器**
```bash
# 同时启动前后端开发服务器
npm run dev

# 或者分别启动
npm run server:dev  # 后端服务器 (端口 3001)
npm run client:dev  # 前端服务器 (端口 3000)
```

6. **访问应用**
- 前端界面: http://localhost:3000
- 后端API: http://localhost:3001
- 数据库管理: `npm run db:studio`

## 使用指南

### 1. 添加公众号
- 访问"公众号管理"页面
- 点击"添加公众号"按钮
- 填写公众号名称和显示名称
- 保存后即可开始抓取文章

### 2. 文章抓取
- **自动抓取**: 系统每天上午9点自动抓取所有活跃公众号的文章
- **手动抓取**: 在公众号管理页面点击"抓取文章"按钮
- **批量抓取**: 在任务管理页面点击"手动抓取"按钮

### 3. AI总结
- **自动总结**: 系统每小时自动对新文章进行AI总结
- **手动总结**: 在文章详情页面点击"AI总结"按钮
- **批量总结**: 在任务管理页面点击"手动总结"按钮

### 4. 数据查看
- **仪表板**: 查看系统整体统计信息
- **文章列表**: 浏览所有抓取的文章，支持搜索和筛选
- **AI总结**: 查看所有AI总结结果，支持按分类和情感筛选
- **任务管理**: 监控系统任务执行状态

## API 接口

### 公众号管理
- `GET /api/accounts` - 获取所有公众号
- `POST /api/accounts` - 创建新公众号
- `PUT /api/accounts/:id` - 更新公众号信息
- `DELETE /api/accounts/:id` - 删除公众号

### 文章管理
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:id` - 获取文章详情
- `POST /api/articles/fetch/:accountId` - 手动抓取文章
- `GET /api/articles/search` - 搜索文章

### 总结管理
- `GET /api/summaries` - 获取总结列表
- `POST /api/summaries/create/:articleId` - 创建文章总结
- `GET /api/summaries/stats` - 获取总结统计

### 任务管理
- `GET /api/tasks/logs` - 获取任务日志
- `GET /api/tasks/stats` - 获取任务统计
- `POST /api/tasks/trigger/fetch` - 手动触发抓取任务
- `POST /api/tasks/trigger/summarize` - 手动触发总结任务

## 部署指南

### 生产环境部署

1. **构建项目**
```bash
npm run build
```

2. **配置生产环境变量**
```bash
NODE_ENV=production
DATABASE_URL="file:./prod.db"
```

3. **启动生产服务器**
```bash
npm start
```

### Docker 部署

```dockerfile
# Dockerfile 示例
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

## 注意事项

### 合规性说明
- 本系统仅用于学习和研究目的
- 请确保遵守微信平台使用规范
- 建议使用官方API而非爬虫方式获取内容
- 注意控制请求频率，避免对目标服务器造成压力

### 安全建议
- 生产环境中请使用强密码和HTTPS
- 定期更新依赖包以修复安全漏洞
- 限制API访问频率和权限
- 不要在代码中硬编码敏感信息

### 性能优化
- 使用Redis缓存热点数据
- 配置数据库连接池
- 启用Gzip压缩
- 使用CDN加速静态资源

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 DATABASE_URL 配置
   - 确保数据库文件权限正确

2. **DeepSeek API调用失败**
   - 验证API密钥是否正确
   - 检查网络连接和API配额

3. **文章抓取失败**
   - 检查目标网站的反爬虫策略
   - 调整请求频率和User-Agent

4. **前端页面无法访问**
   - 确认前后端服务都已启动
   - 检查端口是否被占用

## 开发指南

### 项目结构
```
├── src/server/          # 后端源码
│   ├── routes/         # API路由
│   ├── services/       # 业务逻辑
│   ├── middleware/     # 中间件
│   └── utils/          # 工具函数
├── client/             # 前端源码
│   ├── src/
│   │   ├── components/ # React组件
│   │   ├── pages/      # 页面组件
│   │   ├── services/   # API服务
│   │   └── types/      # TypeScript类型
├── prisma/             # 数据库模型
└── logs/               # 日志文件
```

### 开发规范
- 使用TypeScript进行类型检查
- 遵循ESLint代码规范
- 编写单元测试
- 使用Git进行版本控制

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件至 [your-email@example.com]

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
