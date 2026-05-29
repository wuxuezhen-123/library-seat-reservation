/**
 * 路由模块
 * 管理页面导航和权限控制
 */

const Router = {
    // 当前路由
    currentRoute: '',
    
    // 路由配置表
    routes: {
        'login': {
            title: '登录',
            component: 'LoginPage',
            requiresAuth: false
        },
        'student-home': {
            title: '学生首页',
            component: 'StudentHomePage',
            requiresAuth: true,
            allowedRoles: ['STUDENT']
        },
        'seat-browse': {
            title: '座位浏览',
            component: 'SeatBrowsePage',
            requiresAuth: true,
            allowedRoles: ['STUDENT', 'ADMIN']
        },
        'seat-reserve': {
            title: '座位预约',
            component: 'SeatReservePage',
            requiresAuth: true,
            allowedRoles: ['STUDENT']
        },
        'my-reservations': {
            title: '我的预约',
            component: 'MyReservationsPage',
            requiresAuth: true,
            allowedRoles: ['STUDENT']
        },
        'my-violations': {
            title: '违约记录',
            component: 'MyViolationsPage',
            requiresAuth: true,
            allowedRoles: ['STUDENT']
        },
        'admin-home': {
            title: '管理员首页',
            component: 'AdminHomePage',
            requiresAuth: true,
            allowedRoles: ['ADMIN']
        },
        'admin-seats': {
            title: '座位管理',
            component: 'AdminSeatsPage',
            requiresAuth: true,
            allowedRoles: ['ADMIN']
        },
        'admin-time-slots': {
            title: '时段管理',
            component: 'AdminTimeSlotsPage',
            requiresAuth: true,
            allowedRoles: ['ADMIN']
        },
        'admin-users': {
            title: '用户管理',
            component: 'AdminUsersPage',
            requiresAuth: true,
            allowedRoles: ['ADMIN']
        },
        'admin-violations': {
            title: '违约管理',
            component: 'AdminViolationsPage',
            requiresAuth: true,
            allowedRoles: ['ADMIN']
        },
        'checkin': {
            title: '签到签退',
            component: 'CheckInPage',
            requiresAuth: true,
            allowedRoles: ['ADMIN']
        }
    },

    /**
     * 初始化路由
     */
    init: () => {
        // 监听hash变化
        window.addEventListener('hashchange', Router.handleRouteChange);
        // 页面加载时处理路由
        Router.handleRouteChange();
    },

    /**
     * 处理路由变化
     */
    handleRouteChange: () => {
        const hash = window.location.hash.slice(1) || 'login';
        Router.currentRoute = hash;
        
        // 获取路由配置
        const route = Router.routes[hash];
        
        if (!route) {
            Router.navigate('login');
            return;
        }

        // 权限检查
        if (route.requiresAuth && !Utils.auth.isLoggedIn()) {
            Utils.message.warning('请先登录');
            Router.navigate('login');
            return;
        }

        // 角色权限检查
        if (route.requiresAuth && route.allowedRoles) {
            const user = Utils.auth.getUser();
            if (!user || !route.allowedRoles.includes(user.role)) {
                Utils.message.error('您没有权限访问此页面');
                // 根据用户角色跳转到对应首页
                if (Utils.auth.isAdmin()) {
                    Router.navigate('admin-home');
                } else if (Utils.auth.isStudent()) {
                    Router.navigate('student-home');
                } else {
                    Router.navigate('login');
                }
                return;
            }
        }

        // 更新页面标题
        document.title = route.title + ' - 图书馆座位预约系统';

        // 渲染页面组件
        Router.renderComponent(route.component);
    },

    /**
     * 渲染页面组件
     * @param {string} componentName 组件名称
     */
    renderComponent: async (componentName) => {
        const app = document.getElementById('app');
        
        // 动态导入组件并渲染
        const pageModule = window[componentName];
        if (pageModule && typeof pageModule.render === 'function') {
            Utils.dom.clear(app);
            try {
                const result = pageModule.render();
                // 处理 async 函数返回的 Promise
                const element = result instanceof Promise ? await result : result;
                if (element) {
                    app.appendChild(element);
                }
            } catch (err) {
                console.error(`组件 ${componentName} 渲染失败:`, err);
                Utils.message.error('系统发生错误，请刷新页面重试');
                app.innerHTML = '<div style="text-align: center; padding: 100px;">页面加载失败</div>';
            }
        } else {
            console.error(`组件 ${componentName} 未找到`);
            app.innerHTML = '<div style="text-align: center; padding: 100px;">页面加载失败</div>';
        }
    },

    /**
     * 导航到指定路由
     * @param {string} path 路由路径
     */
    navigate: (path) => {
        window.location.hash = path;
    },

    /**
     * 获取当前路由信息
     * @returns {object|null}
     */
    getCurrentRoute: () => {
        return Router.routes[Router.currentRoute] || null;
    },

    /**
     * 判断是否有权限访问路由
     * @param {string} path 路由路径
     * @returns {boolean}
     */
    canAccess: (path) => {
        const route = Router.routes[path];
        if (!route) return false;
        
        if (!route.requiresAuth) return true;
        
        if (!Utils.auth.isLoggedIn()) return false;
        
        if (route.allowedRoles) {
            const user = Utils.auth.getUser();
            return user && route.allowedRoles.includes(user.role);
        }
        
        return true;
    }
};

// 注册到全局
window.Router = Router;

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}