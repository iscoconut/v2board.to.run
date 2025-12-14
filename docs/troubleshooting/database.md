# 数据库问题

数据库相关的常见问题和解决方案。

## 连接问题

### 无法连接到 MySQL

**错误信息**:
```
SQLSTATE[HY000] [2002] Connection refused
```

**可能原因**:
1. MySQL 服务未启动
2. 连接参数错误
3. 防火墙阻止连接

**解决方案**:

1. 检查 MySQL 服务状态：
```bash
systemctl status mysql
# 启动服务
systemctl start mysql
```

2. 验证连接信息：
```bash
# 测试连接
mysql -h 127.0.0.1 -u v2board -p

# 如果连接成功，检查 .env 配置是否一致
```

3. 检查端口：
```bash
netstat -tlnp | grep 3306
```

### Access denied 错误

**错误信息**:
```
SQLSTATE[HY000] [1045] Access denied for user 'v2board'@'localhost'
```

**解决方案**:

1. 重置数据库用户密码：
```sql
# 登录 MySQL
mysql -u root -p

# 重置密码
ALTER USER 'v2board'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

2. 检查用户权限：
```sql
SHOW GRANTS FOR 'v2board'@'localhost';

# 如果权限不足，重新授权
GRANT ALL PRIVILEGES ON v2board.* TO 'v2board'@'localhost';
FLUSH PRIVILEGES;
```

3. 更新 .env 文件：
```env
DB_PASSWORD=new_password
```

## 迁移问题

### Syntax error in migration

**错误信息**:
```
SQLSTATE[42000]: Syntax error or access violation
```

**解决方案**:

1. 检查 MySQL 版本：
```bash
mysql --version
# 确保是 5.7+ 或 8.0+
```

2. 检查数据库字符集：
```sql
SHOW VARIABLES LIKE 'character_set%';

# 如果不是 utf8mb4，修改数据库字符集
ALTER DATABASE v2board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 清空数据库重新迁移：
```bash
php artisan migrate:fresh
```

### Migration table not found

**错误信息**:
```
Base table or view not found: 1146 Table 'v2board.migrations' doesn't exist
```

**解决方案**:

创建迁移表：
```bash
php artisan migrate:install
php artisan migrate
```

### Migration already exists

**错误信息**:
```
SQLSTATE[42S01]: Base table or view already exists
```

**解决方案**:

1. 检查迁移状态：
```bash
php artisan migrate:status
```

2. 方案一：假装已迁移（如果表确实存在）
```bash
# 标记特定迁移为已完成
mysql -u v2board -p v2board
INSERT INTO migrations (migration, batch) VALUES ('2021_xx_xx_xxxxxx_create_xxx_table', 1);
```

3. 方案二：重置迁移
```bash
php artisan migrate:reset
php artisan migrate
```

## 性能问题

### 查询速度慢

**症状**:
- 页面加载缓慢
- 数据库 CPU 使用率高

**诊断**:

```bash
# 查看慢查询日志
mysql -u root -p
SHOW VARIABLES LIKE 'slow_query_log%';
SHOW VARIABLES LIKE 'long_query_time';
```

**解决方案**:

1. 启用慢查询日志：
```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

2. 添加索引：
```sql
# 查看表结构
SHOW CREATE TABLE table_name;

# 添加索引（示例）
ALTER TABLE users ADD INDEX idx_email (email);
```

3. 优化查询：
```bash
# 查看慢查询
tail -f /var/log/mysql/slow-query.log

# 使用 EXPLAIN 分析查询
mysql> EXPLAIN SELECT ...;
```

### 数据库连接数过多

**错误信息**:
```
Too many connections
```

**解决方案**:

1. 临时增加连接数：
```sql
SET GLOBAL max_connections = 200;
```

2. 永久修改（编辑 my.cnf）：
```bash
vim /etc/mysql/my.cnf

