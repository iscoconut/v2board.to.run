# 故障排除

本章节收录 V2Board 运行过程中常见的问题和解决方案。

## 问题分类

### 安装相关
- [安装问题](/troubleshooting/installation) - 安装过程中遇到的各种错误

### 数据库相关
- [数据库问题](/troubleshooting/database) - 数据库连接、迁移等问题

### 性能相关
- [性能问题](/troubleshooting/performance) - 速度慢、内存占用高等问题

### 网络相关
- [网络问题](/troubleshooting/network) - 连接超时、无法访问等问题

### 权限相关
- [权限问题](/troubleshooting/permissions) - 文件权限、目录权限等问题

## 快速诊断

### 1. 检查服务状态

```bash
# 检查 Nginx
systemctl status nginx

# 检查 PHP-FPM
systemctl status php8.1-fpm

# 检查 MySQL
systemctl status mysql

# 检查 Redis
systemctl status redis

# 检查 Supervisor
systemctl status supervisor
```

### 2. 查看日志

```bash
# Laravel 应用日志
tail -f /var/www/v2board/storage/logs/laravel.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log

# PHP-FPM 日志
tail -f /var/log/php8.1-fpm.log

# MySQL 错误日志
tail -f /var/log/mysql/error.log
```

### 3. 检查磁盘空间

```bash
df -h
```

### 4. 检查内存使用

```bash
free -h
```

### 5. 检查进程

```bash
# 查看队列进程
supervisorctl status

# 查看 PHP 进程
ps aux | grep php
```

## 常见错误代码

### HTTP 500 错误
- 服务器内部错误
- 查看 Laravel 日志找出具体原因
- 检查文件权限
- 检查 .env 配置

### HTTP 502 错误
- PHP-FPM 未运行或崩溃
- 检查 PHP-FPM 服务状态
- 检查 Nginx 配置中的 PHP-FPM socket 路径

### HTTP 504 错误
- 网关超时
- PHP 执行时间过长
- 增加 Nginx 和 PHP-FPM 的超时设置

## 排查流程

遇到问题时，建议按以下流程排查：

1. **确认问题现象** - 准确描述问题
2. **查看日志** - 检查相关日志文件
3. **检查服务** - 确认所有服务正常运行
4. **测试连接** - 测试数据库、Redis 等连接
5. **验证配置** - 检查配置文件是否正确
6. **重启服务** - 尝试重启相关服务
7. **搜索文档** - 在本文档中搜索相关问题
8. **寻求帮助** - 在社区或 GitHub 提问

## 获取帮助

如果本文档无法解决您的问题：

1. 在 GitHub 仓库搜索 Issues
2. 提交新的 Issue，包含：
   - 详细的问题描述
   - 错误日志
   - 系统环境信息
   - 已尝试的解决方法
3. 加入官方社区讨论

## 预防措施

为避免常见问题：

- 定期更新系统和软件
- 定期备份数据
- 监控服务器资源使用
- 启用日志记录
- 定期检查日志
- 保持合理的服务器配置
