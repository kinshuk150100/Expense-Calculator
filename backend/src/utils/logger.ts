/**
 * Simple logging utility
 * In production, replace with a proper logging library (Winston, Pino, etc.)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    if (data !== undefined && data !== null) {
      entry.data = data;
    }
    return entry;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry = this.formatMessage(level, message, data);
    
    // In production, send to logging service
    // For now, use console with structured format
    if (process.env.NODE_ENV === 'production') {
      // In production, only log errors and warnings
      if (level === 'error' || level === 'warn') {
        console.error(JSON.stringify(entry));
      }
    } else {
      // In development, log everything
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn : 
                       console.log;
      logMethod(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, data);
    }
  }
}

export const logger = new Logger();

