# 配置说明

本章节详细介绍 V2Board 的各项配置。

## 环境配置 (.env)

V2Board 使用 `.env` 文件存储环境配置。

### 基础配置

```env
# 应用名称
APP_NAME=V2Board

# 运行环境 (local, production)
APP_ENV=production

# 调试模式 (生产环境必须为 false)
APP_DEBUG=false

# 应用密钥 (使用 php artisan key:generate 生成)
APP_KEY=

# 应用URL
APP_URL=https://your-domain.com
```

### 数据库配置

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=v2board
DB_USERNAME=v2board
DB_PASSWORD=your_password
```

### Redis 配置

```env
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# 使用 Redis 作为缓存和队列驱动
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

### 邮件配置

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

## 后台配置

登录后台后，访问 `系统设置` 进行配置。

### 站点配置

- **站点名称**: 显示在网站标题
- **站点描述**: SEO 描述
- **站点关键词**: SEO 关键词
- **站点URL**: 网站访问地址

### 安全配置

- **注册开关**: 是否允许用户注册
- **邮箱验证**: 注册时是否需要邮箱验证
- **邀请码**: 是否需要邀请码才能注册
- **密码重置**: 是否允许密码重置

### 订阅配置

- **订阅链接**: 订阅地址格式
- **订阅协议**: 支持的协议类型
- **订阅更新**: 订阅更新间隔
- **流量重置**: 流量重置日期

### 支付配置

支持多种支付方式：

#### 支付宝

```env
# 需要配置支付宝应用信息
ALIPAY_APP_ID=
ALIPAY_PUBLIC_KEY=
ALIPAY_PRIVATE_KEY=
```

#### 微信支付

```env
WECHAT_APP_ID=
WECHAT_MCH_ID=
WECHAT_KEY=
```

#### Stripe

```env
STRIPE_KEY=
STRIPE_SECRET=
```

### 节点配置

#### 添加节点

1. 进入 `节点管理` > `节点列表`
2. 点击 `添加节点`
3. 填写节点信息：
   - 节点名称
   - 节点地址
   - 节点端口
   - 节点协议
   - 节点配置

#### 节点组

可以创建节点组，将节点分组管理。

## 性能优化配置

### PHP-FPM 优化

编辑 `/etc/php/8.1/fpm/pool.d/www.conf`：

```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500
```

### Redis 优化

编辑 `/etc/redis/redis.conf`：

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Nginx 优化

编辑 `/etc/nginx/nginx.conf`：

```nginx
worker_processes auto;
worker_connections 1024;

gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### OPcache 配置

编辑 `/etc/php/8.1/fpm/conf.d/10-opcache.ini`：

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

## 定时任务说明

V2Board 依赖定时任务执行一些周期性操作：

```bash
# 查看所有定时任务
php artisan schedule:list
```

主要任务：
- 流量统计
- 订单检查
- 节点状态检查
- 邮件发送队列
- 数据清理

## 备份配置

### 数据库备份

```bash
# 手动备份
mysqldump -u v2board -p v2board > backup_$(date +%Y%m%d).sql

# 定时备份（添加到 crontab）
0 2 * * * mysqldump -u v2board -p'password' v2board > /backup/v2board_$(date +\%Y\%m\%d).sql
```

### 文件备份

```bash
# 备份应用文件
tar -czf v2board_backup_$(date +%Y%m%d).tar.gz /var/www/v2board
```

## 日志配置

### 应用日志

位置: `storage/logs/laravel.log`

配置日志级别在 `.env`：

```env
LOG_CHANNEL=daily
LOG_LEVEL=error
```

### Nginx 访问日志

位置: `/var/log/nginx/access.log`

### PHP-FPM 错误日志

位置: `/var/log/php8.1-fpm.log`

## 安全建议

1. **禁用调试模式**: 生产环境设置 `APP_DEBUG=false`
2. **定期更新**: 及时更新 V2Board 和系统软件
3. **强密码**: 使用强密码并定期更换
4. **防火墙**: 配置防火墙只开放必要端口
5. **SSL证书**: 使用 HTTPS 加密传输
6. **数据库安全**: 限制数据库只允许本地访问
7. **文件权限**: 正确设置文件和目录权限
8. **定期备份**: 设置自动备份

## 下一步

配置完成后，可以：
- 查看 [FAQ](/faq/) 了解常见问题
- 遇到问题查看 [故障排除](/troubleshooting/)
