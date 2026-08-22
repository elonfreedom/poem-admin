# 后台管理系统需求文档

## 产品定位
诗歌应用的后台管理系统（Admin），为内容运营人员提供诗歌内容管理、数据统计和系统配置功能。

## 目标用户
- **管理员**：负责诗歌内容管理、用户管理、系统配置
- **运营人员**：查看数据统计分析

## 角色权限
| 角色 | 权限 |
|-----|------|
| admin | 所有功能 + 后台管理 |
| user | 仅用户端功能（无后台权限） |

## 功能架构
```
后台管理
├── 诗歌管理
│   ├── 诗歌 CRUD
│   ├── 状态管理（草稿/发布/归档）
│   ├── 分类管理
│   └── 标签管理
├── 数据统计
│   ├── 总览数据
│   ├── 每日统计
│   ├── 热门诗歌
│   └── 用户增长
└── 系统配置
    ├── Banner 管理
    ├── 公告管理
    └── 系统参数配置
```

## 功能清单
| 模块 | 功能 | 优先级 |
|-----|------|--------|
| 诗歌管理 | 诗歌 CRUD | P0 |
| 诗歌管理 | 状态管理 | P0 |
| 诗歌管理 | 分类 CRUD | P0 |
| 诗歌管理 | 标签 CRUD | P1 |
| 数据统计 | 总览数据 | P0 |
| 数据统计 | 每日统计 | P1 |
| 数据统计 | 热门诗歌 | P1 |
| 数据统计 | 用户增长 | P1 |
| 系统配置 | Banner 管理 | P0 |
| 系统配置 | 公告管理 | P0 |
| 系统配置 | 系统参数配置 | P1 |

---

## 一、诗歌管理

### 1. 诗歌管理

#### 诗歌列表
- 分页展示所有诗歌
- 支持筛选：关键词（标题、作者）、分类、状态、创建时间范围
- 列表信息：ID、标题、作者、分类、状态、创建人、创建时间

#### 创建诗歌
| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| title | string | 是 | 标题（max 100） |
| author | string | 是 | 作者（max 50） |
| dynasty | string | 否 | 朝代 |
| content | string | 是 | 诗歌内容 |
| translation | string | 否 | 翻译 |
| appreciation | string | 否 | 赏析 |
| category_id | int | 否 | 分类 ID |
| tags | []string | 否 | 标签列表 |
| cover_url | string | 否 | 封面图 |
| status | string | 是 | draft/published/archived |

#### 编辑诗歌
- 可修改所有字段
- 可修改状态（草稿↔发布↔归档）

#### 删除诗歌
- 软删除，标记删除状态
- 已发布诗歌删除后用户端不可见

#### 批量导入诗歌
- 支持 JSON 格式文件上传
- 导入前预览解析结果，展示每首诗的字段完整性
- 预览时标注校验失败的记录（如缺少必填字段）
- 用户确认后提交导入，返回导入结果统计

**导入 JSON 格式：**
```json
[
  {
    "title": "静夜思",
    "author": "李白",
    "dynasty": "唐",
    "content": "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
    "translation": "明亮的月光洒在床前的窗户纸上...",
    "appreciation": "这首诗写的是在寂静的月夜思念家乡的感受...",
    "category_id": 1,
    "tags": ["思乡", "月亮"],
    "cover_url": "",
    "status": "draft"
  }
]
```

**预览展示字段：**
- 序号（行号）
- 标题
- 作者
- 朝代
- 内容（截断预览）
- 分类
- 状态
- 校验状态（通过/失败原因）

**导入接口响应：**
```json
{
  "code": 0,
  "data": {
    "total": 10,
    "success": 8,
    "failed": 2,
    "errors": [
      { "index": 3, "title": "xxx", "error": "缺少必填字段：author" },
      { "index": 7, "title": "yyy", "error": "内容不能为空" }
    ]
  },
  "message": "ok"
}
```

### 2. 分类管理
- 管理诗歌分类（如唐诗、宋词、元曲）
- 分类名称唯一
- 可设置排序值（sort）
- 删除分类前需确认无诗歌关联

### 3. 标签管理
- 管理诗歌标签（如思乡、爱国、爱情）
- 标签名称唯一
- 可关联多个诗歌
- 删除标签不影响诗歌

