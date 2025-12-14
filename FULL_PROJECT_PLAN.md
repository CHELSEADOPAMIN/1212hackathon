# Lyrathon - 下一代 AI 原生招聘匹配平台与 AI 视频代面方案

## 1. 项目背景与愿景

**痛点：** 传统招聘过分依赖关键词匹配（Keyword Matching）和候选人自吹自擂的简历文本。HR 难以甄别“培训班简历”与“真实战力”，且初筛面试耗时耗力，标准难以统一。

**愿景：** Lyrathon 致力于构建一个**基于“真实代码行为”与“深度语义理解”**的 AI 招聘平台。
1.  **代码即能力**：不看你写了什么，看你 GitHub 做了什么。
2.  **AI 代面**：利用最新的 Gemini Native Audio 技术，实现“HR 制定剧本 -> AI 拟人化提问 -> 自动录像回传”的标准化面试流程。

---

## 2. 核心功能亮点 (Key Features)

### 2.1 ‘废除’简历，多维度记录真实能力
*   **原理：** 系统不再靠硬性规定的关键词筛选。用户的数据（GitHub、Blog、LinkedIn 等）被聚合存储并向量化。
*   **GitHub 分析：**
    *   **原创性判定：** 智能区分 `fork` 与实质 Commit。
    *   **画像生成：** 自动生成五维技能雷达图（如：React 架构力、后端系统设计等）。

### 2.2 双塔向量匹配引擎 (Bi-Directional Vector Matching)
*   **机制：** 将“候选人画像”与“岗位 JD”分别向量化，支持双向检索。
*   **场景：** 即使简历没写“高并发”，但 GitHub 有 Rust 异步逻辑，依然能被推荐给高性能计算岗位。

### 2.3 AI 智能代面系统 (Standardized AI Video Interview)
这是本项目的**核心创新点**，利用 **Gemini 2.5 Flash Native Audio** 技术。

*   **流程 (Workflow)**:
    1.  **HR 定义剧本**: HR 在后台为特定岗位设置问题列表（如“请自我介绍”、“解释一下 Event Loop”）。
    2.  **AI 执行**: 候选人进入面试间，Gemini 2.5 变身为语音面试官。
        *   **严格模式**: AI 严格按顺序提问，不追问、不闲聊，确保所有候选人面临完全相同的考核标准。
        *   **原生语音**: 使用 Native Audio 能力，延迟极低，语音语调高度拟人。
    3.  **全流程录制**: 浏览器端利用 `MediaRecorder` + `Web Audio API`，将**候选人画面**、**候选人声音**与**AI 声音**实时合成并录制。
    4.  **异步审阅**: 面试结束后，视频自动上传。HR 随时在后台点击播放，结合 AI 辅助分析进行打分。

---

## 3. 技术架构 (Technical Architecture)

### 3.1 核心技术栈
*   **前端框架:** Next.js 14 (App Router)
*   **UI 组件库:** Shadcn UI + Tailwind CSS
*   **数据库:** MongoDB Atlas (JSON + Vector Search)
*   **AI 模型:**
    *   **语义理解/匹配:** OpenAI GPT-4o / Embedding
    *   **语音面试:** **Gemini 2.5 Flash (Native Audio Preview)**
*   **实时通信:** WebSocket (处理 Gemini 音频流)
*   **媒体处理:** Web Audio API, MediaRecorder

### 3.2 数据库设计 (MongoDB)

#### `candidates` (候选人)
存储个人信息、GitHub 分析结果、Embedding 向量。

#### `jobs` (岗位)
存储 JD、岗位要求、Embedding 向量。

#### `interviews` (面试记录 - **新增**)
用于追踪 AI 代面的全生命周期。
```typescript
interface IInterview {
  candidateId: ObjectId;
  jobId: ObjectId;
  status: 'pending' | 'completed';
  questions: string[];       // HR 预设的问题列表
  videoUrl?: string;         // 录制完成后的视频地址 (S3/OSS)
  aiFeedback?: string;       // AI 对回答的简要摘要
  createdAt: Date;
}
```

---

## 4. 详细业务流程 (User Flow)

### 候选人端
1.  **注册与导入**: 填写 GitHub 账号，系统自动生成能力画像。
2.  **职位匹配**: 查看 AI 推荐的高匹配度岗位。
3.  **接收面试**: 收到 HR 发起的 AI 面试邀请。
4.  **进行面试**:
    *   进入 `/interview/[id]` 页面。
    *   授予麦克风/摄像头权限。
    *   与 AI 面试官进行语音对话（AI 按剧本提问）。
    *   结束后系统自动上传视频。

### 公司端 (HR)
1.  **发布职位**: 填写 JD，系统自动向量化。
2.  **人才雷达**: 浏览系统推荐的匹配人才。
3.  **发起面试 (Process Tracker -> Interested)**:
    *   选中感兴趣的候选人。
    *   **Setup AI Interview**: 弹窗编辑/确认面试问题列表。
    *   点击发送，系统生成面试链接。
4.  **审阅结果 (Process Tracker -> Interview Review)**:
    *   查看已完成的面试卡片。
    *   点击 **播放视频**，观看 AI 面试回放。
    *   基于视频表现和 AI 辅助摘要决定是否发放 Offer。
5.  **竞价 Offer**: 输入薪资，若低于市场/竞品，系统提示调整。

---

## 5. 开发计划 (Implementation Roadmap)

1.  **后端基础**: 建立 `Interview` 模型，实现“创建面试”和“完成面试”的 API。
2.  **HR 交互**: 改造 Process Tracker 页面，支持自定义问题并发起面试邀请。
3.  **面试间开发 (核心难点)**:
    *   实现与 Gemini 2.5 的 WebSocket 音频双向流。
    *   实现 Prompt 工程（Strict Mode），确保 AI 严格读题。
    *   实现前端音视频混合录制与上传。
4.  **结果展示**: 在 HR 端实现视频回放功能。

---

## 6. 创新价值

Lyrathon 将 **“异步视频面试”** 提升到了一个新的高度。
*   传统视频面试：单向录制，对着屏幕尴尬自言自语。
*   **Lyrathon AI 面试**：双向交互，有“人”在听、在回应（虽然是脚本化的），体验更自然，且保留了标准化的公平性。
