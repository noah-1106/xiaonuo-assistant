# AI工具调用指南

本文档详细说明了小诺系统中AI聊天可以调用的工具及调用方法，以及如何在提示词中使用这些信息。

## 一、系统定义的工具函数

### 1. createRecord - 自动从对话中创建记录

**功能**：从对话内容中创建新的记录

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| type | string | 是 | 记录类型，如todo、article等 |
| title | string | 是 | 记录标题，简要描述记录内容 |
| content | string | 是 | 记录内容，详细说明记录信息 |
| tags | array<string> | 否 | 记录标签，用于分类和搜索 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "创建记录",
  "description": "从对话内容中创建新的记录",
  "functionCall": {
    "name": "createRecord",
    "arguments": "{\"type\":\"记录类型\",\"title\":\"记录标题\",\"content\":\"记录内容\",\"tags\":[\"标签1\",\"标签2\"]}"
  }
}
```

**使用场景**：当用户提到需要记录某些信息时，AI可以自动创建记录。

### 2. getRecordList - 获取记录列表

**功能**：获取用户的记录列表，支持多种筛选条件

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| type | string | 否 | 记录类型，用于筛选特定类型的记录 |
| status | string | 否 | 记录状态，用于筛选特定状态的记录 |
| tags | array<string> | 否 | 记录标签，用于筛选包含特定标签的记录 |
| startDate | string | 否 | 开始日期，格式：YYYY-MM-DD，用于筛选指定日期之后的记录 |
| endDate | string | 否 | 结束日期，格式：YYYY-MM-DD，用于筛选指定日期之前的记录 |
| page | integer | 否 | 页码，默认1，用于分页查询 |
| limit | integer | 否 | 每页数量，默认20，用于控制返回记录数量 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "获取记录列表",
  "description": "获取用户的记录列表，支持多种筛选条件",
  "functionCall": {
    "name": "getRecordList",
    "arguments": "{\"type\":\"记录类型\",\"status\":\"记录状态\",\"page\":1,\"limit\":10}"
  }
}
```

**使用场景**：当用户询问某类记录的列表时，AI可以调用此工具获取记录。

### 3. getRecord - 获取单个记录详情

**功能**：获取指定记录的详细信息

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| recordId | string | 是 | 记录ID，指定要获取详情的记录 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "获取记录详情",
  "description": "获取指定记录的详细信息",
  "functionCall": {
    "name": "getRecord",
    "arguments": "{\"recordId\":\"记录ID\"}"
  }
}
```

**使用场景**：当用户询问某个特定记录的详情时，AI可以调用此工具获取记录详情。

### 4. updateRecord - 更新记录

**功能**：更新指定记录的信息

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| recordId | string | 是 | 记录ID，指定要更新的记录 |
| title | string | 否 | 记录标题，更新记录的标题 |
| content | string | 否 | 记录内容，更新记录的内容 |
| type | string | 否 | 记录类型，更新记录的类型 |
| status | string | 否 | 记录状态，更新记录的状态 |
| tags | array<string> | 否 | 记录标签，更新记录的标签 |
| link | string | 否 | 记录链接，更新记录的链接 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "更新记录",
  "description": "更新指定记录的信息",
  "functionCall": {
    "name": "updateRecord",
    "arguments": "{\"recordId\":\"记录ID\",\"status\":\"completed\",\"title\":\"更新后的标题\"}"
  }
}
```

**使用场景**：当用户提到需要更新某个记录时，AI可以调用此工具更新记录。

### 5. deleteRecord - 删除记录

**功能**：删除指定的记录

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| recordId | string | 是 | 记录ID，指定要删除的记录 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "删除记录",
  "description": "删除指定的记录",
  "functionCall": {
    "name": "deleteRecord",
    "arguments": "{\"recordId\":\"记录ID\"}"
  }
}
```

**使用场景**：当用户提到需要删除某个记录时，AI可以调用此工具删除记录。

### 6. createTask - 创建任务

**功能**：创建新的任务

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| title | string | 是 | 任务标题，简要描述任务目的 |
| description | string | 否 | 任务描述，详细说明任务内容 |
| params | object | 否 | 任务参数，用于存储任务执行所需的配置信息 |
| subtasks | array<object> | 否 | 子任务列表，每个子任务包含执行逻辑 |
| executionMode | string | 否 | 执行模式：auto（自动执行所有子任务，默认）或 manual（AI手动控制子任务执行） |

**调用格式**：
```json
{
  "choices": [
    {
      "message": {
        "content": "<友好的用户提示，例如\"好的，我来帮你创建这个任务。\">",
        "function_call": {
          "name": "createTask",
          "arguments": "{\"title\":\"任务标题\",\"description\":\"任务描述\",\"params\":{\"参数1\":\"值1\"},\"subtasks\":[{\"title\":\"子任务1\",\"description\":\"子任务描述\"}]}"
        }
      }
    }
  ]
}
```

**使用场景**：当用户提到需要创建一个任务时，AI可以调用此工具创建任务。

### 7. executeTask - 执行任务

**功能**：执行指定的任务

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| taskId | string | 是 | 任务ID，指定要执行的任务 |

**调用格式**：
```json
{
  "choices": [
    {
      "message": {
        "content": "<友好的用户提示，例如\"好的，我来帮你执行这个任务。\">",
        "function_call": {
          "name": "executeTask",
          "arguments": "{\"taskId\":\"任务ID\"}"
        }
      }
    }
  ]
}
```

**使用场景**：当用户提到需要执行某个任务时，AI可以调用此工具执行任务。

### 8. getTaskList - 获取任务列表

**功能**：获取用户的任务列表，支持筛选条件

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| status | string | 否 | 任务状态，用于筛选特定状态的任务 |
| limit | integer | 否 | 限制数量，默认20，用于控制返回任务数量 |

**调用格式**：
```json
{
  "choices": [
    {
      "message": {
        "content": "<友好的用户提示，例如\"让我帮你查看任务列表。\">",
        "function_call": {
          "name": "getTaskList",
          "arguments": "{\"status\":\"任务状态\",\"limit\":10}"
        }
      }
    }
  ]
}
```

**使用场景**：当用户提到需要查看任务列表时，AI可以调用此工具获取任务列表。

### 9. getTask - 获取任务详情

**功能**：获取指定任务的详细信息

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| taskId | string | 是 | 任务ID，指定要获取详情的任务 |

**调用格式**：
```json
{
  "choices": [
    {
      "message": {
        "content": "<友好的用户提示，例如\"让我帮你查看任务详情。\">",
        "function_call": {
          "name": "getTask",
          "arguments": "{\"taskId\":\"任务ID\"}"
        }
      }
    }
  ]
}
```

**使用场景**：当用户提到需要查看某个任务的详情时，AI可以调用此工具获取任务详情。

### 10. getRecentRecords - 获取最近的N条记录

**功能**：获取用户最近创建的记录列表

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| limit | integer | 否 | 返回记录数量，默认5条，用于控制返回记录的数量 |
| type | string | 否 | 记录类型，可选，用于筛选特定类型的记录 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "获取最近记录",
  "description": "获取用户最近创建的记录列表",
  "functionCall": {
    "name": "getRecentRecords",
    "arguments": "{\"limit\":5,\"type\":\"记录类型\"}"
  }
}
```

