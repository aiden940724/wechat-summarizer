const fs = require('fs');
const path = require('path');

// 读取现有的 .env 文件
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  // 如果 .env 不存在，从 .env.example 复制
  const examplePath = path.join(__dirname, '.env.example');
  envContent = fs.readFileSync(examplePath, 'utf8');
}

// 更新或添加 USE_REAL_WECHAT_DATA 配置
if (envContent.includes('USE_REAL_WECHAT_DATA')) {
  envContent = envContent.replace(/USE_REAL_WECHAT_DATA=false/g, 'USE_REAL_WECHAT_DATA=true');
} else {
  // 在 WeChat Configuration 部分添加
  envContent = envContent.replace(
    '# WeChat Configuration',
    '# WeChat Configuration\nUSE_REAL_WECHAT_DATA=true  # 启用真实数据抓取'
  );
}

// 写入 .env 文件
fs.writeFileSync(envPath, envContent);
console.log('✅ 已启用真实数据抓取 (USE_REAL_WECHAT_DATA=true)');
console.log('🔄 请重启服务器以应用新配置');