### 状态流转
```
草稿(draft) → 发布(published) → 归档(archived)
    ↑              ↓
    └──────────────┘
```

---

## 二、数据统计

### 1. 总览数据
| 指标 | 说明 |
|-----|------|
| 总用户数 | 注册用户总数 |
| 总诗歌数 | 诗歌总数 |
| 总浏览量 | 诗歌浏览总次数 |
| 今日活跃 | 今日活跃用户数 |
| 今日打卡 | 今日打卡用户数 |

### 2. 每日统计
- 参数：start_date、end_date（默认今天）
- 数据项：日期、新增用户、活跃用户、浏览量、打卡数

### 3. 热门诗歌
- 按浏览量降序排列
- 默认展示前 20 名
- 支持指定日期范围

### 4. 用户增长
- 按天统计新增用户
- 支持指定日期范围
- 展示累计用户数

---

## 三、系统配置

### 1. Banner 管理
| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| title | string | 是 | 标题 |
| image_url | string | 是 | 图片地址 |
| link_type | string | 是 | poem（诗歌）/url（外链） |
| link_value | string | 是 | 诗歌ID 或 URL |
| sort | int | 否 | 排序值（升序） |
| status | string | 是 | active/inactive |

- 最多启用 5 个 Banner
- 前台按 sort 升序展示启用的 Banner

### 2. 公告管理
| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| title | string | 是 | 公告标题 |
| content | string | 是 | 公告内容 |
| status | string | 是 | draft/published |

### 3. 系统参数配置
| Key | 说明 | 默认值 |
|-----|------|--------|
| daily_poem_id | 每日推荐诗歌 ID | 无 |
| app_version | 当前 App 版本 | 1.0.0 |
| min_version | 最低支持版本 | 1.0.0 |
| force_update | 是否强制更新 | false |

---

## 四、API 接口汇总

### 认证
| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | /api/admin/auth/login | 登录（公开） |
| GET | /api/admin/user/info | 用户信息（需 JWT） |
| GET | /api/admin/auth/codes | 权限码（需 JWT） |
| POST | /api/admin/auth/logout | 退出（需 JWT） |

### 诗歌管理
| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/admin/poems | 诗歌列表（分页、筛选） |
| POST | /api/admin/poems | 创建诗歌 |
| GET | /api/admin/poems/:id | 诗歌详情 |
| PUT | /api/admin/poems/:id | 更新诗歌 |
| DELETE | /api/admin/poems/:id | 删除诗歌 |
| PUT | /api/admin/poems/:id/status | 更新状态 |
| POST | /api/admin/poems/import | 批量导入诗歌（JSON） |

### 分类管理
| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/admin/categories | 分类列表 |
| POST | /api/admin/categories | 创建分类 |
| PUT | /api/admin/categories/:id | 更新分类 |
| DELETE | /api/admin/categories/:id | 删除分类 |

### 标签管理
| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/admin/tags | 标签列表 |
| POST | /api/admin/tags | 创建标签 |
| DELETE | /api/admin/tags/:id | 删除标签 |

### 数据统计
| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/admin/stats/overview | 总览数据 |
| GET | /api/admin/stats/daily | 每日统计 |
| GET | /api/admin/stats/poems/hot | 热门诗歌 |
| GET | /api/admin/stats/users/growth | 用户增长 |

### Banner 管理
| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/admin/banners | Banner 列表 |
| POST | /api/admin/banners | 创建 Banner |
| PUT | /api/admin/banners/:id | 更新 Banner |
| DELETE | /api/admin/banners/:id | 删除 Banner |

### 公告管理
| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/admin/announcements | 公告列表 |
| POST | /api/admin/announcements | 创建公告 |
| PUT | /api/admin/announcements/:id | 更新公告 |
| DELETE | /api/admin/announcements/:id | 删除公告 |

### 系统配置
| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/admin/config | 获取配置列表 |
| GET | /api/admin/config/:key | 获取单个配置 |
| PUT | /api/admin/config | 更新配置 |

---

## 五、接口规范

### 请求头
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### 分页参数
| 参数 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大 100） |

### 响应格式
```json
{
    "code": 0,
    "message": "ok",
    "error": "错误描述",
    "data": {}
}
```

### 登录测试账号
- 邮箱：admin@xiaoshi.app
- 密码：admin123456
