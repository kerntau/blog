---
title: "Redis 缓存击穿、穿透与雪崩治理"
url: "redis-cache-breakthrough-breakdown-avalanche"
date: "2025-02-27"
draft: false
authors:
  - default
summary: "系统剖析高并发架构下 Redis 缓存穿透、击穿与雪崩的物理诱因，通过布隆过滤器、逻辑过期异步刷新与随机打散构建坚不可摧的多级缓存防线。"
tags:
  - "Redis"
  - "缓存架构"
  - "高并发"
  - "系统设计"
categoryId: "cat-redis-cache-breakthrough-breakdown-avalanche"
category: "后端开发"
categories:
  - "后端开发"
images:
  - "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1600&q=85"
---

# Redis 缓存击穿、穿透与雪崩治理

在以 **Redis** 为核心缓存层的高并发分布式系统中，缓存承担了 95% 以上的读流量，有效保护了后端脆弱的关系型数据库（如 MySQL / PostgreSQL）。

然而，当系统遭遇海量恶意黑客扫描、超大热点 Key 突发过期、或缓存集群大面积宕机时，流量会瞬间穿透防御层直击底层数据库，引发**数据库连接池打满、CPU 100%、服务雪崩瘫痪**。本文将针对缓存领域的三大经典灾难提供工业级完整治理方案。

---

## 一、三大缓存灾难诱因与防御策略矩阵

```mermaid
graph TD
    subgraph Penetration [1. 缓存穿透 (Penetration)]
        QueryNonExist[查询根本不存在的恶意 Key (如 id = -999)] --> RedisMiss1[Redis 缓存未命中]
        RedisMiss1 --> DBMiss1[直打 DB，DB 亦无此数据，无法回填缓存，每次请求都穿透 DB!]
    end

    subgraph Breakdown [2. 缓存击穿 (Breakdown)]
        HotKeyExpire[单个超级热点 Key (如爆款秒杀商品) 瞬间过期] --> MassiveReq[数十万 QPS 瞬间穿透到达 DB 重建缓存，拖垮 DB!]
    end

    subgraph Avalanche [3. 缓存雪崩 (Avalanche)]
        BatchExpire[大量 Key 在同一秒集体到期 或 Redis 节点宕机] --> AllToDB[全量读流量瞬间排山倒海压垮整个数据库集群!]
    end
```

