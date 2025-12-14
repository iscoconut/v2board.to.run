# 安装部署

本指南将详细介绍如何在服务器上部署 V2Board。

## 准备工作

在开始之前，请确保：

1. 服务器满足 [系统要求](/guide/requirements)
2. 已准备好域名并完成 DNS 解析
3. 具有 Root 或 Sudo 权限

## 安装方式

V2Board 提供两种安装方式：

### 方式一：一键安装脚本（推荐新手）

适合新手快速部署。

```bash
# 使用官方一键脚本
bash <(curl -Ls https://raw.githubusercontent.com/v2board/v2board/master/install.sh)
```

### 方式二：手动安装（推荐进阶用户）

更灵活，适合有经验的用户。

## 手动安装详细步骤

### 1. 更新系统

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS
yum update -y
```

### 2. 安装基础软件

#### 安装 Nginx

```bash
# Ubuntu/Debian
apt install nginx -y

# CentOS
yum install nginx -y

# 启动并设置开机自启
systemctl start nginx
systemctl enable nginx
```

#### 安装 PHP 8.1

```bash
# Ubuntu/Debian
apt install software-properties-common -y
add-apt-repository ppa:ondrej/php -y
apt update
apt install php8.1-fpm php8.1-mysql php8.1-curl php8.1-gd \
    php8.1-mbstring php8.1-xml php8.1-zip php8.1-bcmath \
    php8.1-redis -y

# CentOS
yum install epel-release -y
yum install https://rpms.remirepo.net/enterprise/remi-release-7.rpm -y
yum install yum-utils -y
yum-config-manager --enable remi-php81
yum install php php-fpm php-mysql php-curl php-gd \
    php-mbstring php-xml php-zip php-bcmath php-redis -y
```

#### 安装 MySQL

```bash
# Ubuntu/Debian
apt install mysql-server -y

# CentOS
yum install mysql-server -y

# 启动并设置开机自启
systemctl start mysql
systemctl enable mysql

# 安全配置
mysql_secure_installation
```

#### 安装 Redis

```bash
# Ubuntu/Debian
apt install redis-server -y

# CentOS
yum install redis -y

# 启动并设置开机自启
systemctl start redis
systemctl enable redis
```

#### 安装 Composer

```bash
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer
```

#### 安装 Supervisor

```bash
# Ubuntu/Debian
apt install supervisor -y

# CentOS
yum install supervisor -y

# 启动并设置开机自启
systemctl start supervisor
systemctl enable supervisor
```

### 3. 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE v2board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'v2board'@'localhost' IDENTIFIED BY '您的密码';
GRANT ALL PRIVILEGES ON v2board.* TO 'v2board'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 下载 V2Board

```bash
# 进入网站目录
cd /var/www

# 克隆代码
git clone https://github.com/v2board/v2board.git
cd v2board

# 安装依赖
composer install --no-dev
```

### 5. 配置环境

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
vim .env
```

配置示例：

```env
APP_NAME=V2Board
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=v2board
DB_USERNAME=v2board
DB_PASSWORD=您的数据库密码

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

### 6. 初始化应用

```bash
# 生成应用密钥
php artisan key:generate

# 运行数据库迁移
php artisan migrate --force

# 创建管理员账户
php artisan v2board:install
```

### 7. 设置文件权限

```bash
chown -R www-data:www-data /var/www/v2board
chmod -R 755 /var/www/v2board
chmod -R 775 /var/www/v2board/storage
chmod -R 775 /var/www/v2board/bootstrap/cache
```

### 8. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/v2board`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/v2board/public;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

启用站点：

```bash
ln -s /etc/nginx/sites-available/v2board /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 9. 配置 SSL（可选但强烈推荐）

使用 Certbot 获取免费 SSL 证书：

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

### 10. 配置队列服务

创建 Supervisor 配置 `/etc/supervisor/conf.d/v2board.conf`：

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

重载 Supervisor：

```bash
supervisorctl reread
supervisorctl update
supervisorctl start v2board-queue:*
```

### 11. 配置定时任务

```bash
crontab -e
```

添加：

```cron
* * * * * php /var/www/v2board/artisan schedule:run >> /dev/null 2>&1
```

## 验证安装

访问您的域名，应该能看到 V2Board 登录界面。

使用安装时创建的管理员账户登录后台。

## 常见问题

### 500 错误

检查：
- 文件权限是否正确
- `.env` 配置是否正确
- 查看日志 `storage/logs/laravel.log`

### 队列不工作

检查：
- Supervisor 服务是否运行
- Redis 是否正常
- 查看队列日志

### 定时任务不执行

检查：
- Crontab 是否配置正确
- 用户权限是否正确

## 下一步

- [配置说明](/guide/configuration) - 详细配置您的面板
- [故障排除](/troubleshooting/) - 遇到问题查看这里
