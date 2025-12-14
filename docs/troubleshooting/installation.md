# 安装问题

安装过程中可能遇到的问题和解决方案。

## Composer 相关

### 问题：Composer install 失败

**错误信息**:
```
Your requirements could not be resolved to an installable set of packages.
```

**解决方案**:

1. 检查 PHP 版本：
```bash
php -v
# 确保是 PHP 8.0+
```

2. 更新 Composer：
```bash
composer self-update
```

3. 清除缓存后重试：
```bash
composer clear-cache
composer install --no-dev
```

4. 如果还是失败，尝试忽略平台要求：
```bash
composer install --no-dev --ignore-platform-reqs
```

### 问题：Composer 下载速度慢

**解决方案**:

使用国内镜像：

```bash
# 全局配置
composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/

# 或使用腾讯云镜像
composer config -g repo.packagist composer https://mirrors.cloud.tencent.com/composer/
```

## PHP 扩展缺失

### 问题：缺少 PHP 扩展

**错误信息**:
```
PHP extension xxx is missing
```

**解决方案**:

安装缺失的扩展：

```bash
# Ubuntu/Debian
apt install php8.1-xxx -y

# CentOS
yum install php-xxx -y

# 重启 PHP-FPM
systemctl restart php8.1-fpm
```

常见缺失扩展：

```bash
# Ubuntu/Debian 一次性安装所有需要的扩展
apt install php8.1-fpm php8.1-mysql php8.1-curl php8.1-gd \
    php8.1-mbstring php8.1-xml php8.1-zip php8.1-bcmath \
    php8.1-redis -y
```

## 数据库相关

### 问题：无法连接数据库

**错误信息**:
```
SQLSTATE[HY000] [2002] Connection refused
```

**解决方案**:

1. 检查 MySQL 服务：
```bash
systemctl status mysql
# 如果未运行
systemctl start mysql
```

2. 检查 .env 配置：
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=v2board
DB_USERNAME=v2board
DB_PASSWORD=正确的密码
```

3. 测试数据库连接：
```bash
mysql -h 127.0.0.1 -u v2board -p
```

### 问题：数据库迁移失败

**错误信息**:
```
SQLSTATE[42S01]: Base table or view already exists
```

**解决方案**:

1. 重置数据库：
```bash
php artisan migrate:fresh
```

2. 如果有重要数据，逐个修复：
```bash
# 查看迁移状态
php artisan migrate:status

# 回滚到特定版本
php artisan migrate:rollback --step=1
```

## 权限问题

### 问题：Permission denied 错误

**错误信息**:
```
file_put_contents(...): failed to open stream: Permission denied
```

**解决方案**:

设置正确的权限：

```bash
cd /var/www/v2board

# 设置所有者
chown -R www-data:www-data .

# 设置目录权限
find . -type d -exec chmod 755 {} \;

# 设置文件权限
find . -type f -exec chmod 644 {} \;

# storage 和 bootstrap/cache 需要写权限
chmod -R 775 storage bootstrap/cache
```

## 密钥生成问题

### 问题：应用密钥未设置

**错误信息**:
```
No application encryption key has been specified.
```

**解决方案**:

```bash
php artisan key:generate
```

## Git 克隆问题

### 问题：克隆仓库失败

**错误信息**:
```
fatal: unable to access 'https://github.com/...': Could not resolve host
```

**解决方案**:

1. 检查网络连接：
```bash
ping github.com
```

2. 使用代理（如果在国内）：
```bash
# 设置 Git 代理
git config --global http.proxy http://proxy.example.com:port

# 或使用 Gitee 镜像（如果有的话）
git clone https://gitee.com/v2board/v2board.git
```

3. 或直接下载 ZIP：
```bash
wget https://github.com/v2board/v2board/archive/refs/heads/master.zip
unzip master.zip
```

## Nginx 配置问题

### 问题：访问显示 404

**解决方案**:

1. 检查 Nginx 配置中的 root 路径：
```nginx
root /var/www/v2board/public;  # 注意是 public 目录
```

2. 检查 try_files 配置：
```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

3. 测试配置并重启：
```bash
nginx -t
systemctl reload nginx
```

### 问题：样式和 JS 无法加载

**解决方案**:

1. 检查静态文件路径
2. 运行资源编译：
```bash
npm install
npm run production
```

## 队列服务问题

### 问题：Supervisor 无法启动队列

**解决方案**:

1. 检查配置文件 `/etc/supervisor/conf.d/v2board.conf`：
```ini
[program:v2board-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/v2board/artisan queue:work --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/v2board/storage/logs/queue.log
```

2. 重载配置：
```bash
supervisorctl reread
supervisorctl update
supervisorctl start v2board-queue:*
```

3. 检查状态：
```bash
supervisorctl status
```

## SSL 证书问题

### 问题：Certbot 获取证书失败

**解决方案**:

1. 确保域名已正确解析：
```bash
nslookup your-domain.com
```

2. 确保 80 端口可访问：
```bash
netstat -tlnp | grep :80
```

3. 手动获取证书：
```bash
certbot certonly --webroot -w /var/www/v2board/public -d your-domain.com
```

## 内存不足

### 问题：安装时内存不足

**错误信息**:
```
PHP Fatal error: Allowed memory size exhausted
```

**解决方案**:

1. 增加 PHP 内存限制：
```bash
# 编辑 php.ini
vim /etc/php/8.1/fpm/php.ini

# 修改
memory_limit = 256M
```

2. 创建 SWAP：
```bash
# 创建 2GB SWAP
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

3. Composer 安装时临时增加内存：
```bash
php -d memory_limit=-1 /usr/local/bin/composer install --no-dev
```

## 检查清单

安装失败时，按此清单检查：

- [ ] PHP 版本 >= 8.0
- [ ] 所有必需的 PHP 扩展已安装
- [ ] MySQL 服务正常运行
- [ ] Redis 服务正常运行
- [ ] 数据库和用户已创建
- [ ] .env 文件配置正确
- [ ] 文件权限设置正确
- [ ] Composer 依赖安装成功
- [ ] 应用密钥已生成
- [ ] 数据库迁移成功
- [ ] Nginx 配置正确
- [ ] 域名已正确解析

## 寻求帮助

如果以上方案都无法解决问题，请提供以下信息寻求帮助：

- 操作系统版本
- PHP 版本
- MySQL 版本
- 完整的错误信息
- 相关日志内容
