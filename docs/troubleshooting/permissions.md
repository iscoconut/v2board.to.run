# 权限问题

文件和目录权限相关问题。

## 常见权限错误

### Permission denied

待补充...

### Storage 目录无写权限

待补充...

## 正确的权限设置

```bash
chown -R www-data:www-data /var/www/v2board
chmod -R 755 /var/www/v2board
chmod -R 775 storage bootstrap/cache
```

更多内容待补充...
