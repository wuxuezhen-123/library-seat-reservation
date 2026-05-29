/**
 * 个人预约记录页面组件
 * 显示所有预约记录，支持取消预约，展示状态：待签到、已签到、已完成、已取消
 */

const MyReservationsPage = {
    // 防止重复点击
    isCancelling: false,
    
    /**
     * 渲染个人预约记录页面
     * @returns {HTMLElement}
     */
    render: () => {
        const template = `
            <div class="layout-container">
                <!-- 侧边栏 -->
                <div class="sidebar">
                    <div class="sidebar-header">学生控制台</div>
                    <ul class="sidebar-nav">
                        <li><a href="#/student-home">首页</a></li>
                        <li><a href="#/seat-browse">座位浏览</a></li>
                        <li><a href="#/seat-reserve">预约座位</a></li>
                        <li><a href="#/my-reservations" class="active">我的预约</a></li>
                        <li><a href="#/my-violations">违约记录</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <h1 class="page-title">我的预约</h1>
                    
                    <!-- 统计信息 -->
                    <div class="stats-row">
                        <div class="stat-card">
                            <div class="stat-number" id="stat-all">0</div>
                            <div class="stat-label">全部预约</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="stat-pending">0</div>
                            <div class="stat-label">待签到</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="stat-active">0</div>
                            <div class="stat-label">已签到</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="stat-completed">0</div>
                            <div class="stat-label">已完成</div>
                        </div>
                    </div>
                    
                    <!-- 选项卡 -->
                    <div class="tab-container">
                        <button class="tab-item active" id="tab-all">全部</button>
                        <button class="tab-item" id="tab-pending">待签到</button>
                        <button class="tab-item" id="tab-active">已签到</button>
                        <button class="tab-item" id="tab-completed">已完成</button>
                        <button class="tab-item" id="tab-cancelled">已取消</button>
                    </div>
                    
                    <!-- 预约列表 -->
                    <div class="card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>座位号</th>
                                    <th>区域</th>
                                    <th>日期</th>
                                    <th>时段</th>
                                    <th>状态</th>
                                    <th>签到时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="reservations-body">
                                <tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        MyReservationsPage.bindEvents(el);
        MyReservationsPage.loadReservations(el, 'all');
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

        // 选项卡切换
        el.querySelector('#tab-all').addEventListener('click', () => {
            MyReservationsPage.switchTab(el, 'all');
        });

        el.querySelector('#tab-pending').addEventListener('click', () => {
            MyReservationsPage.switchTab(el, 'pending');
        });

        el.querySelector('#tab-active').addEventListener('click', () => {
            MyReservationsPage.switchTab(el, 'active');
        });

        el.querySelector('#tab-completed').addEventListener('click', () => {
            MyReservationsPage.switchTab(el, 'completed');
        });

        el.querySelector('#tab-cancelled').addEventListener('click', () => {
            MyReservationsPage.switchTab(el, 'cancelled');
        });
    },

    /**
     * 切换选项卡
     * @param {HTMLElement} el 容器元素
     * @param {string} tab 选项卡名称
     */
    switchTab: (el, tab) => {
        el.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
        el.querySelector(`#tab-${tab}`).classList.add('active');
        MyReservationsPage.loadReservations(el, tab);
    },

    /**
     * 加载预约列表
     * @param {HTMLElement} el 容器元素
     * @param {string} status 状态筛选
     */
    loadReservations: async (el, status) => {
        const tbody = el.querySelector('#reservations-body');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>';

        try {
            const response = await API.getUserReservations();
            
            if (response.code === 200 && response.data) {
                let reservations = response.data;

                // 更新统计数据
                MyReservationsPage.updateStats(reservations);

                // 状态筛选
                if (status === 'pending') {
                    reservations = reservations.filter(r => r.status === 'RESERVED');
                } else if (status === 'active') {
                    reservations = reservations.filter(r => r.status === 'CHECKED_IN');
                } else if (status === 'completed') {
                    reservations = reservations.filter(r => r.status === 'COMPLETED');
                } else if (status === 'cancelled') {
                    reservations = reservations.filter(r => r.status === 'CANCELLED');
                }

                if (reservations.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">暂无预约记录</td></tr>';
                    return;
                }

                // 渲染预约列表
                tbody.innerHTML = reservations.map(r => {
                    const seatNumber = `${r.seatRow || ''}${r.seatColumn || ''}`;
                    const statusText = MyReservationsPage.getStatusText(r.status);
                    const statusColor = MyReservationsPage.getStatusColor(r.status);
                    const checkInTime = r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '-';
                    const canCancel = r.status === 'RESERVED';

                    return `
                        <tr>
                            <td>${seatNumber || '-'}</td>
                            <td>${r.areaName || '-'}</td>
                            <td>${r.date || '-'}</td>
                            <td>${r.timeSlot || '-'}</td>
                            <td><span style="color: ${statusColor}; font-weight: 500;">${statusText}</span></td>
                            <td>${checkInTime}</td>
                            <td>
                                ${canCancel ? `<button class="btn btn-sm btn-danger" data-id="${r.id}" id="cancel-btn-${r.id}">取消预约</button>` : '-'}
                            </td>
                        </tr>
                    `;
                }).join('');

                // 绑定取消预约事件
                reservations.forEach(r => {
                    if (r.status === 'RESERVED') {
                        const cancelBtn = el.querySelector(`#cancel-btn-${r.id}`);
                        if (cancelBtn) {
                            cancelBtn.addEventListener('click', () => {
                                MyReservationsPage.cancelReservation(el, r.id);
                            });
                        }
                    }
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">暂无预约记录</td></tr>';
            }
        } catch (err) {
            console.error('加载预约列表失败:', err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #ff4757;">${err.msg || '加载失败'}</td></tr>`;
        }
    },

    /**
     * 更新统计数据
     * @param {Array} reservations 预约列表
     */
    updateStats: (reservations) => {
        const statAll = document.getElementById('stat-all');
        const statPending = document.getElementById('stat-pending');
        const statActive = document.getElementById('stat-active');
        const statCompleted = document.getElementById('stat-completed');

        if (statAll) statAll.textContent = reservations.length;
        if (statPending) statPending.textContent = reservations.filter(r => r.status === 'RESERVED').length;
        if (statActive) statActive.textContent = reservations.filter(r => r.status === 'CHECKED_IN').length;
        if (statCompleted) statCompleted.textContent = reservations.filter(r => r.status === 'COMPLETED').length;
    },

    /**
     * 获取状态文本
     * @param {string} status 状态
     * @returns {string}
     */
    getStatusText: (status) => {
        const statusMap = {
            'RESERVED': '待签到',
            'CHECKED_IN': '已签到',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消',
            'VIOLATED': '已违约'
        };
        return statusMap[status] || status;
    },

    /**
     * 获取状态颜色
     * @param {string} status 状态
     * @returns {string}
     */
    getStatusColor: (status) => {
        const colorMap = {
            'RESERVED': '#f6ad55',
            'CHECKED_IN': '#48bb78',
            'COMPLETED': '#667eea',
            'CANCELLED': '#a0aec0',
            'VIOLATED': '#ff4757'
        };
        return colorMap[status] || '#666';
    },

    /**
     * 取消预约
     * @param {HTMLElement} el 容器元素
     * @param {number} reservationId 预约ID
     */
    cancelReservation: async (el, reservationId) => {
        if (MyReservationsPage.isCancelling) {
            Utils.message.warning('操作进行中，请稍候...');
            return;
        }

        if (!confirm('确定要取消这个预约吗？')) {
            return;
        }

        MyReservationsPage.isCancelling = true;
        const btn = el.querySelector(`#cancel-btn-${reservationId}`);
        const originalText = btn.textContent;
        btn.textContent = '处理中...';
        btn.disabled = true;

        try {
            const cancelResponse = await API.cancelReservation(reservationId);
            if (cancelResponse.code === 200) {
                Utils.message.success('预约已取消');
                // 刷新当前状态的预约列表
                const activeTab = el.querySelector('.tab-item.active');
                const status = activeTab.id.replace('tab-', '');
                MyReservationsPage.loadReservations(el, status);
            } else {
                Utils.message.error(cancelResponse.msg || '取消失败');
            }
        } catch (err) {
            Utils.message.error(err.msg || '取消失败，请稍后重试');
        } finally {
            MyReservationsPage.isCancelling = false;
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

// 注册到全局
window.MyReservationsPage = MyReservationsPage;
