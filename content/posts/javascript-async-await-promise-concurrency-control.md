---
title: "JavaScript 异步并发控制实战"
url: "javascript-async-await-promise-concurrency-control"
date: "2025-11-20"
draft: false
authors:
  - default
summary: "深入剖析浏览器并发请求限制与后端过载原理，手写支持最大并发限制、优先级插队、指数退避重试与 AbortController 取消的高性能异步任务调度器。"
tags:
  - "JavaScript"
  - "Promise"
  - "并发控制"
  - "性能优化"
categoryId: "cat-javascript-async-await-promise-concurrency-control"
category: "前端开发"
categories:
  - "前端开发"
images:
  - "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1600&q=85"
---

# JavaScript 异步并发控制实战

在现代前端与 Node.js 服务端开发中，批量并发处理（例如大文件分片上传、海量接口并行抓取、批量资源预加载）是常见需求。

然而，如果盲目使用 `Promise.all()` 同时发起成千上万个异步任务，极易引发严重问题：
1. **浏览器端**：受限于 HTTP/1.1 同域名下 6 个 TCP 连接限制，导致请求长时间挂起排队；
2. **服务端 / 数据库**：瞬间高并发打爆连接池或触发限流网关（HTTP 429 Too Many Requests）；
3. **内存压力**：大量未完成的 Promise 闭包滞留在 V8 堆内存中，加剧垃圾回收 GC 抖动。

实现一个具备**最大并发限制 (Concurrency Limit)**、**优先级调度 (Priority)**、**失败重试 (Retry)** 与 **动态取消 (Abort)** 的工业级异步调度器至关重要。

---

## 一、异步并发控制模型架构

```mermaid
graph TD
    Tasks[持续涌入的异步任务 (Task 1..N)] --> Queue[优先级等待队列 (Priority Task Queue)]
    Queue --> Dispatcher[调度器调度核心 (Dispatcher)]

    subgraph Pool [活跃执行池 (Active Pool, 容量 = Limit)]
        Slot1[并发槽位 1]
        Slot2[并发槽位 2]
        Slot3[并发槽位 3]
    end

    Dispatcher -->|若活跃数 < Limit 且队列非空| Pool
    Pool -->|任务执行完毕释放槽位| Dispatcher
    Dispatcher --> Result[返回 Promise 解析结果]
```

---

## 二、生产级并发调度器核心实现

以下是一个功能完整、具备强类型提示的 `AsyncConcurrencyPool` 调度器：

```typescript
// utils/AsyncConcurrencyPool.ts

export interface TaskOptions {
  priority?: number; // 优先级：数字越大越优先执行
  retries?: number; // 失败重试次数
  retryDelayMs?: number; // 重试基础延迟时间
  signal?: AbortSignal; // 支持外部取消
}

type TaskFunction<T> = (signal?: AbortSignal) => Promise<T>;

interface QueueItem<T> {
  fn: TaskFunction<T>;
  options: TaskOptions;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export class AsyncConcurrencyPool {
  private concurrency: number;
  private runningCount = 0;
  private queue: QueueItem<any>[] = [];

  constructor(concurrency = 5) {
    if (concurrency < 1) throw new Error('Concurrency must be at least 1');
    this.concurrency = concurrency;
  }

  /**
   * 提交任务到并发池
   */
  public add<T>(fn: TaskFunction<T>, options: TaskOptions = {}): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const item: QueueItem<T> = {
        fn,
        options: {
          priority: 0,
          retries: 0,
          retryDelayMs: 1000,
          ...options,
        },
        resolve,
        reject,
      };

      // 快速检查外部信号是否已提前取消
      if (item.options.signal?.aborted) {
        return reject(new DOMException('Task was aborted before execution', 'AbortError'));
      }

      // 按优先级插入等待队列 (降序排队)
      const insertIndex = this.queue.findIndex(
        (queued) => (queued.options.priority ?? 0) < (item.options.priority ?? 0)
      );

      if (insertIndex === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(insertIndex, 0, item);
      }

      this.runNext();
    });
  }

  private async runNext(): Promise<void> {
    if (this.runningCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.runningCount++;

    const executeWithRetry = async (attempt = 0): Promise<any> => {
      // 检查执行期间的取消信号
      if (item.options.signal?.aborted) {
        throw new DOMException('Task aborted by caller', 'AbortError');
      }

      try {
        return await item.fn(item.options.signal);
      } catch (err) {
        const maxRetries = item.options.retries ?? 0;
        if (attempt < maxRetries && !item.options.signal?.aborted) {
          // 指数退避算法等待重试
          const delay = (item.options.retryDelayMs ?? 1000) * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          return executeWithRetry(attempt + 1);
        }
        throw err;
      }
    };

    try {
      const result = await executeWithRetry();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.runningCount--;
      // 递归触发下一个排队任务
      this.runNext();
    }
  }

  public get activeCount(): number {
    return this.runningCount;
  }

  public get pendingCount(): number {
    return this.queue.length;
  }
}
```

---

## 三、真实业务场景应用范例：批量分片上传与断点控制

```typescript
// 模拟 100 个大文件切片批量上传，控制最大并发 4，重要元数据切片优先
async function uploadFileChunks(chunks: Blob[]) {
  const pool = new AsyncConcurrencyPool(4);
  const controller = new AbortController();

  const uploadPromises = chunks.map((chunk, index) => {
    // 假设索引 0 的分片包含文件 Meta 信息，赋予最高优先级 10
    const isMetaChunk = index === 0;

    return pool.add(
      async (signal) => {
        const formData = new FormData();
        formData.append('chunkIndex', String(index));
        formData.append('data', chunk);

        const response = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
          signal,
        });

        if (!response.ok) throw new Error(`Chunk ${index} failed with ${response.status}`);
        return response.json();
      },
      {
        priority: isMetaChunk ? 10 : 0,
        retries: 3, // 单片失败最多重试 3 次
        retryDelayMs: 500,
        signal: controller.signal,
      }
    );
  });

  try {
    const results = await Promise.all(uploadPromises);
    console.log('所有分片上传完毕，准备触发服务端合片:', results);
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn('用户主动取消了上传任务');
    } else {
      console.error('分片上传遇到不可逆故障:', err);
      // 发生严重错误时，立即中断后续所有尚未执行的网络请求
      controller.abort();
    }
  }
}
```

---

## 四、工程总结与最佳实践

1. **根据网络协议动态调节并发数**：
   - HTTP/1.1 环境下，建议单域名并发池限制在 4~6。
   - HTTP/2 / HTTP/3 环境下（已支持单个 TCP 连接全双工多路复用），并发池可提升至 16~32，但不宜过高以免触发反爬防护与 CDN 频控。
2. **结合 `AbortSignal.timeout(ms)` 防挂起**：为关键任务挂载超时控制，防止慢请求永久霸占并发槽位。
