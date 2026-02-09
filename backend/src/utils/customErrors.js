/**
 * 自定义错误类
 */

// 基础错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Bad Request - 请求参数错误
class BadRequestError extends AppError {
  constructor(message = '请求参数错误') {
    super(message, 400);
  }
}

// 401 Unauthorized - 未授权访问
class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 401);
  }
}

// 403 Forbidden - 禁止访问
class ForbiddenError extends AppError {
  constructor(message = '禁止访问') {
    super(message, 403);
  }
}

// 404 Not Found - 资源不存在
class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404);
  }
}

// 409 Conflict - 资源冲突
class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409);
  }
}

// 422 Unprocessable Entity - 无法处理的实体
class UnprocessableEntityError extends AppError {
  constructor(message = '无法处理的实体') {
    super(message, 422);
  }
}

// 429 Too Many Requests - 请求过多
class TooManyRequestsError extends AppError {
  constructor(message = '请求过多，请稍后重试') {
    super(message, 429);
  }
}

// 500 Internal Server Error - 服务器内部错误
class InternalServerError extends AppError {
  constructor(message = '服务器内部错误') {
    super(message, 500);
  }
}

// 502 Bad Gateway - 网关错误
class BadGatewayError extends AppError {
  constructor(message = '网关错误') {
    super(message, 502);
  }
}

// 503 Service Unavailable - 服务不可用
class ServiceUnavailableError extends AppError {
  constructor(message = '服务暂时不可用') {
    super(message, 503);
  }
}



module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError
};