# 添加或修改
[mysqld]
max_connections = 200
```

3. 重启 MySQL：
```bash
systemctl restart mysql
```

4. 优化应用连接池：
```env
# .env 文件
DB_POOL_SIZE=10
```

## 数据问题

### 中文乱码

**症状**:
- 中文显示为 ???
- 中文无法正常保存

**解决方案**:

1. 检查数据库字符集：
```sql
SHOW VARIABLES LIKE 'character%';
```

2. 设置正确的字符集：
```sql
# 修改数据库
ALTER DATABASE v2board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 修改表
ALTER TABLE table_name CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 在 .env 中指定字符集：
```env
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
```

### 数据丢失

**预防措施**:

1. 定期备份：
```bash
# 创建备份脚本
vim /root/backup.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u v2board -p'password' v2board > /backup/v2board_$DATE.sql
# 保留最近 7 天的备份
find /backup -name "v2board_*.sql" -mtime +7 -delete

# 添加到 crontab
crontab -e
0 2 * * * /root/backup.sh
```

2. 启用二进制日志：
```bash
# 编辑 my.cnf
[mysqld]
log-bin=/var/log/mysql/mysql-bin.log
expire_logs_days=7
```

### 恢复备份

```bash
# 从 SQL 文件恢复
mysql -u v2board -p v2board < backup.sql

# 从压缩备份恢复
gunzip < backup.sql.gz | mysql -u v2board -p v2board
```

## 磁盘空间问题

### 数据库占用空间过大

**诊断**:

```sql
# 查看每个表的大小
SELECT
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'v2board'
ORDER BY (data_length + index_length) DESC;
```

**解决方案**:

1. 清理旧数据：
```sql
# 示例：删除 30 天前的日志
DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

2. 优化表：
```sql
OPTIMIZE TABLE table_name;
```

3. 清理二进制日志：
```sql
# 查看日志文件
SHOW BINARY LOGS;

# 清理旧日志（保留 7 天）
PURGE BINARY LOGS BEFORE DATE_SUB(NOW(), INTERVAL 7 DAY);
```

## 锁表问题

### 表被锁定

**错误信息**:
```
Table 'xxx' is locked
```

**解决方案**:

1. 查看锁定的表：
```sql
SHOW OPEN TABLES WHERE In_use > 0;
```

2. 查看当前进程：
```sql
SHOW PROCESSLIST;
```

3. 杀死锁表的进程：
```sql
KILL process_id;
```

## 主从复制问题

### 主从不同步

**检查状态**:

```sql
# 从库执行
SHOW SLAVE STATUS\G
```

**解决方案**:

1. 如果 Seconds_Behind_Master 过大，等待同步
2. 如果出现错误，检查错误信息
3. 跳过错误（谨慎使用）：
```sql
SET GLOBAL SQL_SLAVE_SKIP_COUNTER = 1;
START SLAVE;
```

## 维护建议

### 定期优化

创建定期维护脚本：

```bash
#!/bin/bash
# /root/db_maintenance.sh

# 优化所有表
mysqlcheck -u root -p'password' --optimize v2board

# 修复可能损坏的表
mysqlcheck -u root -p'password' --repair v2board

# 分析表
mysqlcheck -u root -p'password' --analyze v2board
```

添加到 crontab：
```bash
0 3 * * 0 /root/db_maintenance.sh
```

### 监控

使用监控工具：

```bash
# 安装 mytop（MySQL 监控工具）
apt install mytop -y

# 运行监控
mytop -u root -p password -d v2board
```

## 检查清单

遇到数据库问题时：

- [ ] MySQL 服务是否运行
- [ ] 连接信息是否正确
- [ ] 用户权限是否足够
- [ ] 字符集是否为 utf8mb4
- [ ] 磁盘空间是否充足
- [ ] 是否有慢查询
- [ ] 是否有锁表
- [ ] 最近是否有备份

## 紧急情况

### 数据库崩溃

1. 停止应用访问
2. 检查错误日志
3. 尝试修复：
```bash
mysqlcheck -u root -p --auto-repair --all-databases
```
4. 如果修复失败，从最近的备份恢复
5. 使用二进制日志恢复最新数据
