/**
 * 签到签退页面组件
 * 支持学号查询、签到、签退操作
 */

const CheckInPage = {
    // 防止重复点击
    isChecking: false,
    
    /**
     * 渲染签到签退页面
     * @returns {HTMLElement}
     */
    render: () => {
        const template = `
            <div class="layout-container">
                <!-- 侧边栏 -->
                <div class="sidebar">
                    <div class="sidebar-header">管理员控制台</div>
                    <ul class="sidebar-nav">
                        <li><a href="#/admin-home">首页</a></li>
                        <li><a href="#/admin-seats">座位管理</a></li>
                        <li><a href="#/admin-time-slots">时段管理</a></li>
                        <li><a href="#/admin-users">用户管理</a></li>
                        <li><a href="#/admin-violations">违约管理</a></li>
                        <li><a href="#/checkin" class="active">签到签退</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <h1 class="page-title">签到签退</h1>
                    
                    <!-- 学号查询 -->
                    <div class="card">
                        <h3 class="card-title">学号查询</h3>
                        <div style="display: flex; gap: 15px;">
                            <input type="text" id="student-id-input" class="form-input" placeholder="请输入学号查询" style="flex: 1; max-width: 300px;">
                            <button class="btn btn-primary" id="search-btn">查询</button>
                        </div>
                    </div>
                    
                    <!-- 当前预约 -->
                    <div class="card" id="current-reservation">
                        <div style="text-align: center; padding: 40px; color: #999;">加载中...</div>
                    </div>
                    
                    <!-- 签到规则提示 -->
                    <div class="card">
                        <h3 class="card-title">📌 签到规则</h3>
                        <ul style="padding-left: 20px; line-height: 2;">
                            <li>签到时间：预约时段开始前30分钟至开始后15分钟</li>
                            <li>签退时间：预约时段内任意时间</li>
                            <li>未按时签到将视为违约</li>
                            <li>必须先签到才能签退</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        CheckInPage.bindEvents(el);
        CheckInPage.loadCurrentReservation(el);
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

        // 查询按钮
        el.querySelector('#search-btn').addEventListener('click', () => {
            CheckInPage.searchByStudentId(el);
        });

        // 回车查询
        el.querySelector('#student-id-input').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                CheckInPage.searchByStudentId(el);
            }
        });
    },

    /**
     * 根据学号查询预约
     */
    searchByStudentId: async (el) => {
        const studentId = el.querySelector('#student-id-input').value.trim();
        
        if (!studentId) {
            Utils.message.warning('请输入学号');
            return;
        }

        const containerEl = el.querySelector('#current-reservation');
        containerEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">查询中...</div>';

        try {
            const response = await API.searchReservationByStudentId(studentId);
            
            if (response.code === 200 && response.data) {
                CheckInPage.renderReservation(el, response.data);
            } else {
                containerEl.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                        <div style="color: #999; font-size: 16px;">未找到学号 "${studentId}" 的预约记录</div>
                    </div>
                `;
            }
        } catch (err) {
            containerEl.innerHTML = `<div style="text-align: center; padding: 40px; color: #ff4757;">${err.msg || '查询失败'}</div>`;
        }
    },

    /**
     * 加载当前可签到/签退的预约
     * @param {HTMLElement} el 容器元素
     */
    loadCurrentReservation: async (el) => {
        const containerEl = el.querySelector('#current-reservation');

        try {
            const response = await API.getMyReservations();
            
            if (response.code === 200 && response.data) {
                const reservations = response.data;
                
                // 找到当前可操作的预约（待签到或已签到）
                const currentReservation = reservations.find(r => 
                    r.status === 'RESERVED' || r.status === 'CHECKED_IN'
                );

                if (!currentReservation) {
                    containerEl.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 20px;">🪑</div>
                            <div style="color: #999; font-size: 16px;">暂无需要签到或签退的预约</div>
                            <div style="color: #999; font-size: 14px; margin-top: 10px;">请先预约座位</div>
                        </div>
                    `;
                    return;
                }

                CheckInPage.renderReservation(el, currentReservation);
            } else {
                containerEl.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🪑</div>
                        <div style="color: #999; font-size: 16px;">暂无预约记录</div>
                    </div>
                `;
            }
        } catch (err) {
            containerEl.innerHTML = `<div style="text-align: center; padding: 40px; color: #ff4757;">${err.msg || '加载失败'}</div>`;
        }
    },

    /**
     * 渲染预约信息
     */
    renderReservation: (el, reservation) => {
        const containerEl = el.querySelector('#current-reservation');
        
        const isReserved = reservation.status === 'RESERVED'; // 待签到
        const isCheckedIn = reservation.status === 'CHECKED_IN'; // 已签到
        
        let buttonText = '';
        let buttonClass = '';
        let statusText = '';
        let statusColor = '';

        if (isReserved) {
            buttonText = '确认签到';
            buttonClass = 'btn-success';
            statusText = '待签到';
            statusColor = '#f6ad55';
        } else if (isCheckedIn) {
            buttonText = '确认签退';
            buttonClass = 'btn-warning';
            statusText = '已签到';
            statusColor = '#48bb78';
        }

        const seatNumber = `${reservation.seatRow || ''}${reservation.seatColumn || ''}`;
        const areaName = reservation.areaName || '-';

        containerEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <h3 class="card-title">当前预约</h3>
                <span style="padding: 5px 12px; background: ${statusColor}; color: white; border-radius: 20px; font-size: 12px;">${statusText}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
                <div style="padding: 20px; background: #f7fafc; border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: 600; color: #667eea;">${seatNumber || '-'}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">座位号</div>
                </div>
                <div style="padding: 20px; background: #f7fafc; border-radius: 8px;">
                    <div style="font-size: 16px; font-weight: 500;">${areaName}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">区域</div>
                </div>
                <div style="padding: 20px; background: #f7fafc; border-radius: 8px;">
                    <div style="font-size: 16px; font-weight: 500;">${reservation.date || '-'}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">日期</div>
                </div>
                <div style="padding: 20px; background: #f7fafc; border-radius: 8px;">
                    <div style="font-size: 14px; font-weight: 500;">${reservation.timeSlot || '-'}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">时段</div>
                </div>
            </div>
            ${reservation.checkInTime ? `
            <div style="padding: 15px; background: #e6fffa; border-radius: 8px; margin-bottom: 20px;">
                <span style="color: #319795; font-size: 14px;">✅ 签到时间：${new Date(reservation.checkInTime).toLocaleString()}</span>
            </div>
            ` : ''}
            <div style="text-align: center;">
                <button class="btn ${buttonClass}" style="padding: 12px 40px; font-size: 16px;" id="check-btn">
                    ${buttonText}
                </button>
            </div>
        `;

        // 绑定签到/签退按钮事件
        el.querySelector('#check-btn').addEventListener('click', async () => {
            CheckInPage.handleCheckAction(el, reservation);
        });
    },

    /**
     * 处理签到/签退操作
     */
    handleCheckAction: async (el, reservation) => {
        if (CheckInPage.isChecking) {
            Utils.message.warning('操作进行中，请稍候...');
            return;
        }

        const isReserved = reservation.status === 'RESERVED';
        const isCheckedIn = reservation.status === 'CHECKED_IN';
        const actionText = isReserved ? '签到' : '签退';
        const confirmText = isReserved ? '签到' : '签退';

        // 约束5：未签到不能签退
        if (!isReserved && !isCheckedIn) {
            Utils.message.warning('必须先签到才能签退');
            return;
        }

        if (!confirm(`确定要${confirmText}吗？`)) {
            return;
        }

        CheckInPage.isChecking = true;
        const btn = el.querySelector('#check-btn');
        const originalText = btn.textContent;
        btn.textContent = '处理中...';
        btn.disabled = true;

        try {
            const response = isReserved ? await API.checkIn(reservation.id) : await API.checkOut(reservation.id);
            
            if (response.code === 200) {
                Utils.message.success(`${actionText}成功`);
                // 刷新当前预约信息
                CheckInPage.loadCurrentReservation(el);
            } else {
                // 处理业务错误
                if (response.msg) {
                    Utils.message.error(response.msg);
                } else {
                    Utils.message.error(`${actionText}失败，请稍后重试`);
                }
            }
        } catch (err) {
            Utils.message.error(err.msg || `${actionText}失败，请稍后重试`);
        } finally {
            CheckInPage.isChecking = false;
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

// 注册到全局
window.CheckInPage = CheckInPage;