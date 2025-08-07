// 統一資源管理器 - 解決記憶體洩漏和資源優化問題
// 管理所有可復用資源：Canvas、Shader、Texture、Buffer等

class ResourceManager {
  constructor() {
    // 資源池配置
    this.config = {
      maxCanvasPoolSize: 50,     // 提升至50個(原本10個)
      maxShaderPoolSize: 20,     // 共享shader池
      maxTexturePoolSize: 30,    // 紋理緩存
      cleanupInterval: 30000,    // 30秒清理周期
      maxIdleTime: 60000        // 60秒無使用自動回收
    };

    // 資源池初始化
    this.canvasPool = new Map();           // size -> { available: [], inUse: [], lastUsed: timestamp }
    this.shaderPool = new Map();           // shaderKey -> { shader, refCount, lastUsed }
    this.texturePool = new Map();          // textureKey -> { texture, refCount, lastUsed }
    this.graphicsPool = new Map();         // size -> { available: [], inUse: [] }
    
    // 統計和監控
    this.stats = {
      canvasCreated: 0,
      canvasReused: 0,
      shaderCreated: 0,
      shaderReused: 0,
      memoryFreed: 0,
      lastCleanup: Date.now()
    };

    // 啟動定期清理
    this.startCleanupTimer();
    
  }

