---
title: "LLM Agent 架构设计与 LangChain 实战"
url: "llm-agent-architecture-langchain-practice"
date: "2026-05-14"
draft: false
recommend: 85
authors:
  - default
summary: "深入剖析基于大语言模型 (LLM) 的自主智能体认知架构：ReAct 循环推理范式、Function Calling 工具调度、长短期记忆系统，以及基于 LangGraph 的有向图工作流实战。"
tags:
  - "LLM"
  - "LangChain"
  - "Agent"
  - "人工智能"
categoryId: "cat-llm-agent-architecture-langchain-practice"
category: "人工智能"
categories:
  - "人工智能"
images:
  - "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=85"
---

# LLM Agent 架构设计与 LangChain 实战

大语言模型（LLM）不仅能作为对话式问答工具，更正在演进为具备**规划决策、工具调用、长期记忆与自主纠错**能力的计算引擎 —— **LLM Agent (自主智能体)**。

传统的 LLM 受到知识截止时间、无法直接感知外部世界、缺乏算数精确计算以及存在逻辑幻觉的限制。通过为模型装配外部工具集（API / 数据库 / 代码解释器），Agent 能够自主将复杂模糊的目标拆解为执行步骤，并在与真实环境的交互反馈中动态达成目标。

---

## 一、Agent 核心认知模型：ReAct 推理与行动循环

**ReAct (Reason + Act)** 是现代智能体最经典的基础推理范式：

```mermaid
graph TD
    UserGoal[用户输入复杂指令: '查询杭州明天下雨概率并根据降水推荐室外活动'] --> LLMReason[1. Thought: 思考分析当前缺失杭州未来天气数据]
    LLMReason --> LLMAct[2. Action: 决定调用 weather_api(city='Hangzhou', date='tomorrow')]
    LLMAct --> EnvExec[3. Tool Execution: 外部真实 API 返回降水概率 85%]
    EnvExec --> LLMObs[4. Observation: 智能体观察到下雨概率极高]
    LLMObs --> LLMNext[5. Thought: 确认降水极高，转为推荐室内活动如西湖博物馆]
    LLMNext --> FinalAnswer[6. Final Answer: 输出详尽规划建议]
```

---

## 二、智能体四大核心支柱体系

| 核心组件 | 技术实现与权责 | 典型应用 |
| :--- | :--- | :--- |
| **规划核心 (Planning)** | 基于思维链 (CoT) 进行目标分解、自我反思 (Self-Reflection) 与子任务排期 | Plan-and-Solve、Tree-of-Thoughts (ToT) |
| **记忆系统 (Memory)** | **短期记忆**：当前会话历史 Context Window；<br>**长期记忆**：基于向量数据库 (Vector DB) 的跨会话知识检索与用户画像沉淀 | 保持对话连贯性、召回用户历史偏好 |
| **工具箱 (Tools / Actions)** | 封装 REST API、SQL 查询器、计算器、Python 代码执行沙箱 | 赋予模型读写现实物理与数字系统的能力 |
| **执行编排 (Execution)** | 基于状态机（State Machine）或有向无环图（DAG）控制条件分支与循环 | LangGraph、AutoGPT、CrewAI |

---

## 三、基于 LangChain / LangGraph 打造多工具协同 Agent 实战

```typescript
// agent/research-agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

// 1. 初始化模型
const model = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.1, // 降低随机性，确保工具参数生成的严谨度
});

// 2. 声明具备严格 Zod Schema 校验的自定义业务工具
const stockPriceTool = new DynamicStructuredTool({
  name: 'get_stock_price',
  description: '用于实时查询指定股票代码的当前股价与涨跌幅',
  schema: z.object({
    ticker: z.string().describe('股票代码，如 AAPL, MSFT, BABA'),
  }),
  func: async ({ ticker }) => {
    // 模拟调用金融行情真实 API
    console.log(`[Tool Call] 正在查询股票代码: ${ticker}`);
    return JSON.stringify({
      ticker,
      price: 189.5,
      changePercent: '+2.3%',
      currency: 'USD',
    });
  },
});

const tools = [stockPriceTool];

// 3. 构建 Agent 核心 Prompt 模板
const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个具备严谨逻辑的金融分析 Agent。你可以自主调用外部工具获取实时数据，并给出结构化的投资分析。'],
  new MessagesPlaceholder('chat_history'),
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

// 4. 组装并启动 Agent 执行器
export async function runAgentQuery(userInput: string) {
  const agent = await createOpenAIToolsAgent({
    llm: model,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    verbose: true, // 输出完整的 Thought / Action 决策链
    maxIterations: 5, // 防止陷入死循环的最大迭代次数
  });

  const result = await executor.invoke({
    input: userInput,
    chat_history: [],
  });

  return result.output;
}
```

---

## 四、生产级 Agent 落地防线与治理

1. **结构化输出约束 (JSON Mode / Tool Schema)**：严禁依赖正则解析自由文本。必须全面采用模型原生的 **Function Calling / Structured Outputs** 确保参数解析 100% 稳定。
2. **工具执行沙箱化与权限熔断**：涉及写入、删除或金钱交易的敏感操作，必须引入 **Human-in-the-Loop (人工介入审批)** 机制，模型仅生成执行意图，必须待管理员确认后方可真正执行。
3. **死循环熔断器 (Max Step Limit)**：为 Agent 设定硬性步数上限（如 10 步），一旦超出立即抛出优雅降级提示，避免消耗过多 Token 费用。
