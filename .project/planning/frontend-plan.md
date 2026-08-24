# 前端实现计划

## 路由结构
```
/dashboard              → 数据统计总览（替换原 workspace）
/user                   → 用户管理
  /list                 → 用户列表
/poetry                 → 诗歌管理
  /list                 → 诗歌列表
  /create               → 创建诗歌
  /:id/edit             → 编辑诗歌
/category               → 分类管理
/tag                    → 标签管理
/statistics             → 数据统计
  /daily                → 每日统计
  /hot                  → 热门诗歌
  /growth               → 用户增长
/system                 → 系统配置
  /banner               → Banner 管理
  /announcement         → 公告管理
  /config               → 系统参数
```

## API 模块（`apps/web-antd/src/api/core/`）
| 文件 | 职责 |
|---|---|
| `auth.ts` | 登录、用户信息、权限码、退出 |
| `user.ts` | 前端用户管理（列表、详情、状态更新） |
| `poetry.ts` | 诗歌 CRUD、状态修改 |
| `category.ts` | 分类 CRUD |
| `tag.ts` | 标签 CRUD |
| `stats.ts` | 总览、每日统计、热门诗歌、用户增长 |
| `banner.ts` | Banner CRUD |
| `announcement.ts` | 公告 CRUD |
| `config.ts` | 系统配置读写 |

## 实施顺序

### 第一批 - P0（核心功能）
1. 登录页对接真实 API + 路由守卫
2. API 请求层封装（分页参数、统一错误处理已有，补充业务接口）
3. **用户管理页**（列表、筛选、禁用/启用）
4. 诗歌列表页（筛选、分页、状态展示）
5. 诗歌创建/编辑页（表单、富文本、标签选择）
6. 分类管理页
7. Dashboard 总览数据
8. Banner 管理页
9. 公告管理页

### 第二批 - P1（扩展功能）
9. 标签管理页
10. 每日统计页
11. 热门诗歌页
12. 用户增长页
13. 系统参数配置页

## 复用现有能力
- 表单 → `VbenForm`（schema 驱动）
- 表格 → `VbenTable`
- 分页 → 现有 request 拦截器
- 路由守卫 → 已有框架，补充权限判断
- 布局 → 保留现有 layout 系统
