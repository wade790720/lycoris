// ES6模組導出工具 - 平滑過渡模組化系統
// 支援舊有全域變數模式，同時準備ES6模組導出

class ModuleExports {
  // 創建模組導出 - 同時支援全域變數和ES6模組
  static createModuleExports(MainClass, constants = null, moduleName = null) {
    const exports = { [MainClass.name]: MainClass };
    
    // 添加常數導出
    if (constants) {
      Object.assign(exports, constants);
    }
    
    // 向後兼容：註冊到全域變數
    if (typeof window !== 'undefined') {
      window[MainClass.name] = MainClass;
      if (constants && typeof constants === 'object') {
        Object.keys(constants).forEach(key => {
          window[key] = constants[key];
        });
      }
    }
    
    // ES6模組導出準備
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = exports;
    }
    
    return exports;
  }
  
  // 依賴解析 - 檢查必要依賴是否載入
  static checkDependencies(dependencies) {
    const missing = [];
    dependencies.forEach(dep => {
      if (typeof window !== 'undefined' && !window[dep]) {
        missing.push(dep);
      }
    });
    
    if (missing.length > 0) {
      console.warn(`[MODULE] Missing dependencies: ${missing.join(', ')}`);
      return false;
    }
    return true;
  }
  
  // 安全取得全域物件
  static safeGlobal(name, fallback = null) {
    if (typeof window !== 'undefined' && window[name]) {
      return window[name];
    }
    if (fallback !== null) {
      console.warn(`[MODULE] Using fallback for ${name}`);
      return fallback;
    }
    return null;
  }
}

// 匯出工具函數供其他模組使用
function createModuleExports(MainClass, constants, moduleName) {
  return ModuleExports.createModuleExports(MainClass, constants, moduleName);
}

function checkDependencies(dependencies) {
  return ModuleExports.checkDependencies(dependencies);
}

function safeGlobal(name, fallback = null) {
  return ModuleExports.safeGlobal(name, fallback);
}

// 向後兼容和ES6模組準備
if (typeof window !== 'undefined') {
  window.createModuleExports = createModuleExports;
  window.checkDependencies = checkDependencies;
  window.safeGlobal = safeGlobal;
  window.ModuleExports = ModuleExports;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ModuleExports,
    createModuleExports,
    checkDependencies,
    safeGlobal
  };
}