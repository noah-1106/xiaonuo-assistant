响应完成，设置 finishReason: stop
从完成事件中提取完整内容: {
  "choices": [
    {
      "message": {
        "content": "已帮您创建了1条灵感记录，随时可以查看哦~ 🎨",
        "tool_calls": [
          {
            "function": {
              "name": "createRecord",
              "arguments": "{\"type\":\"inspiration\",\"title\":\"做个小棉袄\",\"content\":\"灵感：设计制作一件小棉袄\",\"tags\":[\"灵感\",\"手工\"]}"
            }
          }
        ]
      }
    }
  ]
}
收到流式响应数据: data: [DONE]


响应结束，开始处理最终结果
最终内容长度: 374
最终内容: {
  "choices": [
    {
      "message": {
        "content": "已帮您创建了1条灵感记录，随时可以查看哦~ 🎨",
        "tool_calls": [
          {
            "function": {
              "name": "createRecord",
              "arguments": "{\"type\":\"inspiration\",\"title\":\"做个小棉袄\",\"content\":\"灵感：设计制作一件小棉袄\",\"tags\":[\"灵感\",\"手工\"]}"
            }
          }
        ]
      }
    }
  ]
}
最终 responseId: null
最终 finishReason: stop
工具调用缓冲区: 空
构建普通文本响应
最终响应结果: {
  "type": "text",
  "content": "{\n  \"choices\": [\n    {\n      \"message\": {\n        \"content\": \"已帮您创建了1条灵感记录，随时可以查看哦~ 🎨\",\n        \"tool_calls\": [\n          {\n            \"function\": {\n              \"name\": \"createRecord\",\n              \"arguments\": \"{\\\"type\\\":\\\"inspiration\\\",\\\"title\\\":\\\"做个小棉袄\\\",\\\"content\\\":\\\"灵感：设计制作一件小棉袄\\\",\\\"tags\\\":[\\\"灵感\\\",\\\"手工\\\"]}\"\n            }\n          }\n        ]\n      }\n    }\n  ]\n}",
  "finishReason": "stop",
  "responseId": null
}
流式响应处理完成: { contentLength: 374, hasResponseId: false, finishReason: 'stop' }
开始解析AI响应: {
  response: {
    type: 'text',
    content: '{\n' +
      '  "choices": [\n' +
      '    {\n' +
      '      "message": {\n' +
      '        "content": "已帮您创建了1条灵感记录，随时可以查看哦~ 🎨",\n' +
      '        "tool_calls": [\n' +
      '          {\n' +
      '            "function": {\n' +
      '              "name": "createRecord",\n' +
      '              "arguments": "{\\"type\\":\\"inspiration\\",\\"title\\":\\"做个小棉袄\\",\\"content\\":\\"灵感：设计制作一件小棉袄\\",\\"tags\\":[\\"灵感\\",\\"手工\\"]}"\n' +
      '            }\n' +
      '          }\n' +
      '        ]\n' +
      '      }\n' +
      '    }\n' +
      '  ]\n' +
      '}',
    finishReason: 'stop',
    responseId: null
  }
}
响应已经是解析过的对象，直接返回
获取到 Response ID: null
最终处理后的files: []
2026-02-09 04:59:15 info: Request completed {
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
    "duration": "11058ms"
  }