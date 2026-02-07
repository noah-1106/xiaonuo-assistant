          ]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "getRecordList",
        "description": "获取记录列表，支持筛选条件",
        "parameters": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "description": "记录类型"
            },
            "status": {
              "type": "string",
              "description": "记录状态"
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "记录标签"
            },
            "startDate": {
              "type": "string",
              "description": "开始日期，格式：YYYY-MM-DD"
            },
            "endDate": {
              "type": "string",
              "description": "结束日期，格式：YYYY-MM-DD"
            },
            "page": {
              "type": "integer",
              "description": "页码，默认1"
            },
            "limit": {
              "type": "integer",
              "description": "每页数量，默认20"
            }
          },
          "required": []
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "getRecord",
        "description": "获取单个记录详情",
        "parameters": {
          "type": "object",
          "properties": {
            "recordId": {
              "type": "string",
              "description": "记录ID"
            }
          },
          "required": [
            "recordId"
          ]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "updateRecord",
        "description": "更新记录",
        "parameters": {
          "type": "object",
          "properties": {
            "recordId": {
              "type": "string",
              "description": "记录ID"
            },
            "title": {
              "type": "string",
              "description": "记录标题"
            },
            "content": {
              "type": "string",
              "description": "记录内容"
            },
            "type": {
              "type": "string",
              "description": "记录类型"
            },
            "status": {
              "type": "string",
              "description": "记录状态"
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "记录标签"
            },
            "link": {
              "type": "string",
              "description": "记录链接"
            }
          },
          "required": [
            "recordId"
          ]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "deleteRecord",
        "description": "删除记录",
        "parameters": {
          "type": "object",
          "properties": {
            "recordId": {
              "type": "string",
              "description": "记录ID"
            }
          },
          "required": [
            "recordId"
          ]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "createTask",
        "description": "创建任务",
        "parameters": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "任务标题"
            },
            "description": {
              "type": "string",
              "description": "任务描述"
            },
            "params": {
              "type": "object",
              "description": "任务参数"
            },
            "subtasks": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "title": {
                    "type": "string",
                    "description": "子任务标题"
                  },
                  "description": {
                    "type": "string",
                    "description": "子任务描述"
                  },
                  "toolCall": {
                    "type": "object",
                    "description": "工具调用配置（推荐使用）",
                    "properties": {
                      "name": {
                        "type": "string",
                        "description": "工具名称，支持系统函数和模型工具"
                      },
                      "arguments": {
                        "type": "string",
                        "description": "工具参数JSON字符串"
                      }
                    },
                    "required": [
                      "name",
                      "arguments"
                    ]
                  },
                  "functionCall": {
                    "type": "object",
                    "description": "函数调用配置（向后兼容）",
                    "properties": {
                      "name": {
                        "type": "string",
                        "description": "函数名称"
                      },
                      "arguments": {
                        "type": "string",
                        "description": "函数参数JSON字符串"
                      }
                    },
                    "required": [
                      "name",
                      "arguments"
                    ]
                  },
                  "params": {
                    "type": "object",
                    "description": "子任务参数"
                  }
                }
              },
              "description": "子任务列表（推荐使用toolCall格式）"
            }
          },
          "required": [
            "title"
          ]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "executeTask",
        "description": "执行任务",
        "parameters": {
          "type": "object",
          "properties": {
            "taskId": {
              "type": "string",
              "description": "任务ID"
            }
          },
          "required": [
            "taskId"
          ]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "getTaskList",
        "description": "获取任务列表，支持筛选条件",
        "parameters": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "description": "任务状态"
            },
            "limit": {
              "type": "integer",
              "description": "限制数量，默认20"
            }
          },
          "required": []
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "getTask",
        "description": "获取任务详情",
        "parameters": {
          "type": "object",
          "properties": {
            "taskId": {
              "type": "string",
              "description": "任务ID"
            }
          },
          "required": [
            "taskId"
          ]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "getRecentRecords",
        "description": "获取最近的N条记录",
        "parameters": {
          "type": "object",
          "properties": {
            "limit": {
              "type": "integer",
              "description": "返回记录数量，默认5条"
            },
            "type": {
              "type": "string",
              "description": "记录类型，可选"
            }
          },
          "required": []
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "searchRecords",
        "description": "根据关键词搜索记录",
        "parameters": {
          "type": "object",
          "properties": {
            "keyword": {
              "type": "string",
              "description": "搜索关键词"
            },
            "limit": {
              "type": "integer",
              "description": "返回记录数量，默认10条"
            }
          },
          "required": [
            "keyword"
          ]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
请求大小: 4166 字符 (4.07 KB)
发送API请求 (尝试 1/2)
API请求成功，开始处理流式响应
豆包原生上下文ID存储成功: {
  userId: '697792dd2cd5890d4d9fd04b',
  contextId: '021770377368317d7aebdc22b756f3beceb07dc2954acf8491f0d'
}
流式响应处理完成: { contentLength: 0, hasContextId: true, finishReason: 'tool_calls' }
开始解析AI响应: {
  response: {
    type: 'text',
    content: '',
    finishReason: 'tool_calls',
    contextId: '021770377368317d7aebdc22b756f3beceb07dc2954acf8491f0d'
  }
}
使用模型适配器的解析方法
开始解析豆包AI响应:
{
  "type": "text",
  "content": "",
  "finishReason": "tool_calls",
  "contextId": "021770377368317d7aebdc22b756f3beceb07dc2954acf8491f0d"
}
响应已经是解析过的对象，直接返回
最终处理后的files: []
2026-02-06 19:29:40 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "POST",
    "url": "/api/chat/send",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 200,
    "statusMessage": "OK",
    "duration": "12602ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/tasks",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "ecawy9ppvm"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/tasks",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 204,
    "statusMessage": "No Content",
    "duration": "4ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/chat/sessions",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "hijjn94c92u"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/chat/sessions",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 204,
    "statusMessage": "No Content",
    "duration": "3ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/chat/sessions",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "4495plfba0r"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/chat/sessions",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 204,
    "statusMessage": "No Content",
    "duration": "0ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/tasks",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "a7s98f875nc"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/records",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "g0xljq6eg5"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/records",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 204,
    "statusMessage": "No Content",
    "duration": "1ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "ny0p5iht87a"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 204,
    "statusMessage": "No Content",
    "duration": "0ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/chat/sessions",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "iit1yjn0b6"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "3chprwva7wl"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 204,
    "statusMessage": "No Content",
    "duration": "0ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/records",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "g4mg3e39jf"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/?ide_webview_request_time=1770368294626",
    "correlationId": "04p2qssv9s1u"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "xwizs619ez"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/ai-settings/roles/enhanced",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/?ide_webview_request_time=1770368294626",
    "correlationId": "siid4ide99j"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/ai-settings/record-types",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/?ide_webview_request_time=1770368294626",
    "correlationId": "c6hbtqjenv"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/tasks",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "n65cjjk90m8"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/tasks",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 204,
    "statusMessage": "No Content",
    "duration": "0ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/records",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "zun7s5pg4yq"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "OPTIONS",
    "url": "/api/records",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 204,
    "statusMessage": "No Content",
    "duration": "1ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/tasks",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "ofmn67ezbka"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/records",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "iejo0yp56c"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 304,
    "statusMessage": "Not Modified",
    "duration": "98ms"
  }
}
2026-02-06 19:30:21 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 304,
    "statusMessage": "Not Modified",
    "duration": "104ms"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "4ne6amjsztl"
  }
}
2026-02-06 19:30:21 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/?ide_webview_request_time=1770368294626",
    "correlationId": "ivmjgi57gw"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/ai-settings/roles/enhanced",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 304,
    "statusMessage": "Not Modified",
    "duration": "137ms"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/ai-settings/record-types",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 304,
    "statusMessage": "Not Modified",
    "duration": "137ms"
  }
}
2026-02-06 19:30:22 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/ai-settings/roles/enhanced",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/?ide_webview_request_time=1770368294626",
    "correlationId": "tkh8vctzt6l"
  }
}
2026-02-06 19:30:22 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/ai-settings/record-types",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/?ide_webview_request_time=1770368294626",
    "correlationId": "0fyeshmuzd7"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 304,
    "statusMessage": "Not Modified",
    "duration": "44ms"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/auth/me",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 304,
    "statusMessage": "Not Modified",
    "duration": "31ms"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/ai-settings/roles/enhanced",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 304,
    "statusMessage": "Not Modified",
    "duration": "28ms"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/records",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 200,
    "statusMessage": "OK",
    "duration": "180ms"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/records",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 200,
    "statusMessage": "OK",
    "duration": "174ms"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/ai-settings/record-types",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 304,
    "statusMessage": "Not Modified",
    "duration": "51ms"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/tasks",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 200,
    "statusMessage": "OK",
    "duration": "205ms"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/tasks",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 200,
    "statusMessage": "OK",
    "duration": "229ms"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/chat/sessions",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 200,
    "statusMessage": "OK",
    "duration": "229ms"
  }
}
2026-02-06 19:30:22 info: Request started {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/chat/sessions",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
    "referer": "http://localhost:5173/",
    "correlationId": "8xknn1ov3qp"
  }
}
2026-02-06 19:30:22 info: Request completed {
  "service": "xiaonuo-backend",
  "environment": "development",
  "version": "1.0.0",
  "request": {
    "method": "GET",
    "url": "/api/chat/sessions",
    "ip": "::1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) TraeCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"
  },
  "response": {
    "statusCode": 304,
    "statusMessage": "Not Modified",
    "duration": "31ms"