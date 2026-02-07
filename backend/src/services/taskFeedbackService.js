const TaskFeedback = require('../models/TaskFeedback');
const logger = require('../utils/logger');

class TaskFeedbackService {
  /**
   * 创建任务反馈
   * @param {ObjectId} userId - 用户ID
   * @param {Object} feedbackData - 反馈数据
   * @returns {Promise<Object>} 创建的反馈对象
   */
  async createFeedback(userId, feedbackData) {
    try {
      const feedback = new TaskFeedback({
        ...feedbackData,
        userId
      });

      await feedback.save();
      logger.info('任务反馈创建成功', {
        userId,
        taskId: feedbackData.taskId,
        feedbackType: feedbackData.feedbackType,
        rating: feedbackData.rating
      });

      return feedback;
    } catch (error) {
      logger.error('创建任务反馈失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取任务的反馈
   * @param {ObjectId} taskId - 任务ID
   * @returns {Promise<Array>} 反馈列表
   */
  async getTaskFeedback(taskId) {
    try {
      const feedbacks = await TaskFeedback.find({ taskId }).sort({ createdAt: -1 });
      return feedbacks;
    } catch (error) {
      logger.error('获取任务反馈失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取用户的反馈历史
   * @param {ObjectId} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 反馈列表
   */
  async getUserFeedbackHistory(userId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const feedbacks = await TaskFeedback.find({ userId })
        .populate('taskId', 'title type status')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
      
      const total = await TaskFeedback.countDocuments({ userId });
      
      return {
        feedbacks,
        total,
        limit,
        offset
      };
    } catch (error) {
      logger.error('获取用户反馈历史失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取任务反馈统计
   * @param {ObjectId} taskId - 任务ID
   * @returns {Promise<Object>} 统计信息
   */
  async getTaskFeedbackStats(taskId) {
    try {
      const feedbacks = await TaskFeedback.find({ taskId });
      
      if (feedbacks.length === 0) {
        return {
          totalFeedback: 0,
          averageRating: 0,
          feedbackTypeDistribution: {
            satisfied: 0,
            neutral: 0,
            dissatisfied: 0
          }
        };
      }
      
      const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
      const averageRating = totalRating / feedbacks.length;
      
      const feedbackTypeDistribution = {
        satisfied: 0,
        neutral: 0,
        dissatisfied: 0
      };
      
      feedbacks.forEach(feedback => {
        feedbackTypeDistribution[feedback.feedbackType]++;
      });
      
      return {
        totalFeedback: feedbacks.length,
        averageRating: Math.round(averageRating * 10) / 10,
        feedbackTypeDistribution
      };
    } catch (error) {
      logger.error('获取任务反馈统计失败:', error.message);
      throw error;
    }
  }

  /**
   * 更新反馈
   * @param {ObjectId} feedbackId - 反馈ID
   * @param {ObjectId} userId - 用户ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的反馈对象
   */
  async updateFeedback(feedbackId, userId, updates) {
    try {
      const feedback = await TaskFeedback.findOneAndUpdate(
        { _id: feedbackId, userId },
        updates,
        { new: true }
      );
      
      if (!feedback) {
        throw new Error('反馈不存在或无权更新');
      }
      
      logger.info('任务反馈更新成功', {
        feedbackId,
        userId
      });
      
      return feedback;
    } catch (error) {
      logger.error('更新任务反馈失败:', error.message);
      throw error;
    }
  }

  /**
   * 删除反馈
   * @param {ObjectId} feedbackId - 反馈ID
   * @param {ObjectId} userId - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteFeedback(feedbackId, userId) {
    try {
      const result = await TaskFeedback.deleteOne({ _id: feedbackId, userId });
      
      if (result.deletedCount === 0) {
        throw new Error('反馈不存在或无权删除');
      }
      
      logger.info('任务反馈删除成功', {
        feedbackId,
        userId
      });
      
      return true;
    } catch (error) {
      logger.error('删除任务反馈失败:', error.message);
      throw error;
    }
  }
}

module.exports = new TaskFeedbackService();
