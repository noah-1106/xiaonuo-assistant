const express = require('express');
const router = express.Router();
const contextCacheService = require('../services/contextCacheService');

// 验证管理员权限的中间件
const requireAdmin = (req, res, next) => {
  // 这里可以根据实际的权限系统进行调整
  // 暂时使用简单的验证方式
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      status: 'error',
      message: '需要管理员权限',
      errorCode: 'FORBIDDEN'
    });
  }
  next();
};

/**
 * @route GET /api/cache/stats
 * @desc 获取缓存统计信息
 * @access 管理员
 */
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const localCacheStats = contextCacheService.getCacheStats();
    
    res.status(200).json({
      status: 'success',
      data: {
        localCache: {
          size: localCacheStats.size,
          entries: localCacheStats.entries
        },
        contextCache: {
          stats: localCacheStats.stats,
          hitRate: localCacheStats.hitRate,
          modelId: localCacheStats.modelId,
          useContextCache: localCacheStats.useContextCache
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/cache/reset-stats
 * @desc 重置上下文缓存统计信息
 * @access 管理员
 */
router.post('/reset-stats', requireAdmin, async (req, res, next) => {
  try {
    // 重置上下文缓存统计信息
    contextCacheService.resetStats();
    
    res.status(200).json({
      status: 'success',
      message: '上下文缓存统计信息已重置'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/cache/context/:contextId
 * @desc 获取指定上下文缓存信息
 * @access 管理员
 */
router.get('/context/:contextId', requireAdmin, async (req, res, next) => {
  try {
    const { contextId } = req.params;
    const contextInfo = await contextCacheService.getContextInfo(contextId);
    
    res.status(200).json({
      status: 'success',
      data: contextInfo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/cache/local
 * @desc 清除本地缓存
 * @access 管理员
 */
router.delete('/local', requireAdmin, async (req, res, next) => {
  try {
    // 清除本地缓存
    contextCacheService.clearLocalCache();
    
    res.status(200).json({
      status: 'success',
      message: '本地缓存已清除'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/cache/refresh
 * @desc 刷新缓存配置
 * @access 管理员
 */
router.post('/refresh', requireAdmin, async (req, res, next) => {
  try {
    // 刷新缓存配置
    contextCacheService.refreshConfig();
    
    res.status(200).json({
      status: 'success',
      message: '缓存配置已刷新'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;