**使用场景**：当用户提到"上一条记录"、"最近的记录"、"刚才的记录"等上下文引用时，AI可以调用此工具获取最近的记录列表。

### 11. searchRecords - 根据关键词搜索记录

**功能**：根据关键词搜索用户的记录

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| keyword | string | 是 | 搜索关键词，用于在记录标题和内容中搜索 |
| limit | integer | 否 | 返回记录数量，默认10条，用于控制返回记录的数量 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "搜索记录",
  "description": "根据关键词搜索用户的记录",
  "functionCall": {
    "name": "searchRecords",
    "arguments": "{\"keyword\":\"搜索关键词\",\"limit\":10}"
  }
}
```

**使用场景**：当用户提到"关于XX的记录"、"XX的记录"等需要搜索的情况时，AI可以调用此工具根据关键词搜索记录。

### 12. executeNextSubtask - 执行下一个子任务

**功能**：在手动执行模式下执行下一个子任务

**参数**：
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| taskId | string | 是 | 任务ID，指定要执行下一个子任务的任务 |

**调用格式**：
```json
{
  "choices": [
    {
      "message": {
        "content": "<友好的用户提示，例如\"好的，我来帮你执行下一个子任务。\">",
        "function_call": {
          "name": "executeNextSubtask",
          "arguments": "{\"taskId\":\"任务ID\"}"
        }
      }
    }
  ]
}
```

**使用场景**：在手动执行模式下，当前一个子任务执行完成后，AI可以调用此工具执行下一个子任务，实现子任务的线性执行控制。

## 二、调用方式详解

### 1. 系统内函数调用 (system_function)

**定义**：调用系统内部定义的函数，执行数据库操作或业务逻辑
**执行方法**：系统直接调用对应的内部函数，执行相应操作
**适用场景**：需要操作系统内部数据，如创建记录、查询记录等

**可用函数**：
| 函数名 | 功能描述 | 适用场景 |
|-------|---------|----------|
| createRecord | 自动从对话中创建记录 | 当用户需要记录信息时 |
| getRecordList | 获取记录列表，支持筛选条件 | 当用户需要查看记录列表时 |
| getRecord | 获取单个记录详情 | 当用户需要查看特定记录详情时 |
| updateRecord | 更新指定记录的信息 | 当用户需要更新记录时 |
| deleteRecord | 删除指定的记录 | 当用户需要删除记录时 |
| getRecentRecords | 获取最近的记录列表 | 当用户提到上一条记录、最近的记录等上下文引用时 |
| searchRecords | 根据关键词搜索记录 | 当用户提到关于XX的记录、XX的记录等需要搜索的情况时 |
| createTask | 创建新的任务 | 当用户需要创建任务时 |
| executeTask | 执行指定的任务 | 当用户需要执行任务时 |
| executeNextSubtask | 执行下一个子任务 | 在手动执行模式下，当前一个子任务执行完成后执行下一个子任务 |
| getTaskList | 获取任务列表，支持筛选条件 | 当用户需要查看任务列表时 |
| getTask | 获取指定任务的详细信息 | 当用户需要查看特定任务详情时 |

**在任务子任务中的定义格式**：
```json
{
  "type": "system_function",
  "functionCall": {
    "name": "createRecord",
    "arguments": {
      "type": "report",
      "title": "市场分析报告",
      "content": "报告内容...",
      "tags": ["市场", "分析"]
    }
  }
}
```

### 2. 大模型工具调用 (model_tool_call)

**定义**：调用大模型的内置工具，如网页搜索、图像处理等
**执行方法**：通过大模型的工具API调用相应工具，获取外部信息
**适用场景**：需要获取实时信息、处理多媒体内容、访问外部资源等

**可用工具**：
| 工具类型 | 功能描述 | 适用场景 |
|---------|---------|----------|
| web_search | 联网搜索，获取实时公开网络信息 | 当用户需要实时数据、新闻、天气等信息时 |
| image_process | 图像处理，对输入图片执行各种操作 | 当用户需要分析图片内容时 |
| video_process | 视频处理，对输入视频进行分析和理解 | 当用户需要分析视频内容时 |
| file_process | 文件处理，对输入文件进行分析和理解 | 当用户需要分析文件内容时 |
| knowledge_search | 私域知识库搜索，获取企业内部信息 | 当用户需要访问企业内部知识时 |
| mcp_tools | 云部署MCP工具，对接各类垂直领域工具 | 当用户需要使用特定领域工具时 |

**在任务子任务中的定义格式**：
```json
{
  "type": "model_tool_call",
  "modelToolCall": {
    "type": "web_search",
    "parameters": {
      "query": "最新AI市场趋势",
      "limit": 5,
      "language": "zh"
    }
  }
}
```

### 3. 大模型自行执行 (llm_execution)

**定义**：大模型根据指令自行执行，不需要调用外部工具
**执行方法**：大模型基于自身知识和上下文进行处理，生成执行结果
**适用场景**：需要分析、推理、生成内容等纯思考任务

**执行方式**：
- 大模型根据提供的指令进行分析和处理
- 基于自身知识和上下文信息生成结果
- 不需要调用外部API或工具

**在任务子任务中的定义格式**：
```json
{
  "type": "llm_execution",
  "instructions": [
    "分析收集到的市场数据",
    "识别主要市场趋势和增长点",
    "分析竞争格局",
    "预测未来3-6个月的市场发展方向",
    "生成详细的分析报告"
  ]
}
```

### 4. 三种调用方式的对比

| 调用方式 | 执行主体 | 适用场景 | 响应速度 | 数据来源 |
|---------|---------|----------|----------|----------|
| system_function | 系统 | 操作内部数据 | 快 | 系统数据库 |
| model_tool_call | 大模型 + 外部工具 | 获取外部信息 | 中等 | 外部API/工具 |
| llm_execution | 大模型 | 分析推理生成 | 快 | 大模型知识库 |

## 三、内置工具（通过Responses API）

### 1. 联网搜索 (Web Search)

**功能**：获取实时公开网络信息（如新闻、商品、天气等），解决数据时效性、知识盲区、信息同步等核心问题

**使用场景**：当用户询问需要实时数据的问题时，如天气、新闻、股票、比赛结果等。

### 2. 图像处理 (Image Process)

**功能**：对输入图片进行分析和理解，支持图片内容识别、物体检测、场景分析等操作

**使用场景**：当用户上传图片并需要对图片内容进行分析时。

### 3. 视频处理 (Video Process)

**功能**：对输入视频进行分析和理解，支持视频内容识别、场景分析、关键帧提取等操作

**使用场景**：当用户上传视频并需要对视频内容进行分析时。

### 4. 文件处理 (File Process)

**功能**：对输入文件进行分析和理解，支持文档内容提取、格式转换、关键信息总结等操作

**使用场景**：当用户上传文件并需要对文件内容进行分析时。

### 5. 私域知识库搜索 (Knowledge Search)

**功能**：获取企业私域知识库中的信息（计划中）

**使用场景**：当用户询问基于企业内部文档的问题时。

**状态**：计划中，尚未实现

### 6. 云部署 MCP / Remote MCP

**功能**：对接MCP MarketPlace中的各类垂直领域工具（计划中）

**使用场景**：当用户需要使用特定领域的工具时。

**状态**：计划中，尚未实现

## 三、系统变量

- {nickname} - 用户昵称
- {username} - 用户名
- {plan.name} - 套餐名称
- {plan.endDate} - 套餐结束日期
- {plan.expiryDate} - 套餐到期日期
- {subscription.name} - 订阅名称
- {subscription.endDate} - 订阅结束日期
- {subscription.expiryDate} - 订阅到期日期

## 四、工具调用与结果处理

### 工具调用流程

1. **AI判断**：AI模型在对话过程中自主判断是否需要调用工具
2. **生成调用**：AI生成工具调用请求，包含函数名称和参数
3. **系统执行**：系统执行工具调用，获取结果
4. **系统返回**：系统将工具执行结果返回给AI
5. **AI响应**：AI根据执行结果生成友好的自然语言回复给用户

### 结果处理

当AI收到系统返回的工具执行结果后，应该：

1. **理解结果**：准确理解工具执行的结果内容
2. **生成反馈**：根据结果生成友好、自然的语言反馈
3. **个性化回复**：在回复中适当使用用户昵称，增强个性化体验
4. **处理错误**：当工具调用失败时，给出友好的错误提示

### 示例对话流程

**用户**：我需要记住明天要去超市买牛奶、鸡蛋和面包。

**AI**：好的，我已经为你创建了一个购物清单记录。

1. AI 生成工具调用请求：
```json
{
  "choices": [
    {
      "message": {
        "content": "<友好的用户提示，例如\"好的，我来帮你创建这个购物清单。\">",
        "function_call": {
          "name": "createRecord",
          "arguments": "{\"type\":\"todo\",\"title\":\"购物清单\",\"content\":\"牛奶、鸡蛋和面包\",\"tags\":[\"生活\",\"购物\"]}"
        }
      }
    }
  ]
}
```

2. 系统执行 createRecord 操作，创建记录。

3. 系统返回执行结果：
```
记录已创建：购物清单
```

4. AI 根据执行结果生成友好回复：
```
好的，我已经为你创建了一个购物清单记录。
```

**最终用户看到的回复**：好的，我已经为你创建了一个购物清单记录。

## 五、提示词最佳实践

### 工具调用提示词

```
你是小诺，一个智能助手。

