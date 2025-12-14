# 垃圾注册账户清理指南

## 概述

本指南用于清理 V2Board 中的批量垃圾注册账户，这些账户通常具有以下特征：
- 随机字符前缀的邮箱（如 `xYz123Ab@163.com`）
- 无余额、无订阅、无流量使用
- 无订单、无工单记录

::: warning 警告
执行删除操作前，请务必：
1. **备份数据库**
2. **仔细抽样检查待删除账户**
3. **在维护时段进行操作**
:::

## 清理流程

### 第一步：统计可疑账户数量（预估）

```sql
SELECT COUNT(*) as total
FROM v2_user
WHERE
    balance = 0
    AND commission_balance = 0
    AND (plan_id IS NULL OR plan_id = 0)
    AND u = 0
    AND d = 0
    AND transfer_enable = 0
    AND (invite_user_id IS NULL OR invite_user_id = 0)
    AND telegram_id IS NULL;
```

### 第二步：创建临时候选表

```sql
CREATE TABLE tmp_spam_candidates (
    user_id INT PRIMARY KEY
) ENGINE=InnoDB;
```

### 第三步：分批导入候选ID

首次导入（50万条）：

```sql
INSERT INTO tmp_spam_candidates (user_id)
SELECT id FROM v2_user
WHERE
    balance = 0
    AND commission_balance = 0
    AND (plan_id IS NULL OR plan_id = 0)
    AND u = 0
    AND d = 0
    AND transfer_enable = 0
    AND (invite_user_id IS NULL OR invite_user_id = 0)
    AND telegram_id IS NULL
LIMIT 500000;
```

后续批量导入（重复执行直到 0 rows inserted）：

```sql
INSERT IGNORE INTO tmp_spam_candidates (user_id)
SELECT id FROM v2_user
WHERE
    balance = 0
    AND commission_balance = 0
    AND (plan_id IS NULL OR plan_id = 0)
    AND u = 0
    AND d = 0
    AND transfer_enable = 0
    AND (invite_user_id IS NULL OR invite_user_id = 0)
    AND telegram_id IS NULL
LIMIT 6000000;
```

### 第四步：排除有价值用户

依次执行以下三条 SQL：

```sql
-- 排除有订单的用户
DELETE c FROM tmp_spam_candidates c
INNER JOIN v2_order o ON c.user_id = o.user_id;

-- 排除有工单的用户
DELETE c FROM tmp_spam_candidates c
INNER JOIN v2_ticket t ON c.user_id = t.user_id;

-- 排除邀请过别人的用户
DELETE c FROM tmp_spam_candidates c
INNER JOIN v2_user u ON c.user_id = u.invite_user_id;
```

### 第五步：确认待删除数量

```sql
SELECT COUNT(*) as remaining FROM tmp_spam_candidates;
```

### 第六步：抽样检查（重要！）

```sql
SELECT u.id, u.email, u.created_at, u.balance, u.plan_id
FROM v2_user u
INNER JOIN tmp_spam_candidates c ON u.id = c.user_id
ORDER BY u.id DESC
LIMIT 30;
```

::: danger 重要
**人工确认邮箱都是垃圾注册后再继续！**

检查要点：
- 邮箱格式是否异常
- 注册时间是否集中
- 是否有正常用户被误判
:::

### 第七步：执行删除

一次性删除（适用于服务器性能较好的情况）：

```sql
DELETE u FROM v2_user u
INNER JOIN tmp_spam_candidates c ON u.id = c.user_id;
```

如果超时，按 ID 范围分批删除：

```sql
-- 第1批
DELETE FROM v2_user
WHERE id >= 0 AND id < 1000000
AND id IN (SELECT user_id FROM tmp_spam_candidates);

-- 第2批
DELETE FROM v2_user
WHERE id >= 1000000 AND id < 2000000
AND id IN (SELECT user_id FROM tmp_spam_candidates);

-- 第3批
DELETE FROM v2_user
WHERE id >= 2000000 AND id < 3000000
AND id IN (SELECT user_id FROM tmp_spam_candidates);

-- 以此类推...
```

