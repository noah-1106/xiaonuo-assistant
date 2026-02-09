const mongoose = require('mongoose');

// AI设置模型
const AISettingSchema = new mongoose.Schema({
  // 模型名称
  model: {
    type: String,
    required: [true, '模型名称不能为空'],
    default: 'doubao-seed-1-8-251228'
  },
  // API密钥
  apiKey: {
    type: String,
    required: [true, 'API密钥不能为空'],
    default: '0a209a91-9cfe-46bc-a138-2090f3658523'
  },
  // API基础URL
  apiBaseUrl: {
    type: String,
    required: [true, 'API基础URL不能为空'],
    default: 'https://ark.cn-beijing.volces.com/api/v3'
  },
  // 温度参数（0-100）
  temperature: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  // topP参数（0-1）
  topP: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.95
  },
  // 系统基础提示词（不包含角色能力设定）
  systemPrompt: {
    type: String,
    default: '你是一个智能助手，叫做小诺，你需要帮助用户完成各种任务，包括创建简录、回答问题等。当用户需要记录信息时，你应该使用createRecord函数来创建简录。'
  },
  // 效率助理配置（全局默认）
  efficiencyAssistant: {
    id: {
      type: String,
      default: 'efficiency'
    },
    name: {
      type: String,
      default: '效率助理'
    },
    prompt: {
      type: String,
      default: '你是一个效率助理，叫做小诺，你需要帮助用户完成各种任务，包括创建简录、回答问题等。当用户需要记录信息时，你应该使用createRecord函数来创建简录。\n\n你可以使用以下工具来帮助用户：\n\n1. createRecord：创建新简录\n   - 参数：type（简录类型）、title（简录标题）、content（简录内容）、tags（简录标签，可选）\n   - 调用格式：当用户需要记录信息时，生成函数调用请求\n\n2. getRecordList：获取简录列表\n   - 参数：type（简录类型，可选）、status（简录状态，可选）、tags（简录标签，可选）、startDate（开始日期，可选）、endDate（结束日期，可选）、page（页码，可选）、limit（每页数量，可选）\n\n3. getRecord：获取单个简录详情\n   - 参数：recordId（简录ID）\n\n4. updateRecord：更新简录\n   - 参数：recordId（简录ID）、title（简录标题，可选）、content（简录内容，可选）、type（简录类型，可选）、status（简录状态，可选）、tags（简录标签，可选）、link（简录链接，可选）\n\n5. deleteRecord：删除简录\n   - 参数：recordId（简录ID）\n\n当你需要使用工具时，系统会自动处理工具调用的格式，你只需要生成函数名称和参数即可。'
    },
    recordTypes: {
      type: [{
        id: {
          type: String,
          required: [true, '记录类型ID不能为空']
        },
        name: {
          type: String,
          required: [true, '记录类型名称不能为空']
        },
        description: {
          type: String
        }
      }],
      default: [
        { id: 'todo', name: '待办事项', description: '需要完成的任务' },
        { id: 'article', name: '文章', description: '长文本内容' },
        { id: 'inspiration', name: '灵感', description: '创意想法' },
        { id: 'other', name: '其他', description: '其他类型的记录' }
      ]
    }
  },
  // 增强角色列表
  enhancedRoles: [
    {
      id: {
        type: String,
        required: [true, '角色ID不能为空']
      },
      name: {
        type: String,
        required: [true, '角色名称不能为空']
      },
      description: {
        type: String
      },
      prompt: {
        type: String,
        required: [true, '角色提示词不能为空']
      },
      // Web Search配置（角色级）
      webSearch: {
        // 是否启用Web Search
        enabled: {
          type: Boolean,
          default: true
        },
        // 最大搜索结果数
        maxResults: {
          type: Number,
          min: 1,
          max: 20,
          default: 5
        }
      },
      // 增强记录类型配置
      enhancedRecordTypes: [
        {
          id: {
            type: String,
            required: [true, '记录类型ID不能为空']
          },
          name: {
            type: String,
            required: [true, '记录类型名称不能为空']
          },
          description: {
            type: String
          },
          // AI自动创建规则
          autoCreateRules: {
            keywords: {
              type: [String],
              default: []
            },
            intentPatterns: {
              type: [String],
              default: []
            }
          }
        }
      ],
      isEnabled: {
        type: Boolean,
        default: true
      }
    }
  ],
  // 启用状态
  enabled: {
    type: Boolean,
    default: true
  },
  // 上下文轮数（默认3轮）
  contextRounds: {
    type: Number,
    min: 1,
    max: 10,
    default: 3
  },
  // 上下文长度（默认10240 tokens）
  contextLength: {
    type: Number,
    min: 1024,
    max: 32768,
    default: 10240
  },
  // Web Search配置
  webSearch: {
    // 是否全局启用Web Search
    enabled: {
      type: Boolean,
      default: true
    },
    // 默认最大搜索结果数
    maxResults: {
      type: Number,
      min: 1,
      max: 20,
      default: 5
    },
    // 搜索超时时间（毫秒）
    timeout: {
      type: Number,
      min: 1000,
      max: 30000,
      default: 10000
    }
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新updatedAt字段
AISettingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 自动更新更新时间
AISettingSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const AISetting = mongoose.model('AISetting', AISettingSchema);

module.exports = AISetting;