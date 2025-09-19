// 🔧 Configuration File - ระบบประเมินการสอนออนไลน์
// Version: 3.0.0 - Production Configuration

window.EVALUATION_SYSTEM_CONFIG = {
    // API Configuration
    API_URL: 'https://script.google.com/macros/s/AKfycbyDsRhqstfIuLPVhQdVo0Pkh-tXBj3-_6VZ-gA7UB1C-2v7DBUCiDTE358m3v1ojA/exec',
    
    // System Settings
    VERSION: '3.0.0',
    SYSTEM_NAME: 'ระบบประเมินการสอนออนไลน์',
    ENVIRONMENT: 'production', // 'development' | 'production'
    
    // Request Settings
    REQUEST_TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    
    // UI Settings
    TOAST_DURATION: 5000, // 5 seconds
    ANIMATION_DURATION: 300, // milliseconds
    
    // Validation Rules - รองรับภาษาไทยและอักขระพิเศษ
    COURSE_CODE_MIN_LENGTH: 2,
    COURSE_CODE_MAX_LENGTH: 50,
    COURSE_NAME_MIN_LENGTH: 2,
    COURSE_NAME_MAX_LENGTH: 200,
    COMMENT_MAX_LENGTH: 1000,
    
    // Google Sheets Settings
    SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/1OO9aQOV1yV0JgquZTLFOweb6vUVZOnShGKIo5JzxMdY/edit?usp=sharing',
    
    // Analytics
    ENABLE_ANALYTICS: true,
    TRACK_ERRORS: true,
    
    // Debug Mode
    DEBUG: false, // Set to true for development
    
    // UI Colors
    COLORS: {
        PRIMARY: '#4f46e5',
        SECONDARY: '#7c3aed',
        SUCCESS: '#10b981',
        WARNING: '#f59e0b',
        DANGER: '#ef4444',
        INFO: '#3b82f6'
    },
    
    // Rating Scale
    RATING_SCALE: {
        MIN: 1,
        MAX: 5,
        LABELS: {
            1: 'ไม่พอใจ',
            2: 'พอใจน้อย',
            3: 'ปานกลาง',
            4: 'พอใจ',
            5: 'พอใจมาก'
        }
    }
};

// Utility Functions
window.EvaluationUtils = {
    // API Request with retry logic
    async apiRequest(data, options = {}) {
        const config = window.EVALUATION_SYSTEM_CONFIG;
        const { retries = config.RETRY_ATTEMPTS, timeout = config.REQUEST_TIMEOUT } = options;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(config.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8',
                    },
                    body: JSON.stringify(data),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (config.DEBUG) {
                    console.log('API Request:', data);
                    console.log('API Response:', result);
                }
                
                return result;
                
            } catch (error) {
                if (attempt === retries) {
                    if (config.TRACK_ERRORS) {
                        console.error('API Request Failed:', {
                            data,
                            error: error.message,
                            attempt: attempt + 1
                        });
                    }
                    throw error;
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY * (attempt + 1)));
            }
        }
    },
    
    // Show notification
    showNotification(message, type = 'info', duration = null) {
        const config = window.EVALUATION_SYSTEM_CONFIG;
        duration = duration || config.TOAST_DURATION;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    padding: 16px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    font-family: 'Inter', sans-serif;
                    animation: slideInRight 0.3s ease;
                }
                .notification-info { background: #eff6ff; border: 1px solid #3b82f6; color: #1e40af; }
                .notification-success { background: #dcfce7; border: 1px solid #10b981; color: #166534; }
                .notification-warning { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; }
                .notification-error { background: #fef2f2; border: 1px solid #ef4444; color: #991b1b; }
                .notification-content { display: flex; align-items: center; gap: 12px; }
                .notification-close { background: none; border: none; cursor: pointer; opacity: 0.7; }
                .notification-close:hover { opacity: 1; }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    },
    
    getNotificationIcon(type) {
        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle'
        };
        return icons[type] || icons.info;
    },
    
    // Validate course data - รองรับภาษาไทยและอักขระพิเศษ
    validateCourseData(data) {
        const config = window.EVALUATION_SYSTEM_CONFIG;
        const errors = [];

        // ตรวจสอบรหัสหลักสูตร - รองรับทุกภาษาและอักขระพิเศษ
        if (!data.code || data.code.trim().length < config.COURSE_CODE_MIN_LENGTH || data.code.trim().length > config.COURSE_CODE_MAX_LENGTH) {
            errors.push(`รหัสหลักสูตรต้องมีความยาว ${config.COURSE_CODE_MIN_LENGTH}-${config.COURSE_CODE_MAX_LENGTH} ตัวอักษร`);
        }

        // ตรวจสอบชื่อหลักสูตร
        if (!data.name || data.name.trim().length < config.COURSE_NAME_MIN_LENGTH) {
            errors.push(`ชื่อหลักสูตรต้องมีอย่างน้อย ${config.COURSE_NAME_MIN_LENGTH} ตัวอักษร`);
        }

        if (data.name && data.name.trim().length > config.COURSE_NAME_MAX_LENGTH) {
            errors.push(`ชื่อหลักสูตรต้องไม่เกิน ${config.COURSE_NAME_MAX_LENGTH} ตัวอักษร`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    // Format date/time
    formatDateTime(date = new Date()) {
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Generate random ID
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    const config = window.EVALUATION_SYSTEM_CONFIG;
    
    if (config.DEBUG) {
        console.log('🎓 Evaluation System Initialized', {
            version: config.VERSION,
            environment: config.ENVIRONMENT,
            timestamp: new Date().toISOString()
        });
    }
    
    // Add system info to page
    const systemInfo = document.createElement('meta');
    systemInfo.name = 'evaluation-system-version';
    systemInfo.content = config.VERSION;
    document.head.appendChild(systemInfo);
});

// Global error handler
window.addEventListener('error', (event) => {
    const config = window.EVALUATION_SYSTEM_CONFIG;
    
    if (config.TRACK_ERRORS && config.DEBUG) {
        console.error('Global Error:', {
            message: event.error?.message || event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
        });
    }
});

// Create alias for backward compatibility
window.CONFIG = window.EVALUATION_SYSTEM_CONFIG;

// Export for modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.EVALUATION_SYSTEM_CONFIG;
}