::: tip 提示
如需查看 ID 范围以便分批，可以运行：
```sql
SELECT MIN(user_id) as min_id, MAX(user_id) as max_id
FROM tmp_spam_candidates;
```
:::

### 第八步：验证结果

```sql
-- 检查剩余用户数量
SELECT COUNT(*) FROM v2_user;

-- 确认没有遗漏
SELECT COUNT(*)
FROM v2_user u
INNER JOIN tmp_spam_candidates c ON u.id = c.user_id;
```

结果应该为 0。

### 第九步：清理临时表

```sql
DROP TABLE tmp_spam_candidates;
```

## 辅助命令

### 查看正在执行的查询

如果查询卡住需要取消：

```sql
SHOW PROCESSLIST;
```

### 终止某个查询

```sql
KILL [进程ID];
```

### 优化表（可选）

删除大量数据后，建议优化表：

```sql
OPTIMIZE TABLE v2_user;
```

## 筛选条件说明

本方案排除了以下用户，确保不会误删：

| 条件 | 说明 |
|------|------|
| `balance > 0` | 有余额的用户 |
| `commission_balance > 0` | 有佣金余额的用户 |
| `plan_id IS NOT NULL` | 有订阅计划的用户 |
| `u > 0 OR d > 0` | 有流量使用记录的用户 |
| `transfer_enable > 0` | 有流量额度的用户 |
| `invite_user_id IS NOT NULL` | 被邀请注册的用户 |
| `telegram_id IS NOT NULL` | 绑定了 Telegram 的用户 |
| 有订单记录 | v2_order 表有记录 |
| 有工单记录 | v2_ticket 表有记录 |
| 邀请过其他用户 | 其他用户的 invite_user_id 指向该用户 |

## 预防措施建议

清理完成后，建议增加以下注册防护：

### 1. 添加验证码

推荐使用：
- **hCaptcha** - 免费，隐私友好
- **Cloudflare Turnstile** - 完全免费，用户体验好
- **Google reCAPTCHA v3** - 无感验证

### 2. 限制注册频率

在后台配置：
- 同 IP 每小时限制注册次数（建议 3-5 次）
- 启用注册间隔限制

### 3. 邮箱验证

必须验证邮箱才能：
- 使用订阅服务
- 购买套餐
- 提交工单

### 4. 邀请码制度

考虑：
- 关闭公开注册
- 仅通过邀请码注册
- 限制每个用户可生成的邀请码数量

### 5. 可疑邮箱域名黑名单

在后台添加常见垃圾邮箱域名，如：
- 临时邮箱服务商
- 批量注册常用域名

### 6. 关闭邮箱注册（可选）

如果业务允许，只保留：
- Telegram 登录
- 其他第三方登录

## 常见问题

### Q: 删除操作会影响正在使用的服务吗？

A: 按照本指南的筛选条件，只会删除完全没有使用记录的账户，不会影响正常用户。

### Q: 删除后 ID 会不会断号？

A: 会断号，但不影响系统使用。V2Board 使用自增 ID，删除后不会重用。

### Q: 删除大量数据会影响性能吗？

A:
- 删除过程中可能会锁表，建议在维护时段操作
- 删除后建议运行 `OPTIMIZE TABLE v2_user` 优化表

### Q: 能否恢复删除的账户？

A: 不能，除非从备份恢复。所以**务必先备份数据库**！

### Q: 如何估算删除需要的时间？

A: 取决于数据量和服务器性能，百万级数据约需 10-30 分钟。建议先小批量测试。

## 相关资源

- [数据库备份与恢复](/guide/configuration#备份配置)
- [安全配置建议](/guide/configuration#安全建议)
- [数据库问题排除](/troubleshooting/database)
