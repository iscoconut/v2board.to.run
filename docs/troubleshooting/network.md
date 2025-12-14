# 网络问题

网络连接相关的常见问题和解决方案。

## 无法访问面板

### 现象

浏览器无法打开 V2Board 面板。

### 诊断步骤

1. **检查服务器状态**:
```bash
# 检查服务器是否在线
ping your-server-ip

# 检查 SSH 连接
ssh user@your-server-ip
```

2. **检查 Web 服务**:
```bash
# 检查 Nginx 状态
systemctl status nginx

# 检查端口监听
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

3. **检查防火墙**:
```bash
# Ubuntu/Debian (ufw)
ufw status

# CentOS (firewalld)
firewall-cmd --list-all

# iptables
iptables -L -n
```

### 解决方案

1. **启动 Nginx**:
```bash
systemctl start nginx
systemctl enable nginx
```

2. **开放端口**:

Ubuntu/Debian (ufw):
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

CentOS (firewalld):
```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

iptables:
```bash
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
service iptables save
```

3. **检查云服务商安全组**:
- 阿里云：安全组规则
- 腾讯云：防火墙规则
- AWS：Security Groups
- 确保开放 80 和 443 端口

## SSL/HTTPS 问题

### 证书过期

**错误信息**:
```
NET::ERR_CERT_DATE_INVALID
```

**解决方案**:

续期证书：
```bash
# Let's Encrypt 自动续期
certbot renew

# 测试续期
certbot renew --dry-run

# 查看证书有效期
certbot certificates
```

设置自动续期：
```bash
# 添加到 crontab
crontab -e

# 每天检查一次证书
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

### 证书不受信任

**错误信息**:
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**可能原因**:
1. 使用自签名证书
2. 证书链不完整
3. 域名不匹配

**解决方案**:

使用 Let's Encrypt 免费证书：
```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d your-domain.com -d www.your-domain.com

# Nginx 会自动配置
```

### 混合内容警告

**错误信息**:
```
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```

**解决方案**:

1. 确保所有资源使用 HTTPS：
```nginx
# 在 Nginx 配置中强制 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

2. 更新 .env：
```env
APP_URL=https://your-domain.com
ASSET_URL=https://your-domain.com
```

## DNS 问题

### 域名无法解析

**诊断**:

```bash
# 检查域名解析
nslookup your-domain.com
dig your-domain.com

# 查看 DNS 传播状态
# 使用在线工具：https://dnschecker.org
```

**解决方案**:

1. 检查 DNS 记录设置：
   - A 记录指向服务器 IP
   - CNAME 记录（如果使用）

2. 等待 DNS 传播（通常 24-48 小时）

3. 清除本地 DNS 缓存：
```bash
# Linux
sudo systemd-resolve --flush-caches

# macOS
sudo dscacheutil -flushcache

# Windows
ipconfig /flushdns
```

### 域名解析到错误的 IP

**解决方案**:

1. 更新 DNS A 记录
2. 等待 TTL 过期
3. 如果使用 Cloudflare，检查 Proxy 状态

## 连接超时

### 请求超时

**错误信息**:
```
504 Gateway Timeout
```

**原因**:
- PHP 脚本执行时间过长
- 数据库查询慢
- 外部 API 调用超时

**解决方案**:

1. 增加 Nginx 超时设置：
```nginx
# /etc/nginx/sites-available/v2board
server {
    # ...

    fastcgi_connect_timeout 300;
    fastcgi_send_timeout 300;
    fastcgi_read_timeout 300;
}
```

2. 增加 PHP 超时设置：
```ini
# /etc/php/8.1/fpm/php.ini
max_execution_time = 300
```

3. 优化慢查询（参考性能优化章节）

4. 重启服务：
```bash
systemctl restart php8.1-fpm
systemctl reload nginx
```

### 数据库连接超时

**错误信息**:
```
SQLSTATE[HY000] [2002] Connection timed out
```

**解决方案**:

1. 检查 MySQL 是否运行：
```bash
systemctl status mysql
```

