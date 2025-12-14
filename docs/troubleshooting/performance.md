# 性能问题

V2Board 性能优化和常见性能问题解决方案。

## 性能诊断

### 页面加载缓慢

**诊断步骤**:

1. 确定瓶颈位置：
```bash
# 查看系统资源
top
htop

# 查看 PHP-FPM 状态
systemctl status php8.1-fpm

# 查看 Nginx 状态
systemctl status nginx
```

2. 检查响应时间：
```bash
# 使用 curl 测试
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# curl-format.txt 内容：
# time_namelookup:  %{time_namelookup}\n
# time_connect:  %{time_connect}\n
# time_appconnect:  %{time_appconnect}\n
# time_pretransfer:  %{time_pretransfer}\n
# time_redirect:  %{time_redirect}\n
# time_starttransfer:  %{time_starttransfer}\n
# time_total:  %{time_total}\n
```

## PHP 性能优化

### 启用 OPcache

编辑 `/etc/php/8.1/fpm/conf.d/10-opcache.ini`：

```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
opcache.fast_shutdown=1
opcache.enable_cli=1
```

重启 PHP-FPM：
```bash
systemctl restart php8.1-fpm
```

### 优化 PHP-FPM

编辑 `/etc/php/8.1/fpm/pool.d/www.conf`：

```ini
; 进程管理方式
pm = dynamic

; 最大子进程数
pm.max_children = 50

; 启动时的进程数
pm.start_servers = 10

; 最少空闲进程数
pm.min_spare_servers = 5

; 最多空闲进程数
pm.max_spare_servers = 20

; 每个子进程处理的最大请求数
pm.max_requests = 500

; 进程空闲超时时间
pm.process_idle_timeout = 10s

; 请求超时时间
request_terminate_timeout = 300

; 慢日志
slowlog = /var/log/php-fpm-slow.log
request_slowlog_timeout = 5s
```

根据服务器内存调整 `pm.max_children`：
- 1GB RAM: 10-20
- 2GB RAM: 20-30
- 4GB RAM: 30-50
- 8GB+ RAM: 50-100

重启服务：
```bash
systemctl restart php8.1-fpm
```

## Nginx 优化

### 基础优化

编辑 `/etc/nginx/nginx.conf`：

```nginx
# 工作进程数（通常等于 CPU 核心数）
worker_processes auto;

# 单个工作进程最大连接数
events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    # 开启高效文件传输模式
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # 连接超时时间
    keepalive_timeout 65;
    keepalive_requests 100;

    # 上传大小限制
    client_max_body_size 20M;
    client_body_buffer_size 128k;

    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    # 缓存配置
    open_file_cache max=10000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

### 启用浏览器缓存

在站点配置中添加：

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 启用 HTTP/2

```nginx
server {
    listen 443 ssl http2;
    # ...
}
```

测试并重启：
```bash
nginx -t
systemctl reload nginx
```

## 数据库优化

### MySQL 配置优化

编辑 `/etc/mysql/my.cnf` 或 `/etc/mysql/mysql.conf.d/mysqld.cnf`：

```ini
[mysqld]
# InnoDB 缓冲池大小（建议设置为可用内存的 50-70%）
innodb_buffer_pool_size = 1G

# 日志文件大小
innodb_log_file_size = 256M

# 缓冲池实例数
innodb_buffer_pool_instances = 4

# 查询缓存
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# 连接数
max_connections = 200

# 表缓存
table_open_cache = 4096
table_definition_cache = 2048

# 临时表大小
tmp_table_size = 64M
max_heap_table_size = 64M

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

重启 MySQL：
```bash
systemctl restart mysql
```

### 添加索引

查找未使用索引的查询：

```sql
-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 分析查询
EXPLAIN SELECT ...;
```

添加常用索引：

```sql
-- 用户表
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE users ADD INDEX idx_created_at (created_at);

-- 订单表
ALTER TABLE orders ADD INDEX idx_user_id (user_id);
ALTER TABLE orders ADD INDEX idx_status (status);
ALTER TABLE orders ADD INDEX idx_created_at (created_at);
```

## Redis 优化

### 配置优化

编辑 `/etc/redis/redis.conf`：

