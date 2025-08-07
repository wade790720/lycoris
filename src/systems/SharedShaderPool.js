// 共享Shader池 - 避免重複創建相同shader，大幅降低GPU記憶體使用
class SharedShaderPool {
  constructor() {
    this.shaders = new Map(); // shaderKey -> { shader, refCount, lastUsed, vertSource, fragSource }
    this.maxPoolSize = 20;    // 最大緩存shader數量
    this.cleanupInterval = 45000; // 45秒清理周期
    this.maxIdleTime = 120000;    // 2分鐘無使用自動回收
    
    this.stats = {
      created: 0,
      reused: 0,
      disposed: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.startCleanupTimer();
  }

  // 生成shader唯一標識
  generateShaderKey(vertexSource, fragmentSource) {
    // 簡化的hash算法，適用於shader源碼
    const hash = (str) => {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
      }
      return hash >>> 0; // 轉為無符號32位整數
    };
    
    const vertHash = hash(vertexSource.trim());
    const fragHash = hash(fragmentSource.trim());
    return `${vertHash}_${fragHash}`;
  }

  // 獲取或創建shader
  acquireShader(vertexSource, fragmentSource, context = null) {
    const shaderKey = this.generateShaderKey(vertexSource, fragmentSource);
    
    // 檢查緩存
    if (this.shaders.has(shaderKey)) {
      const entry = this.shaders.get(shaderKey);
      entry.refCount++;
      entry.lastUsed = Date.now();
      this.stats.reused++;
      this.stats.cacheHits++;
      
      console.log(`[SHADER] Reusing cached shader: ${shaderKey.substring(0, 8)}... (refs: ${entry.refCount})`);
      return entry.shader;
    }

    // 檢查池大小限制
    if (this.shaders.size >= this.maxPoolSize) {
      this.performLRUEviction();
    }

    // 創建新shader
    let shader;
    try {
      if (context && context.createShader) {
        shader = context.createShader(vertexSource, fragmentSource);
      } else if (typeof createShader !== 'undefined') {
        shader = createShader(vertexSource, fragmentSource);
      } else {
        console.error('[SHADER] No shader creation context available');
        return null;
      }

      // 緩存新shader
      this.shaders.set(shaderKey, {
        shader,
        refCount: 1,
        lastUsed: Date.now(),
        vertSource: vertexSource,
        fragSource: fragmentSource,
        createdAt: Date.now()
      });

      this.stats.created++;
      this.stats.cacheMisses++;
      
      console.log(`[SHADER] Created new shader: ${shaderKey.substring(0, 8)}... (total: ${this.shaders.size})`);
      return shader;
      
    } catch (error) {
      console.error('[SHADER] Failed to create shader:', error);
      return null;
    }
  }

  // 釋放shader引用
  releaseShader(shader) {
    for (const [key, entry] of this.shaders.entries()) {
      if (entry.shader === shader) {
        entry.refCount = Math.max(0, entry.refCount - 1);
        entry.lastUsed = Date.now();
        
        console.log(`[SHADER] Released shader: ${key.substring(0, 8)}... (refs: ${entry.refCount})`);
        
        // 如果無引用，標記可清理
        if (entry.refCount === 0) {
          entry.canCleanup = true;
        }
        
        return true;
      }
    }
    
    console.warn('[SHADER] Shader not found in pool for release');
    return false;
  }

  // LRU驅逐策略
  performLRUEviction() {
    // 找出最久未使用且無引用的shader
    let oldestEntry = null;
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.shaders.entries()) {
      if (entry.refCount === 0 && entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestEntry = entry;
        oldestKey = key;
      }
    }

