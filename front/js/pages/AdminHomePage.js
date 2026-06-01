/**
 * 管理员首页组件
 * 显示数据概览和所有管理入口
 */

const AdminHomePage = {
    /**
     * 渲染管理员首页
     * @returns {HTMLElement}
     */
    render: () => {
        const template = `
            <div class="layout-container">
                <!-- 侧边栏 -->
                <div class="sidebar">
                    <div class="sidebar-header">管理员控制台</div>
                    <ul class="sidebar-nav">
                        <li><a href="#/admin-home" class="active">首页</a></li>
                        <li><a href="#/seat-browse">座位浏览</a></li>
                        <li><a href="#/admin-seats">座位管理</a></li>
                        <li><a href="#/admin-time-slots">时段管理</a></li>
                        <li><a href="#/admin-users">用户管理</a></li>
                        <li><a href="#/admin-violations">违约管理</a></li>
                        <li><a href="#/checkin">签到签退</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <h1 class="page-title">数据概览</h1>
                    
                    <!-- 统计卡片 -->
                    <div class="stats-row">
                        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <div class="stat-icon">🪑</div>
                            <div class="stat-info">
                                <div class="stat-number" id="stat-total-seats">0</div>
                                <div class="stat-label">总座位数</div>
                            </div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);">
                            <div class="stat-icon">✅</div>
                            <div class="stat-info">
                                <div class="stat-number" id="stat-free-seats">0</div>
                                <div class="stat-label">空闲座位</div>
                            </div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #f6ad55 0%, #dd6b20 100%);">
                            <div class="stat-icon">📅</div>
                            <div class="stat-info">
                                <div class="stat-number" id="stat-today-reservations">0</div>
                                <div class="stat-label">今日预约</div>
                            </div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);">
                            <div class="stat-icon">👥</div>
                            <div class="stat-info">
                                <div class="stat-number" id="stat-total-users">0</div>
                                <div class="stat-label">总用户数</div>
                            </div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);">
                            <div class="stat-icon">⚠️</div>
                            <div class="stat-info">
                                <div class="stat-number" id="stat-total-violations">0</div>
                                <div class="stat-label">违约次数</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 快捷操作 -->
                    <div class="card">
                        <h3 class="card-title">管理入口</h3>
                        <div class="quick-actions">
                            <div class="action-card" id="action-seats">
                                <div class="action-icon">🪑</div>
                                <div class="action-title">座位管理</div>
                                <div class="action-desc">管理座位信息</div>
                            </div>
                            <div class="action-card" id="action-time-slots">
                                <div class="action-icon">⏰</div>
                                <div class="action-title">时段管理</div>
                                <div class="action-desc">设置预约时段</div>
                            </div>
                            <div class="action-card" id="action-users">
                                <div class="action-icon">👥</div>
                                <div class="action-title">用户管理</div>
                                <div class="action-desc">管理学生账号</div>
                            </div>
                            <div class="action-card" id="action-violations">
                                <div class="action-icon">⚠️</div>
                                <div class="action-title">违约管理</div>
                                <div class="action-desc">处理违约记录</div>
                            </div>
                            <div class="action-card" id="action-browse">
                                <div class="action-icon">🔍</div>
                                <div class="action-title">座位浏览</div>
                                <div class="action-desc">查看座位状态</div>
                            </div>
                            <div class="action-card" id="action-checkin">
                                <div class="action-icon">✅</div>
                                <div class="action-title">签到签退</div>
                                <div class="action-desc">管理签到签退</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 系统状态 -->
                    <div class="card">
                        <h3 class="card-title">📊 系统状态</h3>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                            <div style="text-align: center; padding: 15px; background: #f7fafc; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: 700; color: #667eea;">运行中</div>
                                <div style="font-size: 12px; color: #718096; margin-top: 5px;">系统状态</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: #f7fafc; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: 700; color: #48bb78;">正常</div>
                                <div style="font-size: 12px; color: #718096; margin-top: 5px;">数据库连接</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: #f7fafc; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: 700; color: #38a169;">在线</div>
                                <div style="font-size: 12px; color: #718096; margin-top: 5px;">服务状态</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: #f7fafc; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: 700; color: #2f855a;">稳定</div>
                                <div style="font-size: 12px; color: #718096; margin-top: 5px;">响应延迟</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        AdminHomePage.bindEvents(el);
        AdminHomePage.loadStatistics(el);
        return el;
    },

    /**
     * 绑定事件
     * @param {HTMLElement} el 容器元素
     */
    bindEvents: (el) => {
        // 退出登录
        el.querySelector('#logout-btn').addEventListener('click', () => {
            if (confirm('确定要退出登录吗？')) {
                Utils.auth.clearUser();
                Utils.message.success('已退出登录');
                Router.navigate('login');
            }
        });

        // 快捷操作跳转
        el.querySelector('#action-seats').addEventListener('click', () => {
            Router.navigate('admin-seats');
        });

        el.querySelector('#action-time-slots').addEventListener('click', () => {
            Router.navigate('admin-time-slots');
        });

        el.querySelector('#action-users').addEventListener('click', () => {
            Router.navigate('admin-users');
        });

        el.querySelector('#action-violations').addEventListener('click', () => {
            Router.navigate('admin-violations');
        });

        el.querySelector('#action-browse').addEventListener('click', () => {
            Router.navigate('seat-browse');
        });

        el.querySelector('#action-checkin').addEventListener('click', () => {
            Router.navigate('checkin');
        });
    },

    /**
     * 加载统计数据
     * @param {HTMLElement} el 容器元素
     */
    loadStatistics: async (el) => {
        try {
            const response = await API.getStatistics();
            
            if (response.code === 200 && response.data) {
                const stats = response.data;
                
                // 更新统计数字
                const statTotalSeats = el.querySelector('#stat-total-seats');
                const statFreeSeats = el.querySelector('#stat-free-seats');
                const statTodayReservations = el.querySelector('#stat-today-reservations');
                const statTotalUsers = el.querySelector('#stat-total-users');
                const statTotalViolations = el.querySelector('#stat-total-violations');
                
                if (statTotalSeats) statTotalSeats.textContent = stats.totalSeats || 0;
                if (statFreeSeats) statFreeSeats.textContent = stats.freeSeats || 0;
                if (statTodayReservations) statTodayReservations.textContent = stats.todayReservations || 0;
                if (statTotalUsers) statTotalUsers.textContent = stats.totalUsers || 0;
                if (statTotalViolations) statTotalViolations.textContent = stats.totalViolations || 0;
            }
        } catch (err) {
            console.error('加载统计数据失败:', err);
        }
    }
};

// 注册到全局
window.AdminHomePage = AdminHomePage;