```conf
# 最大内存
maxmemory 512mb

# 内存淘汰策略
maxmemory-policy allkeys-lru

# 持久化设置（根据需求选择）
# 如果只用作缓存，可以禁用持久化
save ""
# 如果需要持久化
# save 900 1
# save 300 10
# save 60 10000

# 开启 AOF（可选）
# appendonly yes

# 禁用透明大页
# 在系统层面执行：
# echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

重启 Redis：
```bash
systemctl restart redis
```

### Laravel 缓存优化

```bash
# 缓存配置
php artisan config:cache

# 缓存路由
php artisan route:cache

# 缓存视图
php artisan view:cache
```

清除缓存：
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

## 应用层优化

### 队列优化

使用多个队列进程：

编辑 `/etc/supervisor/conf.d/v2board.conf`：

```ini
[program:v2board-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/v2board/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=3  # 增加进程数
redirect_stderr=true
stdout_logfile=/var/www/v2board/storage/logs/queue.log
stopwaitsecs=3600
```

重载 Supervisor：
```bash
supervisorctl reread
supervisorctl update
supervisorctl restart v2board-queue:*
```

### 懒加载和分页

在代码层面：
- 使用分页而不是一次性加载所有数据
- 使用 `select` 只查询需要的字段
- 使用 `with` 预加载关联数据，避免 N+1 查询

### 资源优化

```bash
# 前端资源编译优化
npm run production

# 图片压缩
# 使用工具如 TinyPNG, ImageOptim 等
```

## CDN 加速

### 使用 Cloudflare

1. 添加网站到 Cloudflare
2. 更新 DNS 到 Cloudflare
3. 启用以下功能：
   - Auto Minify (JS, CSS, HTML)
   - Brotli 压缩
   - HTTP/3
   - 缓存规则

### 静态资源 CDN

将静态资源（图片、CSS、JS）上传到 CDN：

```env
# .env
ASSET_URL=https://cdn.your-domain.com
```

## 监控和分析

### 安装监控工具

```bash
# 安装 htop
apt install htop -y

# 安装 iotop（磁盘 I/O 监控）
apt install iotop -y

# 安装 nethogs（网络监控）
apt install nethogs -y
```

### Laravel Telescope（开发环境）

```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

注意：生产环境建议禁用或限制访问。

### New Relic / Datadog（可选）

专业的 APM 工具，可以详细监控应用性能。

## 性能基准测试

### 使用 Apache Bench

```bash
# 安装
apt install apache2-utils -y

# 测试
ab -n 1000 -c 10 https://your-domain.com/
```

### 使用 wrk

```bash
# 安装
apt install wrk -y

# 测试
wrk -t4 -c100 -d30s https://your-domain.com/
```

## 常见性能瓶颈

### CPU 占用过高

可能原因：
- PHP-FPM 进程过多
- 死循环或低效代码
- 缺少缓存

解决：
- 优化代码
- 增加缓存
- 升级硬件

### 内存占用过高

可能原因：
- PHP-FPM 配置不当
- 内存泄漏
- 缓存过大

解决：
- 调整 PHP-FPM 配置
- 检查并修复内存泄漏
- 限制缓存大小

### 数据库查询慢

可能原因：
- 缺少索引
- 查询效率低
- 数据量过大

解决：
- 添加索引
- 优化查询
- 数据归档

## 性能检查清单

- [ ] OPcache 已启用
- [ ] PHP-FPM 配置已优化
- [ ] Nginx gzip 压缩已启用
- [ ] 浏览器缓存已配置
- [ ] HTTP/2 已启用
- [ ] MySQL 配置已优化
- [ ] 数据库索引已添加
- [ ] Redis 已启用并配置
- [ ] Laravel 配置已缓存
- [ ] 队列进程运行正常
- [ ] 静态资源已压缩
- [ ] CDN 已配置（可选）
- [ ] 监控工具已安装

## 优化效果评估

优化前后对比：

1. 页面加载时间
2. 服务器响应时间（TTFB）
3. 并发处理能力
4. 资源使用率（CPU、内存、磁盘 I/O）

使用工具：
- Google PageSpeed Insights
- GTmetrix
- WebPageTest