2. 检查网络连接：
```bash
# 测试连接
telnet 127.0.0.1 3306
```

3. 增加连接超时时间：
```env
# .env
DB_TIMEOUT=30
```

## CDN 相关问题

### Cloudflare 缓存问题

**问题**: 更新后内容没有变化

**解决方案**:

1. 清除 Cloudflare 缓存：
   - 登录 Cloudflare
   - 进入网站管理
   - Caching > Purge Cache

2. 设置缓存规则：
```nginx
# 后台管理页面不缓存
location /admin {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

3. 使用 Page Rules 排除动态页面

### Cloudflare 525 错误

**错误信息**:
```
Error 525: SSL handshake failed
```

**解决方案**:

1. 在 Cloudflare 设置中：
   - SSL/TLS > Overview
   - 将模式改为 "Full" 或 "Full (strict)"

2. 确保服务器有有效的 SSL 证书

## 节点连接问题

### 节点无法连接

**诊断**:

1. 检查节点服务状态
2. 检查端口是否开放
3. 检查防火墙规则
4. 测试网络连通性：
```bash
# 测试端口
telnet node-ip port

# 或使用 nc
nc -zv node-ip port
```

**解决方案**:

1. 确保节点服务运行正常
2. 开放必要的端口
3. 检查安全组/防火墙规则
4. 验证节点配置正确

### 节点速度慢

**可能原因**:
- 带宽限制
- 线路拥堵
- 节点负载过高

**解决方案**:

1. 检查带宽使用：
```bash
# 安装 vnstat
apt install vnstat -y
vnstat -i eth0

# 实时监控
iftop
```

2. 负载均衡：
   - 添加更多节点
   - 分配用户到不同节点

3. 优化路由和 TCP 参数：
```bash
# /etc/sysctl.conf
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_congestion_control = bbr

# 应用设置
sysctl -p
```

## API 调用问题

### 外部 API 无法访问

**错误信息**:
```
cURL error 28: Connection timed out
```

**诊断**:

```bash
# 测试外部连接
curl -I https://api.example.com

# 检查 DNS
nslookup api.example.com
```

**解决方案**:

1. 检查服务器是否可以访问外网
2. 检查防火墙出站规则
3. 配置代理（如果需要）：
```env
# .env
HTTP_PROXY=http://proxy:port
HTTPS_PROXY=http://proxy:port
```

## 网络监控

### 实时监控工具

```bash
# 网络流量监控
iftop

# 网络连接监控
nethogs

# 端口扫描
nmap localhost
```

### 日志分析

```bash
# Nginx 访问日志
tail -f /var/log/nginx/access.log

# 统计访问最多的 IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 统计访问最多的页面
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

## DDoS 防护

### 基础防护

1. 使用 Cloudflare CDN
2. 启用 Cloudflare 的 DDoS 防护
3. 配置速率限制：

```nginx
# Nginx 限速配置
http {
    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;

    server {
        location / {
            limit_req zone=one burst=20;
        }
    }
}
```

### fail2ban 配置

```bash
# 安装
apt install fail2ban -y

# 配置 Nginx 保护
cat > /etc/fail2ban/jail.local <<EOF
[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
EOF

# 启动
systemctl enable fail2ban
systemctl start fail2ban
```

## 网络检查清单

遇到网络问题时检查：

- [ ] 服务器在线
- [ ] Web 服务运行正常
- [ ] 防火墙规则正确
- [ ] 云服务商安全组已配置
- [ ] DNS 解析正确
- [ ] SSL 证书有效
- [ ] 端口正常监听
- [ ] 网络连接正常
- [ ] CDN 配置正确（如使用）

## 常用诊断命令

```bash
# 网络连通性
ping host
traceroute host

# DNS 查询
nslookup domain
dig domain

# 端口测试
telnet host port
nc -zv host port

# HTTP 测试
curl -I https://domain.com

# 查看监听端口
netstat -tlnp
ss -tlnp

# 查看连接状态
netstat -an | grep ESTABLISHED

# 查看路由
ip route
route -n
```
