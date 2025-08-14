// src/utils/debugLogger.ts
export class DebugLogger {
  private component: string;
  private isEnabled: boolean;

  constructor(component: string, enabled: boolean = __DEV__) {
    this.component = component;
    this.isEnabled = enabled;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] [${this.component}] ${message}`;
    
    if (data) {
      return `${baseMessage}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  log(message: string, data?: any): void {
    if (this.isEnabled) {
      console.log(this.formatMessage('INFO', message, data));
    }
  }

  success(message: string, data?: any): void {
    if (this.isEnabled) {
      console.log(this.formatMessage('✅ SUCCESS', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.isEnabled) {
      console.warn(this.formatMessage('⚠️ WARNING', message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.isEnabled) {
      console.error(this.formatMessage('❌ ERROR', message, error));
    }
  }

  firebase(operation: string, data?: any): void {
    if (this.isEnabled) {
      console.log(this.formatMessage('🔥 FIREBASE', operation, data));
    }
  }

  database(operation: string, data?: any): void {
    if (this.isEnabled) {
      console.log(this.formatMessage('💾 DATABASE', operation, data));
    }
  }

  camera(operation: string, data?: any): void {
    if (this.isEnabled) {
      console.log(this.formatMessage('📷 CAMERA', operation, data));
    }
  }

  // Method to enable/disable logging at runtime
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Method to log performance metrics
  performance(operation: string, startTime: number, endTime?: number): number {
    const end = endTime || Date.now();
    const duration = end - startTime;
    this.log(`Performance: ${operation} took ${duration}ms`);
    return duration;
  }

  /**
   * Starts a timer and returns a function to stop it and log the duration.
   * Usage:
   *    const endTimer = logger.startTimer('Some Task');
   *    // ... do work ...
   *    const duration = endTimer(); // logs + returns elapsed ms
   */
  startTimer(label: string): () => number {
    const startTime = Date.now();
    this.log(`⏱️ Timer started: ${label}`);
    
    return () => {
      return this.performance(label, startTime);
    };
  }
}