    // 驅逐最舊的shader
    if (oldestKey && oldestEntry) {
      this.disposeShader(oldestKey, oldestEntry);
      console.log(`[SHADER] LRU evicted shader: ${oldestKey.substring(0, 8)}...`);
    }
  }

  // 定期清理無引用shader
  performCleanup() {
    const now = Date.now();
    const toRemove = [];

    for (const [key, entry] of this.shaders.entries()) {
      // 清理條件：無引用 + 超過閒置時間 + 被標記可清理
      if (entry.refCount === 0 && 
          entry.canCleanup && 
          (now - entry.lastUsed) > this.maxIdleTime) {
        toRemove.push({ key, entry });
      }
    }

    // 批量清理
    toRemove.forEach(({ key, entry }) => {
      this.disposeShader(key, entry);
    });

    if (toRemove.length > 0) {
      console.log(`[SHADER] Cleanup removed ${toRemove.length} unused shaders`);
    }
  }

  // 銷毀單個shader
  disposeShader(key, entry) {
    try {
      if (entry.shader && typeof entry.shader.remove === 'function') {
        entry.shader.remove();
      }
      this.shaders.delete(key);
      this.stats.disposed++;
    } catch (error) {
      console.error('[SHADER] Error disposing shader:', error);
    }
  }

  // 啟動清理定時器
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.cleanupInterval);
  }

  // 獲取池統計信息
  getStats() {
    const poolStats = {};
    let totalRefs = 0;
    let activeShaders = 0;
    let idleShaders = 0;

    for (const [key, entry] of this.shaders.entries()) {
      totalRefs += entry.refCount;
      if (entry.refCount > 0) {
        activeShaders++;
      } else {
        idleShaders++;
      }

      // 提供前8位key作為識別
      const shortKey = key.substring(0, 8);
      poolStats[shortKey] = {
        refs: entry.refCount,
        lastUsed: entry.lastUsed,
        age: Date.now() - entry.createdAt
      };
    }

    return {
      ...this.stats,
      poolSize: this.shaders.size,
      totalReferences: totalRefs,
      activeShaders,
      idleShaders,
      hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0,
      shaders: poolStats
    };
  }

  // 強制清理所有shader
  dispose() {
    console.log('[SHADER] SharedShaderPool disposing...');
    
    // 停止清理定時器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // 清理所有shader
    for (const [key, entry] of this.shaders.entries()) {
      try {
        if (entry.shader && typeof entry.shader.remove === 'function') {
          entry.shader.remove();
        }
      } catch (error) {
        console.error(`[SHADER] Error disposing shader ${key}:`, error);
      }
    }

    const disposedCount = this.shaders.size;
    this.shaders.clear();
    this.stats.disposed += disposedCount;

    console.log(`[SHADER] SharedShaderPool disposed: ${disposedCount} shaders cleaned`);
  }

  // 調試方法：列出所有shader
  debugListShaders() {
    console.log('[SHADER] Current shader pool:');
    for (const [key, entry] of this.shaders.entries()) {
      console.log(`  ${key.substring(0, 12)}...: refs=${entry.refCount}, age=${(Date.now() - entry.createdAt)/1000}s`);
    }
  }

  // 緊急清理：釋放所有無引用shader
  emergencyCleanup() {
    const toRemove = [];
    for (const [key, entry] of this.shaders.entries()) {
      if (entry.refCount === 0) {
        toRemove.push({ key, entry });
      }
    }

    toRemove.forEach(({ key, entry }) => {
      this.disposeShader(key, entry);
    });

    console.log(`[SHADER] Emergency cleanup: ${toRemove.length} shaders removed`);
    return toRemove.length;
  }
}

// 全域共享shader池實例
let sharedShaderPool = null;

// 初始化函數
function initializeSharedShaderPool() {
  if (!sharedShaderPool) {
    sharedShaderPool = new SharedShaderPool();
  }
  return sharedShaderPool;
}

// 獲取全域shader池
function getSharedShaderPool() {
  return sharedShaderPool || initializeSharedShaderPool();
}

// 便捷函數：獲取shader
function acquireSharedShader(vertexSource, fragmentSource, context = null) {
  const pool = getSharedShaderPool();
  return pool.acquireShader(vertexSource, fragmentSource, context);
}

// 便捷函數：釋放shader
function releaseSharedShader(shader) {
  const pool = getSharedShaderPool();
  return pool.releaseShader(shader);
}

// 模組導出
createModuleExports(SharedShaderPool, {
  initializeSharedShaderPool,
  getSharedShaderPool,
  acquireSharedShader,
  releaseSharedShader
}, 'SharedShaderPool');