  // === Canvas資源池管理 ===
  acquireCanvas(width, height) {
    const size = `${width}x${height}`;
    
    if (!this.canvasPool.has(size)) {
      this.canvasPool.set(size, {
        available: [],
        inUse: [],
        lastUsed: Date.now()
      });
    }

    const pool = this.canvasPool.get(size);
    let canvas;

    if (pool.available.length > 0) {
      canvas = pool.available.pop();
      this.stats.canvasReused++;
    } else {
      canvas = this.createCanvas(width, height);
      this.stats.canvasCreated++;
    }

    pool.inUse.push({
      canvas,
      acquiredAt: Date.now(),
      id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    pool.lastUsed = Date.now();

    return canvas;
  }

  releaseCanvas(canvas) {
    if (!canvas) return false;

    // 找到對應的池
    for (const [size, pool] of this.canvasPool.entries()) {
      const inUseIndex = pool.inUse.findIndex(item => item.canvas === canvas);
      if (inUseIndex !== -1) {
        const item = pool.inUse.splice(inUseIndex, 1)[0];
        
        // 清理canvas內容但保留對象
        this.cleanCanvas(canvas);
        
        // 檢查池大小限制
        if (pool.available.length < this.config.maxCanvasPoolSize) {
          pool.available.push(canvas);
        } else {
          // 超過限制，釋放資源
          this.destroyCanvas(canvas);
        }
        
        pool.lastUsed = Date.now();
        return true;
      }
    }
    
    console.warn('[RESOURCE] Canvas not found in pool, forcing cleanup');
    this.destroyCanvas(canvas);
    return false;
  }

  // === Graphics資源池管理 ===
  acquireGraphics(width, height) {
    const size = `${width}x${height}`;
    
    if (!this.graphicsPool.has(size)) {
      this.graphicsPool.set(size, {
        available: [],
        inUse: []
      });
    }

    const pool = this.graphicsPool.get(size);
    let graphics;

    if (pool.available.length > 0) {
      graphics = pool.available.pop();
      graphics.clear(); // 清理內容但保留對象
    } else {
      graphics = createGraphics(width, height);
    }

    pool.inUse.push(graphics);
    return graphics;
  }

  releaseGraphics(graphics) {
    if (!graphics) return false;

    for (const [size, pool] of this.graphicsPool.entries()) {
      const inUseIndex = pool.inUse.indexOf(graphics);
      if (inUseIndex !== -1) {
        pool.inUse.splice(inUseIndex, 1);
        
        // 清理內容
        graphics.clear();
        graphics.background(0, 0);
        
        pool.available.push(graphics);
        return true;
      }
    }
    
    // 如果不在池中，手動清理
    if (graphics.remove) {
      graphics.remove();
    }
    return false;
  }

  // === Shader資源池管理 ===
  acquireShader(vertexShader, fragmentShader) {
    const shaderKey = this.generateShaderKey(vertexShader, fragmentShader);
    
    if (this.shaderPool.has(shaderKey)) {
      const entry = this.shaderPool.get(shaderKey);
      entry.refCount++;
      entry.lastUsed = Date.now();
      this.stats.shaderReused++;
      return entry.shader;
    }

    // 創建新shader
    const shader = createShader(vertexShader, fragmentShader);
    this.shaderPool.set(shaderKey, {
      shader,
      refCount: 1,
      lastUsed: Date.now(),
      vertexShader,
      fragmentShader
    });
    
    this.stats.shaderCreated++;
    return shader;
  }

  releaseShader(shader) {
    for (const [key, entry] of this.shaderPool.entries()) {
      if (entry.shader === shader) {
        entry.refCount--;
        entry.lastUsed = Date.now();
        
        // 如果沒有引用且超過閒置時間，標記待清理
        if (entry.refCount <= 0) {
          entry.canCleanup = true;
        }
        return true;
      }
    }
    return false;
  }

  // === 清理和維護 ===
  performCleanup() {
    const now = Date.now();
    let freedResources = 0;

    // 清理閒置的Canvas
    for (const [size, pool] of this.canvasPool.entries()) {
      if (now - pool.lastUsed > this.config.maxIdleTime) {
        const availableCount = pool.available.length;
        pool.available.forEach(canvas => this.destroyCanvas(canvas));
        pool.available = [];
        freedResources += availableCount;
      }
    }

    // 清理閒置的Shader
    for (const [key, entry] of this.shaderPool.entries()) {
      if (entry.canCleanup && now - entry.lastUsed > this.config.maxIdleTime) {
        if (entry.shader && entry.shader.remove) {
          entry.shader.remove();
        }
        this.shaderPool.delete(key);
        freedResources++;
      }
    }

    // 清理Graphics池
    for (const [size, pool] of this.graphicsPool.entries()) {
      while (pool.available.length > this.config.maxCanvasPoolSize) {
        const graphics = pool.available.pop();
        if (graphics && graphics.remove) {
          graphics.remove();
          freedResources++;
        }
      }
    }

    this.stats.memoryFreed += freedResources;
    this.stats.lastCleanup = now;

    if (freedResources > 0) {
      console.log(`[RESOURCE] Cleanup completed: ${freedResources} resources freed`);
    }
  }

  // === 工具方法 ===
  createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  cleanCanvas(canvas) {
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  destroyCanvas(canvas) {
    if (canvas) {
      this.cleanCanvas(canvas);
      // 移除DOM引用
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  generateShaderKey(vertexShader, fragmentShader) {
    // 生成shader的唯一標識
    const hashCode = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash;
    };
    
    return `${hashCode(vertexShader)}_${hashCode(fragmentShader)}`;
  }

  startCleanupTimer() {
    setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  // === 統計和監控 ===
  getStats() {
    const poolStats = {};
    
    // Canvas池統計
    for (const [size, pool] of this.canvasPool.entries()) {
      poolStats[`canvas_${size}`] = {
        available: pool.available.length,
        inUse: pool.inUse.length,
        total: pool.available.length + pool.inUse.length
      };
    }

    // Shader池統計
    poolStats.shaders = {
      total: this.shaderPool.size,
      activeRefs: Array.from(this.shaderPool.values()).reduce((sum, entry) => sum + entry.refCount, 0)
    };

    return {
      ...this.stats,
      pools: poolStats,
      uptime: Date.now() - (this.stats.lastCleanup - this.config.cleanupInterval)
    };
  }

  // 緊急清理 - 釋放所有可釋放資源
  emergencyCleanup() {
    console.log('[RESOURCE] Emergency cleanup initiated');
    
    let totalFreed = 0;

    // 清理所有available資源
    for (const [size, pool] of this.canvasPool.entries()) {
      pool.available.forEach(canvas => this.destroyCanvas(canvas));
      totalFreed += pool.available.length;
      pool.available = [];
    }

    for (const [size, pool] of this.graphicsPool.entries()) {
      pool.available.forEach(graphics => {
        if (graphics.remove) graphics.remove();
      });
      totalFreed += pool.available.length;
      pool.available = [];
    }

    // 清理無引用的shader
    for (const [key, entry] of this.shaderPool.entries()) {
      if (entry.refCount <= 0) {
        if (entry.shader && entry.shader.remove) {
          entry.shader.remove();
        }
        this.shaderPool.delete(key);
        totalFreed++;
      }
    }

    console.log(`[RESOURCE] Emergency cleanup completed: ${totalFreed} resources freed`);
    return totalFreed;
  }

  // 完全銷毀管理器
  dispose() {
    console.log('[RESOURCE] ResourceManager disposing...');
    
    // 停止清理定時器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // 釋放所有資源
    this.emergencyCleanup();
    
    // 清理inUse資源（強制）
    for (const [size, pool] of this.canvasPool.entries()) {
      pool.inUse.forEach(item => this.destroyCanvas(item.canvas));
    }
    
    for (const [size, pool] of this.graphicsPool.entries()) {
      pool.inUse.forEach(graphics => {
        if (graphics.remove) graphics.remove();
      });
    }

    // 清理所有pools
    this.canvasPool.clear();
    this.shaderPool.clear();
    this.texturePool.clear();
    this.graphicsPool.clear();

    console.log('[RESOURCE] ResourceManager disposed');
  }
}

// 全域資源管理器實例
let resourceManager = null;

// 初始化函數
function initializeResourceManager() {
  if (!resourceManager) {
    resourceManager = new ResourceManager();
    
    // 註冊全域清理事件
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (resourceManager) {
          resourceManager.dispose();
        }
      });
    }
  }
  return resourceManager;
}

// 獲取全域資源管理器
function getResourceManager() {
  return resourceManager || initializeResourceManager();
}

// 模組導出
createModuleExports(ResourceManager, {
  initializeResourceManager,
  getResourceManager
}, 'ResourceManager');