/**
 * 日志工具模块
 * @module utils/logger
 */

import winston from 'winston';
import { appConfig } from '../config';

/**
 * 日志格式化
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  appConfig.log.format === 'json'
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
          msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
      })
);

/**
 * 日志传输配置
 */
const transports: winston.transport[] = [
  // 控制台输出
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), logFormat),
  }),
];

// 如果配置了日志文件路径，添加文件传输
if (appConfig.log.filePath) {
  transports.push(
    new winston.transports.File({
      filename: appConfig.log.filePath,
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * 日志实例
 */
export const logger = winston.createLogger({
  level: appConfig.log.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

export default logger;
