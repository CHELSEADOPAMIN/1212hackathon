# 端到端 AI 视频面试系统开发方案 (End-to-End AI Video Interview)

本方案旨在实现一个高度标准化的 AI 代理面试流程，利用 Gemini 2.5 Native Audio 的低延迟语音能力进行提问，同时通过浏览器录制全过程并反馈给 HR。

## 1. 数据库架构变更 (Database Schema) 

我们需要一个新的 Collection `interviews` 来追踪面试流程。

**文件**: `src/lib/db/models.ts`

```typescript
export interface IInterview extends Document {
  candidateId: Schema.Types.ObjectId;
  jobId: Schema.Types.ObjectId; // 关联岗位
  status: 'pending' | 'completed' | 'expired';
  questions: string[];          // HR 预设的问题列表
  videoUrl?: string;            // 录制完成后的视频地址
  aiFeedback?: string;          // (可选) AI 对面试的简要文字总结
  createdAt: Date;
}
```

## 2. 详细开发步骤 (Step-by-Step Implementation)

### 阶段一：后端与数据层 (Backend Foundation)
1.  **更新 Models**: 在 `src/lib/db/models.ts` 中添加 `Interview` Schema。
2.  **创建 API**:
    *   `POST /api/interview/create`: 用于 HR 创建面试邀请 (接收 candidateId, questions)。
    *   `GET /api/interview/[id]`: 用于候选人页面获取面试信息 (问题列表不直接给前端显示，而是给 AI 用，但为了安全可只返回基本信息)。
    *   `POST /api/interview/[id]/complete`: 上传视频 URL 并更新状态。

### 阶段二：HR 端 - 发起面试 (Company UI - Setup)
**文件**: `src/app/company/tracker/page.tsx`
1.  **改造 "Setup AI Interview" Dialog**:
    *   从原本的静态展示改为包含一个 `Textarea` 或 `List Input`。
    *   允许 HR 编辑默认生成的 3 个问题。
    *   点击 "Send Invite" 时，调用 `POST /api/interview/create`。
    *   生成并显示（或模拟发送）面试链接: `http://localhost:3000/interview/{interview_id}`。

### 阶段三：候选人端 - AI 面试间 (Candidate UI - The Room)
**文件**: `src/app/interview/[id]/page.tsx` (新建)
1.  **权限检查**: 校验 Interview ID 是否有效且状态为 `pending`。
2.  **硬件检测**: 检查 麦克风 + 摄像头 权限。
3.  **连接 Gemini (WebSocket)**:
    *   **Prompt**: 使用 "Strict Mode" Prompt，将 DB 中的 `questions` 注入进去。
    *   **Audio Handling**: 建立 Web Audio Context，处理双向流。
4.  **录制 (MediaRecorder)**:
    *   使用 `AudioContext` 创建一个 `MediaStreamDestination`。
    *   将 `User Mic Stream` 和 `Gemini Audio Output` 混合输入到该 Destination。
    *   将 `User Camera Stream` 和 `Mixed Audio` 组合成最终的录制流。
5.  **结束上传**:
    *   面试结束 (Gemini 发送结束信号 或 用户手动点击) -> 停止录制。
    *   上传 Blob 到服务器 (MVP 阶段可存为本地文件或 Mock URL)。

### 阶段四：HR 端 - 结果审阅 (Company UI - Review)
**文件**: `src/app/company/tracker/page.tsx` (Interviews Tab)
1.  **视频播放**:
    *   在 "Interview Review" tab 中，获取状态为 `completed` 的面试记录。
    *   点击卡片弹出的播放器，加载 `videoUrl`。

---

## 3. Gemini "Strict Mode" Prompt 设计

这是本方案的核心，确保 AI 不乱说话。

```text
system_instruction: {
  role: "system",
  content: `
    你是一个完全自动化的面试提问器。你代表 HR 面试候选人。
    
    【绝对指令】
    1. 你没有“思考”或“追问”的权限。你的工作就是朗读问题。
    2. 严格按照下方的 [QUESTIONS] 列表顺序提问。
    3. 只要检测到用户回答结束（长时间停顿），就回复简单的确认语（如“好的”），然后立即读下一题。
    4. 问完最后一题后，说“面试结束，谢谢”，然后发送 terminate 信号。

    [QUESTIONS]
    ${questions.join('\n')}
  `
}
```

## 4. 技术栈补充
*   **录制**: `MediaRecorder` API (浏览器原生)。
*   **格式**: WebM (Chrome/Firefox 默认)，兼容性好。
*   **上传**: 使用 `FormData` 传输 Blob。

## 5. 任务清单 (To-Dos)
我们将按以下顺序执行：
1.  Define DB Schema.
2.  Implement "Create Interview" API.
3.  Update HR Tracker UI to connect with API.
4.  Create Interview Room Page (UI only).
5.  Implement Gemini WebSocket Logic (with Native Audio).
6.  Implement Recording Logic.
7.  Connect Recording Upload.
8.  Update HR Review UI.