| 灾难类型 | 发生场景与特征 | 危害程度 | 核心推荐治理方案 |
| :--- | :--- | :--- | :--- |
| **缓存穿透** | 查询数据库中**压根不存在**的数据（如黑客恶意扫描不存在的 ID） | 持续消耗 DB 连接与 CPU 资源 | **布隆过滤器 (Bloom Filter) 前置拦截** + **空对象短期缓存 (`setex key 30 ""`）** |
| **缓存击穿** | **单点极高并发的热点 Key** 在某一瞬间恰好缓存过期 | 瞬间数万 QPS 冲击数据库单行记录 | **互斥锁 (`SETNX`) 重建** 或 **逻辑过期 (Logical Expiration) 异步刷新** |
| **缓存雪崩** | **大量不同 Key 恰好设置了相同的过期时间**，或 Redis 全局瘫痪 | 整个数据库集群瞬间宕机 | **过期时间增加随机扰动 (Jitter)** + **本地内存二级缓存 (Caffeine) 多级分流** |

---

## 二、缓存穿透防御：Redis 布隆过滤器实战

布隆过滤器由一个长二进制位数组（Bit Array）与多个独立的哈希函数组成，具备极高的空间效率。**若布隆过滤器判定某 Key 不存在，则该 Key 100% 不存在**：

```typescript
// services/BloomFilterProtector.ts
import { Redis } from 'ioredis';

const redis = new Redis();

export class ProductCacheService {
  /**
   * 采用布隆过滤器 + 空值缓存双重防御缓存穿透
   */
  async getProductDetail(productId: string): Promise<any> {
    const cacheKey = `product:detail:${productId}`;

    // 1. 第一道防线：布隆过滤器快速预检
    // 利用 Redis 的 BF.EXISTS 命令 (RedisBloom 模块)
    const exists = await redis.send_command('BF.EXISTS', 'bf_products', productId);
    if (exists === 0) {
      console.warn(`[布隆拦截] 商品 ID ${productId} 绝不存在，直接阻断!`);
      return null;
    }

    // 2. 查询 Redis 缓存
    const cachedData = await redis.get(cacheKey);
    if (cachedData !== null) {
      if (cachedData === '__NULL_PLACEHOLDER__') return null; // 命中空值缓存
      return JSON.parse(cachedData);
    }

    // 3. 穿透至数据库查询
    const product = await db.product.findUnique({ where: { id: productId } });

    if (!product) {
      // 数据库中不存在：写入短暂的空值占位缓存 (60秒)，防止同 ID 反复穿透
      await redis.set(cacheKey, '__NULL_PLACEHOLDER__', 'EX', 60);
      return null;
    }

    // 数据库存在：正常写入缓存 (30分钟)
    await redis.set(cacheKey, JSON.stringify(product), 'EX', 1800);
    return product;
  }
}
```

---

## 三、缓存击穿防御：逻辑过期 (Logical Expiration) 异步构建

对于微博热搜、大促秒杀等超级热点，**物理上永不过期**，而在 Value JSON 中嵌入 `expireTime` 逻辑过期字段。一旦发现逻辑过期，通过分布式互斥锁仅由一个异步 Worker 刷新，其余请求直接返回旧数据（保证高可用）：

```typescript
// services/HotKeyBreakerGuard.ts
interface CacheData<T> {
  data: T;
  logicalExpireTime: number; // 毫秒时间戳
}

export async function getHotProductWithLogicalExpire<T>(
  key: string,
  dbFallback: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  const raw = await redis.get(key);
  if (!raw) {
    // 首次全空冷启动，同步回源
    const val = await dbFallback();
    const payload: CacheData<T> = { data: val, logicalExpireTime: Date.now() + ttlSeconds * 1000 };
    await redis.set(key, JSON.stringify(payload));
    return val;
  }

  const cacheObj: CacheData<T> = JSON.parse(raw);
  const isExpired = Date.now() > cacheObj.logicalExpireTime;

  if (!isExpired) {
    return cacheObj.data; // 仍在逻辑有效期内，直接返回
  }

  // 已逻辑过期：尝试获取分布式锁进行异步重建
  const lockKey = `lock:rebuild:${key}`;
  const acquired = await redis.set(lockKey, '1', 'EX', 10, 'NX');

  if (acquired === 'OK') {
    // 成功抢到锁：开启异步线程执行耗时 DB 重建，不阻塞当前响应
    (async () => {
      try {
        console.log(`[热点重建] 正在后台异步刷新缓存: ${key}`);
        const freshData = await dbFallback();
        const newPayload: CacheData<T> = {
          data: freshData,
          logicalExpireTime: Date.now() + ttlSeconds * 1000,
        };
        await redis.set(key, JSON.stringify(newPayload));
      } finally {
        await redis.del(lockKey); // 释放锁
      }
    })();
  }

  // 未抢到锁或正在重建中：直接返回旧数据 (Stale-While-Revalidate 理念)
  return cacheObj.data;
}
```

---

## 四、缓存雪崩防御：过期时间 Jitter 随机打散

为避免成千上万个 Key 在整点同时失效，设置过期时间时强制附加随机扰动偏移量：

```typescript
function getJitteredTTL(baseSeconds: number, jitterMaxSeconds = 300): number {
  const randomJitter = Math.floor(Math.random() * jitterMaxSeconds);
  return baseSeconds + randomJitter; // 例如 3600 秒基础 TTL 扩展为 3600~3900 秒随机分布
}
```
