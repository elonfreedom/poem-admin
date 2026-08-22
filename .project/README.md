# .project

项目专属文档池，与上游 `docs/` 目录独立，存放本项目自己的需求和规划文档。

## 目录结构
```
.project/
├── README.md           ← 本文件
├── docs/               ← 需求文档
│   └── requirements.md ← 后台管理系统需求文档
└── planning/           ← 实施规划
    └── frontend-plan.md ← 前端实现计划
```

## 约定
- `docs/`：存放需求、设计、接口约定等文档
- `planning/`：存放实施计划、技术方案、进度记录
- 此目录与上游 `docs/` 完全独立，merge 上游时不受影响