用户信息：
- 昵称：${userNickname}
- 套餐：${userPlan.name}
- 到期时间：${userPlan.endDate}

你可以使用以下工具来帮助用户：

1. createRecord：创建新记录
   - 参数：type（记录类型）、title（记录标题）、content（记录内容）、tags（记录标签，可选）
   - 调用格式：{"choices":[{"message":{"content":"<友好的用户提示，例如\"好的，我来帮你记录这条信息。\">","function_call":{"name":"createRecord","arguments":"{\"type\":\"todo\",\"title\":\"标题\",\"content\":\"内容\",\"tags\":[\"标签1\",\"标签2\"]}"}}]}

2. getRecordList：获取记录列表
   - 参数：type（记录类型，可选）、status（记录状态，可选）、tags（记录标签，可选）、startDate（开始日期，可选）、endDate（结束日期，可选）、page（页码，可选）、limit（每页数量，可选）
   - 调用格式：{"choices":[{"message":{"content":"<友好的用户提示，例如\"让我帮你查看记录列表。\">","function_call":{"name":"getRecordList","arguments":"{\"type\":\"todo\",\"status\":\"pending\",\"page\":1,\"limit\":10}"}}]}

3. getRecord：获取单个记录详情
   - 参数：recordId（记录ID）
   - 调用格式：{"choices":[{"message":{"content":"<友好的用户提示，例如\"让我帮你查看记录详情。\">","function_call":{"name":"getRecord","arguments":"{\"recordId\":\"记录ID\"}"}}]}

4. updateRecord：更新记录
   - 参数：recordId（记录ID）、title（记录标题，可选）、content（记录内容，可选）、type（记录类型，可选）、status（记录状态，可选）、tags（记录标签，可选）、link（记录链接，可选）
   - 调用格式：{"choices":[{"message":{"content":"<友好的用户提示，例如\"好的，我来帮你更新这条记录。\">","function_call":{"name":"updateRecord","arguments":"{\"recordId\":\"记录ID\",\"status\":\"completed\",\"title\":\"已完成项目报告\"}"}}]}

5. deleteRecord：删除记录
   - 参数：recordId（记录ID）
   - 调用格式：{"choices":[{"message":{"content":"<友好的用户提示，例如\"好的，我来帮你删除这条记录。\">","function_call":{"name":"deleteRecord","arguments":"{\"recordId\":\"记录ID\"}"}}]}

6. createTask：创建任务
   - 参数：title（任务标题）、description（任务描述，可选）、params（任务参数，可选）、subtasks（子任务列表，可选）
   - 调用格式：{"choices":[{"message":{"content":"<友好的用户提示，例如\"好的，我来帮你创建这个任务。\">","function_call":{"name":"createTask","arguments":"{\"title\":\"任务标题\",\"description\":\"任务描述\",\"params\":{\"参数1\":\"值1\"},\"subtasks\":[{\"title\":\"子任务1\",\"description\":\"子任务描述\"}]}"}}]}

7. executeTask：执行任务
   - 参数：taskId（任务ID）
   - 调用格式：{"choices":[{"message":{"content":"<友好的用户提示，例如\"好的，我来帮你执行这个任务。\">","function_call":{"name":"executeTask","arguments":"{\"taskId\":\"任务ID\"}"}}]}

8. getTaskList：获取任务列表
   - 参数：status（任务状态，可选）、limit（限制数量，可选）
   - 调用格式：{"choices":[{"message":{"content":"<友好的用户提示，例如\"让我帮你查看任务列表。\">","function_call":{"name":"getTaskList","arguments":"{\"status\":\"pending\",\"limit\":10}"}}]}

9. getTask：获取任务详情
   - 参数：taskId（任务ID）
   - 调用格式：{"choices":[{"message":{"content":"<友好的用户提示，例如\"让我帮你查看任务详情。\">","function_call":{"name":"getTask","arguments":"{\"taskId\":\"任务ID\"}"}}]}

当你需要使用工具时，请按照上述格式生成工具调用请求。

当系统返回工具执行结果后，请根据执行结果生成友好的自然语言回复给用户。

请根据用户的问题提供相应的回答。
```

### 结果处理提示词

```
当你收到系统返回的工具执行结果后，请：

1. 仔细阅读执行结果，理解其含义
2. 根据执行结果生成友好、自然的语言反馈
3. 在回复中适当使用用户昵称，增强个性化体验
4. 当工具调用失败时，给出友好的错误提示
5. 保持回复简洁明了，避免使用技术术语

例如：
- 当创建记录成功时："好的，我已经为你创建了一个购物清单记录。"
- 当获取记录列表时："找到3条待处理的工作任务，分别是..."
- 当更新记录成功时："已将项目报告标记为已完成。"
- 当删除记录成功时："记录已成功删除。"
- 当创建任务成功时："任务已创建：生成项目报告，状态：待执行。"
- 当执行任务成功时："任务执行成功，执行结果：{...}"
- 当获取任务列表时："找到5个任务，其中3个待执行，2个已完成。"
- 当获取任务详情时："任务详情：生成项目报告，状态：待执行，创建时间：2024-01-01。"
- 当工具调用失败时："抱歉，操作失败，请稍后重试。"

请根据执行结果生成适当的回复。
```

## 六、示例对话

### 示例1：创建记录

**用户**：我需要记住明天要去超市买牛奶、鸡蛋和面包。

**AI**：好的，我已经为你创建了一个购物清单记录。

### 示例2：获取记录列表

**用户**：我有哪些待处理的工作任务？

**AI**：让我帮你查看待处理的工作任务。

### 示例3：更新记录

**用户**：我已经完成了项目报告，把它标记为已完成。

**AI**：好的，我已经把项目报告标记为已完成。

### 示例4：删除记录

**用户**：删除那个购物清单记录。

**AI**：好的，我已经删除了购物清单记录。

### 示例5：创建任务

**用户**：创建一个任务，标题是"生成项目报告"，描述是"基于最近的项目数据生成详细报告"。

**AI**：好的，我已经为你创建了一个任务。

### 示例6：执行任务

**用户**：执行刚才创建的生成项目报告任务。

**AI**：好的，我已经开始执行生成项目报告任务。

### 示例7：获取任务列表

**用户**：我有哪些待执行的任务？

**AI**：让我帮你查看待执行的任务。

### 示例8：获取任务详情

**用户**：查看那个生成项目报告任务的详情。

**AI**：好的，我来帮你查看任务详情。

## 七、复杂任务创建与执行案例

### 大型项目管理任务案例

**任务描述**：创建一个完整的项目管理任务，包含多个子任务，涵盖不同的记录类型和调用方式。

**任务创建调用格式**：
```json
{
  "choices": [
    {
      "message": {
        "content": "好的，我来帮你创建一个完整的项目管理任务。",
        "function_call": {
          "name": "createTask",
          "arguments": {
            "title": "项目管理综合任务",
            "description": "一个包含多个子任务的综合项目管理任务，涵盖不同记录类型和调用方式",
            "params": {
              "projectId": "PROJ-2026-001",
              "deadline": "2026-02-28"
            },
            "subtasks": [
              {
                "title": "创建项目计划",
                "description": "创建详细的项目计划和时间线",
                "functionCall": {
                  "name": "createRecord",
                  "arguments": {
                    "type": "article",
                    "title": "项目计划",
                    "content": "项目概述：开发新产品\n时间线：\n- 启动阶段：2026-02-01 至 2026-02-07\n- 规划阶段：2026-02-08 至 2026-02-14\n- 执行阶段：2026-02-15 至 2026-02-21\n- 收尾阶段：2026-02-22 至 2026-02-28\n\n关键里程碑：\n1. 需求分析完成\n2. 设计方案确认\n3. 开发完成\n4. 测试通过\n5. 产品发布",
                    "tags": ["项目管理", "计划"]
                  }
                }
              },
              {
                "title": "创建项目启动会议待办",
                "description": "创建项目启动会议的待办事项",
                "functionCall": {
                  "name": "createRecord",
                  "arguments": {
                    "type": "todo",
                    "title": "项目启动会议",
                    "content": "召开项目启动会议，确认项目目标和团队成员",
                    "tags": ["项目管理", "会议"]
                  }
                }
              },
              {
                "title": "创建项目创意",
                "description": "记录项目创意和灵感",
                "functionCall": {
                  "name": "createRecord",
                  "arguments": {
                    "type": "inspiration",
                    "title": "项目创意",
                    "content": "产品核心功能：\n1. 智能分析\n2. 实时数据\n3. 用户友好界面\n4. 可扩展性",
                    "tags": ["项目管理", "创意"]
                  }
                }
              },
              {
                "title": "获取最近记录",
                "description": "获取最近的文章记录",
                "functionCall": {
                  "name": "getRecentRecords",
                  "arguments": {
                    "limit": 5,
                    "type": "article"
                  }
                }
              },
              {
                "title": "搜索项目记录",
                "description": "搜索相关项目记录",
                "functionCall": {
                  "name": "searchRecords",
                  "arguments": {
                    "keyword": "项目",
                    "limit": 10
                  }
                }
              },
              {
                "title": "研究项目管理最佳实践",
                "description": "搜索2026年项目管理最佳实践",
                "modelToolCall": {
                  "type": "web_search",
                  "parameters": {
                    "query": "2026年项目管理最佳实践",
                    "limit": 5,
                    "language": "zh"
                  }
                }
              },
              {
                "title": "制定项目实施计划",
                "description": "分析最佳实践并制定实施计划",
                "instructions": [
                  "分析收集到的项目管理最佳实践",
                  "结合项目特点制定具体实施计划",
                  "识别潜在风险和应对策略",
                  "生成详细的项目管理指南"
                ]
              },
              {
                "title": "执行项目任务",
                "description": "执行项目管理综合任务",
                "functionCall": {
                  "name": "executeTask",
                  "arguments": {
                    "taskId": "{taskId}"
                  }
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```

**任务执行流程**：

1. **子任务1：创建项目计划**
   - 创建项目计划文章记录
   - 创建项目启动会议待办事项记录
   - 创建项目创意灵感记录
   - 获取最近的文章记录
   - 搜索相关项目记录

2. **子任务2：研究项目管理最佳实践**
   - 使用联网搜索获取2026年项目管理最佳实践

3. **子任务3：制定项目实施计划**
   - 大模型分析收集到的最佳实践
   - 制定具体实施计划
   - 识别潜在风险和应对策略
   - 生成详细的项目管理指南

4. **子任务4：执行项目任务**
   - 执行整个项目管理综合任务

**执行结果**：
- 创建了3条不同类型的记录（article、todo、inspiration）
- 获取了最近的项目相关记录
- 搜索了项目相关记录
- 收集了最新的项目管理最佳实践
- 生成了详细的项目管理指南
- 完成了整个项目管理综合任务

**使用场景**：
当用户需要进行复杂的项目管理时，AI可以创建一个包含多个子任务的综合任务，使用不同的调用方式和记录类型，帮助用户全面管理项目。

### 记录类型说明

本系统支持四种默认记录类型：

1. **todo** - 待办事项
   - 适用场景：需要跟踪和完成的任务
   - 示例：会议安排、购物清单、工作任务

2. **article** - 文章
   - 适用场景：详细的文档、报告、计划
   - 示例：项目计划、市场分析报告、研究论文

3. **inspiration** - 灵感
   - 适用场景：创意、想法、灵感
   - 示例：产品创意、营销点子、设计灵感

4. **other** - 其他
   - 适用场景：不适合以上类型的其他记录
   - 示例：通用笔记、参考资料、杂项信息

在创建记录时，请根据内容性质选择合适的记录类型。

## 八、手动执行模式使用指南

### 1. 手动执行模式概述

**定义**：手动执行模式是一种任务执行模式，允许AI（小诺）控制子任务的执行顺序，确保在上一个子任务完成后再启动下一个子任务。

**特点**：
- 子任务线性执行，确保执行顺序
- AI可以收到每个子任务的完成通知
- AI可以根据前一个子任务的执行结果决定是否继续执行下一个子任务
- 提供更灵活的任务执行控制

**适用场景**：
- 复杂任务需要严格的执行顺序
- 子任务之间存在依赖关系
- 需要根据前一个子任务的结果调整后续子任务的执行
- 需要人工干预或决策的任务流程

### 2. 手动执行模式工作流程

1. **创建手动执行模式任务**：在创建任务时设置 `executionMode: "manual"`
2. **执行任务**：调用 `executeTask` 函数执行任务
3. **任务初始化**：系统初始化任务，准备执行第一个子任务
4. **执行第一个子任务**：系统自动执行第一个子任务
5. **接收子任务完成通知**：AI收到第一个子任务的完成通知
6. **执行下一个子任务**：AI调用 `executeNextSubtask` 函数执行下一个子任务
7. **循环执行**：重复步骤5-6，直到所有子任务执行完成
8. **任务完成**：所有子任务执行完成后，任务状态更新为已完成

### 3. 手动执行模式使用示例

#### 示例1：创建手动执行模式任务

```json
{
  "choices": [
    {
      "message": {
        "content": "好的，我来帮你创建一个手动执行模式的任务。",
        "function_call": {
          "name": "createTask",
          "arguments": "{\"title\":\"市场调研综合任务\",\"description\":\"执行完整的市场调研流程，确保每个步骤完成后再进行下一步\",\"executionMode\":\"manual\",\"subtasks\":[{\"title\":\"收集市场数据\",\"description\":\"收集最新的市场数据和趋势\",\"modelToolCall\":{\"type\":\"web_search\",\"parameters\":{\"query\":\"2026年AI市场趋势\",\"limit\":5,\"language\":\"zh\"}}},{\"title\":\"分析市场数据\",\"description\":\"分析收集到的市场数据，识别关键趋势\",\"instructions\":[\"分析收集到的市场数据\",\"识别主要市场趋势\",\"分析竞争格局\",\"预测未来发展方向\"]},{\"title\":\"创建市场分析报告\",\"description\":\"基于分析结果创建详细的市场分析报告\",\"functionCall\":{\"name\":\"createRecord\",\"arguments\":{\"type\":\"article\",\"title\":\"2026年AI市场分析报告\",\"content\":\"基于最新市场数据的详细分析报告\",\"tags\":[\"市场分析\",\"AI\"]}}},{\"title\":\"制定市场策略\",\"description\":\"根据分析报告制定市场策略\",\"instructions\":[\"基于市场分析报告\",\"制定详细的市场进入策略\",\"识别目标客户群体\",\"制定营销计划\"]}]}"
        }
      }
    }
  ]
}
```

#### 示例2：执行手动执行模式任务

```json
{
  "choices": [
    {
      "message": {
        "content": "好的，我来帮你执行这个市场调研任务。",
        "function_call": {
          "name": "executeTask",
          "arguments": "{\"taskId\":\"任务ID\"}"
        }
      }
    }
  ]
}
```

#### 示例3：执行下一个子任务

```json
{
  "choices": [
    {
      "message": {
        "content": "好的，第一个子任务已完成，现在执行下一个子任务。",
        "function_call": {
          "name": "executeNextSubtask",
          "arguments": "{\"taskId\":\"任务ID\"}"
        }
      }
    }
  ]
}
```

### 4. 手动执行模式WebSocket通知事件

在手动执行模式下，AI会收到以下WebSocket通知事件：

| 事件名称 | 描述 | 数据结构 |
|---------|------|----------|
| `task_update` | 任务状态更新 | `{taskId, status, progress, data}` |
| `subtask_complete` | 子任务执行完成 | `{taskId, subtaskIndex, result, timestamp}` |
| `subtask_error` | 子任务执行失败 | `{taskId, subtaskIndex, error, timestamp}` |
| `task_ready_for_subtask` | 任务准备执行下一个子任务 | `{taskId, subtaskIndex, timestamp}` |
| `task_complete` | 任务执行完成 | `{taskId, result, timestamp}` |
| `task_error` | 任务执行失败 | `{taskId, error, timestamp}` |

### 5. 手动执行模式最佳实践

1. **明确子任务依赖关系**：在创建任务时，确保子任务的顺序反映了它们之间的依赖关系
2. **设置合理的子任务粒度**：每个子任务应该是一个独立的、可执行的单元
3. **处理错误情况**：在收到子任务失败通知时，AI应该决定是否继续执行后续子任务
4. **提供清晰的执行反馈**：在每个子任务执行完成后，向用户提供清晰的执行结果反馈
5. **记录执行过程**：可以在子任务执行过程中创建记录，记录关键的执行结果和决策

### 6. 手动执行模式与自动执行模式对比

| 特性 | 手动执行模式 | 自动执行模式 |
|------|------------|------------|
| 执行控制 | AI控制执行顺序 | 系统自动执行所有子任务 |
| 子任务通知 | AI收到每个子任务的完成通知 | AI只收到最终任务完成通知 |
| 执行灵活性 | 高，可根据结果调整执行 | 低，固定执行顺序 |
| 适用场景 | 复杂、有依赖关系的任务 | 简单、无依赖关系的任务 |
| 执行流程 | 线性执行，确保顺序 | 并行或线性执行 |
| 错误处理 | AI可以决定是否继续执行 | 系统自动处理所有错误 |

### 7. 完整手动执行模式示例

#### 任务创建

```json
{
  "choices": [
    {
      "message": {
        "content": "好的，我来帮你创建一个产品开发流程任务。",
        "function_call": {
          "name": "createTask",
          "arguments": "{\"title\":\"产品开发流程\",\"description\":\"执行完整的产品开发流程，确保每个阶段完成后再进入下一个阶段\",\"executionMode\":\"manual\",\"subtasks\":[{\"title\":\"需求分析\",\"description\":\"分析用户需求和市场需求\",\"instructions\":[\"分析用户反馈和市场需求\",\"识别产品核心功能\",\"定义产品范围和目标\",\"生成需求文档\"]},{\"title\":\"设计阶段\",\"description\":\"基于需求文档进行产品设计\",\"instructions\":[\"创建产品原型\",\"设计用户界面\",\"定义技术架构\",\"生成设计文档\"]},{\"title\":\"开发阶段\",\"description\":\"基于设计文档进行产品开发\",\"instructions\":[\"搭建开发环境\",\"实现核心功能\",\"进行单元测试\",\"生成开发文档\"]},{\"title\":\"测试阶段\",\"description\":\"对开发完成的产品进行测试\",\"instructions\":[\"执行功能测试\",\"进行性能测试\",\"进行安全测试\",\"生成测试报告\"]},{\"title\":\"部署阶段\",\"description\":\"部署产品到生产环境\",\"instructions\":[\"准备部署环境\",\"执行部署流程\",\"进行验收测试\",\"生成部署文档\"]}]}"
        }
      }
    }
  ]
}
```

#### 任务执行流程

1. **执行任务**：调用 `executeTask` 函数执行任务
2. **执行第一个子任务**：系统自动执行"需求分析"子任务
3. **接收子任务完成通知**：AI收到"需求分析"子任务完成通知
4. **执行下一个子任务**：AI调用 `executeNextSubtask` 函数执行"设计阶段"子任务
5. **接收子任务完成通知**：AI收到"设计阶段"子任务完成通知
6. **执行下一个子任务**：AI调用 `executeNextSubtask` 函数执行"开发阶段"子任务
7. **接收子任务完成通知**：AI收到"开发阶段"子任务完成通知
8. **执行下一个子任务**：AI调用 `executeNextSubtask` 函数执行"测试阶段"子任务
9. **接收子任务完成通知**：AI收到"测试阶段"子任务完成通知
10. **执行下一个子任务**：AI调用 `executeNextSubtask` 函数执行"部署阶段"子任务
11. **接收子任务完成通知**：AI收到"部署阶段"子任务完成通知
12. **任务完成**：所有子任务执行完成，任务状态更新为已完成

**执行结果**：
- 完成了产品开发的完整流程
- 每个阶段都按照顺序执行
- AI收到了每个阶段的完成通知
- 可以根据每个阶段的执行结果调整后续阶段的执行

**使用场景**：
当用户需要执行有严格顺序要求的复杂任务时，手动执行模式提供了一种灵活、可控的执行方式，确保任务按照预期的顺序执行，同时允许AI根据每个阶段的执行结果做出相应的决策。

## 九、函数参数详细说明

### 任务相关函数参数

#### 1. createTask - 创建任务

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| title | string | 是 | 任务标题，简要描述任务目的 |
| description | string | 否 | 任务描述，详细说明任务内容 |
| params | object | 否 | 任务参数，用于存储任务执行所需的配置信息 |
| subtasks | array<object> | 否 | 子任务列表，每个子任务包含执行逻辑 |
| executionMode | string | 否 | 执行模式，默认值：auto |

**调用格式**：
```json
{
  "function_call": {
    "name": "createTask",
    "arguments": "{\"title\":\"任务标题\",\"description\":\"任务描述\",\"subtasks\":[{\"id\":\"subtask-1\",\"title\":\"子任务1\",\"description\":\"子任务描述\",\"functionCall\":{\"name\":\"createRecord\",\"arguments\":\"{\\\"type\\\":\\\"记录类型\\\",\\\"title\\\":\\\"记录标题\\\",\\\"content\\\":\\\"记录内容\\\"}\"}}],\"executionMode\":\"auto\"}"
  }
}
```

**子任务结构说明**：
每个子任务应包含以下字段：
- `id`：子任务ID，用于标识子任务
- `title`：子任务标题，简要描述子任务目的
- `description`：子任务描述，详细说明子任务内容
- `functionCall`：函数调用配置，包含函数名和参数

**子任务示例**：
```json
{
  "id": "subtask-1",
  "title": "创建记录",
  "description": "从对话内容中创建新的记录",
  "functionCall": {
    "name": "createRecord",
    "arguments": "{\"type\":\"记录类型\",\"title\":\"记录标题\",\"content\":\"记录内容\"}"
  }
}
```

#### 2. executeTask - 执行任务

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| taskId | string | 是 | 任务ID，指定要执行的任务 |

**调用格式**：
```json
{
  "function_call": {
    "name": "executeTask",
    "arguments": "{\"taskId\":\"任务ID\"}"
  }
}
```

#### 3. getTaskList - 获取任务列表

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| status | string | 否 | 任务状态，用于筛选特定状态的任务 |
| limit | integer | 否 | 返回任务数量限制，默认20 |

**调用格式**：
```json
{
  "function_call": {
    "name": "getTaskList",
    "arguments": "{\"status\":\"任务状态\",\"limit\":10}"
  }
}
```

#### 4. getTask - 获取任务详情

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| taskId | string | 是 | 任务ID，指定要获取详情的任务 |

**调用格式**：
```json
{
  "function_call": {
    "name": "getTask",
    "arguments": "{\"taskId\":\"任务ID\"}"
  }
}
```

#### 5. cancelTask - 取消任务

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| taskId | string | 是 | 任务ID，指定要取消的任务 |

**调用格式**：
```json
{
  "function_call": {
    "name": "cancelTask",
    "arguments": "{\"taskId\":\"任务ID\"}"
  }
}
```

### 记录相关函数参数

#### 1. createRecord - 创建记录

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| type | string | 是 | 记录类型，如todo、article等 |
| title | string | 是 | 记录标题，简要描述记录内容 |
| content | string | 是 | 记录内容，详细说明记录信息 |
| tags | array<string> | 否 | 记录标签，用于分类和搜索 |
| summary | string | 否 | 记录摘要，记录的简短总结 |
| status | string | 否 | 记录状态，默认值：pending |
| link | string | 否 | 记录链接，相关网页或文档的URL |
| startTime | string | 否 | 开始时间，格式：YYYY-MM-DD HH:mm:ss |
| endTime | string | 否 | 结束时间，格式：YYYY-MM-DD HH:mm:ss |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "创建记录",
  "description": "从对话内容中创建新的记录",
  "functionCall": {
    "name": "createRecord",
    "arguments": "{\"type\":\"记录类型\",\"title\":\"记录标题\",\"content\":\"记录内容\",\"tags\":[\"标签1\",\"标签2\"]}"
  }
}
```

#### 2. getRecordList - 获取记录列表

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| type | string | 否 | 记录类型，用于筛选特定类型的记录 |
| status | string | 否 | 记录状态，用于筛选特定状态的记录 |
| tags | array<string> | 否 | 记录标签，用于筛选包含特定标签的记录 |
| startDate | string | 否 | 开始日期，格式：YYYY-MM-DD |
| endDate | string | 否 | 结束日期，格式：YYYY-MM-DD |
| page | integer | 否 | 页码，默认1 |
| limit | integer | 否 | 每页数量，默认20 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "获取记录列表",
  "description": "获取用户的记录列表，支持多种筛选条件",
  "functionCall": {
    "name": "getRecordList",
    "arguments": "{\"type\":\"记录类型\",\"status\":\"记录状态\",\"page\":1,\"limit\":10}"
  }
}
```

#### 3. getRecord - 获取记录详情

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| recordId | string | 是 | 记录ID，指定要获取详情的记录 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "获取记录详情",
  "description": "获取指定记录的详细信息",
  "functionCall": {
    "name": "getRecord",
    "arguments": "{\"recordId\":\"记录ID\"}"
  }
}
```

#### 4. updateRecord - 更新记录

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| recordId | string | 是 | 记录ID，指定要更新的记录 |
| title | string | 否 | 记录标题，更新记录的标题 |
| content | string | 否 | 记录内容，更新记录的内容 |
| type | string | 否 | 记录类型，更新记录的类型 |
| status | string | 否 | 记录状态，更新记录的状态 |
| tags | array<string> | 否 | 记录标签，更新记录的标签 |
| link | string | 否 | 记录链接，更新记录的链接 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "更新记录",
  "description": "更新指定记录的信息",
  "functionCall": {
    "name": "updateRecord",
    "arguments": "{\"recordId\":\"记录ID\",\"status\":\"completed\",\"title\":\"更新后的标题\"}"
  }
}
```

#### 5. deleteRecord - 删除记录

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| recordId | string | 是 | 记录ID，指定要删除的记录 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "删除记录",
  "description": "删除指定的记录",
  "functionCall": {
    "name": "deleteRecord",
    "arguments": "{\"recordId\":\"记录ID\"}"
  }
}
```

#### 6. getRecentRecords - 获取最近的记录

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| limit | integer | 否 | 返回记录数量，默认5条 |
| type | string | 否 | 记录类型，用于筛选特定类型的记录 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "获取最近记录",
  "description": "获取用户最近创建的记录列表",
  "functionCall": {
    "name": "getRecentRecords",
    "arguments": "{\"limit\":5,\"type\":\"记录类型\"}"
  }
}
```

#### 7. searchRecords - 搜索记录

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| keyword | string | 是 | 搜索关键词，用于在记录标题和内容中搜索 |
| limit | integer | 否 | 返回记录数量，默认10条 |

**子任务调用格式**：
```json
{
  "id": "subtask-1",
  "title": "搜索记录",
  "description": "根据关键词搜索用户的记录",
  "functionCall": {
    "name": "searchRecords",
    "arguments": "{\"keyword\":\"搜索关键词\",\"limit\":10}"
  }
}
```

### 子任务中的函数调用参数

#### 系统函数调用

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| id | string | 否 | 子任务ID，用于标识子任务 |
| title | string | 是 | 子任务标题，简要描述子任务目的 |
| description | string | 否 | 子任务描述，详细说明子任务内容 |
| functionCall | object | 是 | 函数调用配置，包含函数名和参数 |

**调用格式**：
```json
{
  "id": "subtask-1",
  "title": "子任务标题",
  "description": "子任务描述",
  "functionCall": {
    "name": "createRecord",
    "arguments": "{\"type\":\"记录类型\",\"title\":\"记录标题\",\"content\":\"记录内容\"}"
  }
}
```

#### 模型工具调用

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| id | string | 否 | 子任务ID，用于标识子任务 |
| title | string | 是 | 子任务标题，简要描述子任务目的 |
| description | string | 否 | 子任务描述，详细说明子任务内容 |
| toolCall | object | 是 | 工具调用配置，包含工具名和参数 |

**调用格式**：
```json
{
  "id": "subtask-1",
  "title": "子任务标题",
  "description": "子任务描述",
  "toolCall": {
    "name": "Web_Search",
    "arguments": "{\"query\":\"搜索关键词\",\"limit\":5}"
  }
}
```

#### 大模型自行执行

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| id | string | 否 | 子任务ID，用于标识子任务 |
| title | string | 是 | 子任务标题，简要描述子任务目的 |
| description | string | 否 | 子任务描述，详细说明子任务内容 |
| instructions | array<string> | 是 | 执行指令，指导大模型如何执行任务 |

**调用格式**：
```json
{
  "id": "subtask-1",
  "title": "子任务标题",
  "description": "子任务描述",
  "instructions": [
    "执行指令1",
    "执行指令2",
    "执行指令3"
  ]
}
```

### 函数调用最佳实践

1. **参数完整性**：确保提供所有必填参数，选填参数根据实际需求添加
2. **JSON格式**：所有函数调用的arguments参数必须是有效的JSON字符串
3. **正确转义**：当arguments中包含嵌套的JSON时，需要正确转义引号和特殊字符
4. **参数验证**：在调用函数前，验证参数的有效性和合理性
5. **错误处理**：准备好处理函数调用可能返回的错误情况

这些参数说明可以帮助大模型更准确地构建函数调用，确保提供所有必要的参数，同时避免不必要的参数。


