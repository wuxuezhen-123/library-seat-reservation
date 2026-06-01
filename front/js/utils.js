/**
 * 工具函数模块
 * 提供常用工具方法，包括存储、日期处理、验证等
 */

const Utils = {
    // localStorage操作
    storage: {
        /**
         * 设置存储
         * @param {string} key 键名
         * @param {any} value 值
         */
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('localStorage设置失败:', e);
            }
        },

        /**
         * 获取存储
         * @param {string} key 键名
         * @param {any} defaultValue 默认值
         * @returns {any}
         */
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('localStorage读取失败:', e);
                return defaultValue;
            }
        },

        /**
         * 删除存储
         * @param {string} key 键名
         */
        remove: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('localStorage删除失败:', e);
            }
        },

        /**
         * 清空存储
         */
        clear: () => {
            try {
                localStorage.clear();
            } catch (e) {
                console.error('localStorage清空失败:', e);
            }
        }
    },

    // 日期工具
    date: {
        /**
         * 获取今天的日期字符串
         * @returns {string} YYYY-MM-DD格式
         */
        today: () => {
            const now = new Date();
            return now.toISOString().split('T')[0];
        },

        /**
         * 获取未来几天的日期
         * @param {number} days 天数
         * @returns {string} YYYY-MM-DD格式
         */
        addDays: (days) => {
            const date = new Date();
            date.setDate(date.getDate() + days);
            return date.toISOString().split('T')[0];
        },

        /**
         * 格式化日期显示
         * @param {string} dateStr 日期字符串
         * @returns {string} 格式化后的日期
         */
        format: (dateStr) => {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const weekDay = weekDays[date.getDay()];
            return `${year}-${month}-${day} ${weekDay}`;
        },

        /**
         * 判断日期是否过期
         * @param {string} dateStr 日期字符串
         * @returns {boolean}
         */
        isExpired: (dateStr) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(dateStr);
            return target < today;
        }
    },

    // 权限验证
    auth: {
        /**
         * 获取当前用户信息
         * @returns {object|null} 用户对象
         */
        getUser: () => {
            return Utils.storage.get('user', null);
        },

        /**
         * 设置用户信息
         * @param {object} user 用户对象
         */
        setUser: (user) => {
            Utils.storage.set('user', user);
        },

        /**
         * 清除用户信息（登出）
         */
        clearUser: () => {
            Utils.storage.remove('user');
        },

        /**
         * 检查是否已登录
         * @returns {boolean}
         */
        isLoggedIn: () => {
            return !!Utils.storage.get('user', null);
        },

        /**
         * 检查是否为管理员
         * @returns {boolean}
         */
        isAdmin: () => {
            const user = Utils.auth.getUser();
            return user && user.role === 'ADMIN';
        },

        /**
         * 检查是否为学生
         * @returns {boolean}
         */
        isStudent: () => {
            const user = Utils.auth.getUser();
            return user && user.role === 'STUDENT';
        },

        /**
         * 检查是否有权限访问页面
         * @param {string} page 页面名称
         * @returns {boolean}
         */
        hasAccess: (page) => {
            const user = Utils.getUser();
            if (!user) return false;

            // 管理员可访问所有页面
            if (user.role === 'ADMIN') {
                return true;
            }

            // 学生可访问的页面
            const studentPages = [
                'student-home',
                'seat-browse',
                'seat-reserve',
                'my-reservations',
                'my-violations',
                'checkin'
            ];

            return studentPages.includes(page);
        }
    },

    // 表单验证
    validate: {
        /**
         * 验证用户名
         * @param {string} username 用户名
         * @returns {string|null} 错误信息
         */
        username: (username) => {
            if (!username || username.trim() === '') {
                return '请输入账号';
            }
            if (username.length < 3 || username.length > 20) {
                return '账号长度需在3-20字符之间';
            }
            return null;
        },

        /**
         * 验证密码
         * @param {string} password 密码
         * @returns {string|null} 错误信息
         */
        password: (password) => {
            if (!password || password.trim() === '') {
                return '请输入密码';
            }
            if (password.length < 6) {
                return '密码长度需至少6位';
            }
            return null;
        },

        /**
         * 验证座位号
         * @param {string} seatNumber 座位号
         * @returns {string|null} 错误信息
         */
        seatNumber: (seatNumber) => {
            if (!seatNumber) {
                return '请选择座位';
            }
            return null;
        },

        /**
         * 验证日期
         * @param {string} date 日期
         * @returns {string|null} 错误信息
         */
        date: (date) => {
            if (!date) {
                return '请选择日期';
            }
            if (Utils.date.isExpired(date)) {
                return '日期不能早于今天';
            }
            return null;
        },

        /**
         * 验证时段
         * @param {string} timeSlot 时段
         * @returns {string|null} 错误信息
         */
        timeSlot: (timeSlot) => {
            if (!timeSlot) {
                return '请选择时段';
            }
            return null;
        }
    },

    // 消息提示
    message: {
        /**
         * 显示成功消息
         * @param {string} text 消息内容
         */
        success: (text) => {
            Utils.message.show(text, 'success');
        },

        /**
         * 显示错误消息
         * @param {string} text 消息内容
         */
        error: (text) => {
            Utils.message.show(text, 'error');
        },

        /**
         * 显示警告消息
         * @param {string} text 消息内容
         */
        warning: (text) => {
            Utils.message.show(text, 'warning');
        },

        /**
         * 显示消息
         * @param {string} text 消息内容
         * @param {string} type 消息类型
         */
        show: (text, type = 'info') => {
            // 创建消息元素
            const messageEl = document.createElement('div');
            messageEl.className = `alert alert-${type}`;
            messageEl.textContent = text;
            messageEl.style.position = 'fixed';
            messageEl.style.top = '20px';
            messageEl.style.right = '20px';
            messageEl.style.zIndex = '9999';
            messageEl.style.minWidth = '200px';
            
            document.body.appendChild(messageEl);

            // 3秒后自动消失
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 3000);
        }
    },

    // DOM操作
    dom: {
        /**
         * 创建元素
         * @param {string} tag 标签名
         * @param {object} attrs 属性对象
         * @param {string} content 内容
         * @returns {HTMLElement}
         */
        create: (tag, attrs = {}, content = '') => {
            const el = document.createElement(tag);
            for (const key in attrs) {
                if (key === 'className') {
                    el.className = attrs[key];
                } else if (key === 'textContent') {
                    el.textContent = attrs[key];
                } else {
                    el.setAttribute(key, attrs[key]);
                }
            }
            el.textContent = content;
            return el;
        },

        /**
         * 清空元素内容
         * @param {HTMLElement} el 元素
         */
        clear: (el) => {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        },

        /**
         * 渲染模板
         * @param {string} template HTML模板字符串
         * @returns {HTMLElement}
         */
        render: (template) => {
            const temp = document.createElement('div');
            temp.innerHTML = template;
            return temp.firstElementChild;
        }
    }
};

// 导出供其他模块使用
// 注册到全局
window.Utils = Utils;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}