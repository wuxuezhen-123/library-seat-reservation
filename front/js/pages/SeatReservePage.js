/**
 * 座位预约页面组件
 * 支持手动选座、自动分配、取消预约
 */

const SeatReservePage = {
    // 选中的日期和时段
    selectedDate: Utils.date.today(),
    selectedTimeSlot: '',
    selectedSeatId: null,
    // 当前用户预约列表（用于检查同一时段是否已预约）
    userReservations: [],
    // 用户是否在黑名单
    isBlacklisted: false,
    // 黑名单详细信息
    blacklistInfo: null,
    // 防止重复点击
    isSubmitting: false,
    
    /**
     * 渲染预约页面
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
                        <li><a href="#/seat-reserve" class="active">预约座位</a></li>
                        <li><a href="#/my-reservations">我的预约</a></li>
                        <li><a href="#/my-violations">违约记录</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <h1 class="page-title">预约座位</h1>
                    
                    <!-- 黑名单提示 -->
                    <div id="blacklist-warning" class="warning-box" style="display: none;">
                        ⚠️ 您当前处于预约黑名单中，暂无法预约座位
                    </div>
                    
                    <!-- 日期选择 -->
                    <div class="card">
                        <h3 class="card-title">选择日期 <span style="color: #999; font-weight: normal;">(仅可预约今天和明天)</span></h3>
                        <div class="date-picker" id="date-picker"></div>
                    </div>
                    
                    <!-- 时段选择 -->
                    <div class="card">
                        <h3 class="card-title">选择时段</h3>
                        <div class="time-slot-group" id="time-slot-group"></div>
                    </div>
                    
                    <!-- 当前时段已预约提示 -->
                    <div id="already-reserved-warning" class="warning-box" style="display: none;">
                        ⚠️ 您已在当前时段预约了座位，同一时段只能预约一个座位
                    </div>
                    
                    <!-- 座位选择 -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 class="card-title">选择座位</h3>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-secondary" id="auto-assign-btn" ${SeatReservePage.isBlacklisted ? 'disabled' : ''}>自动分配</button>
                                <button class="btn btn-outline" id="refresh-seats-btn">🔄 刷新座位</button>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <span style="display: inline-block; margin-right: 20px;">
                                <span style="display: inline-block; width: 20px; height: 20px; background: #c6f6d5; border-radius: 4px; margin-right: 8px;"></span>空闲可预约
                            </span>
                            <span style="display: inline-block;">
                                <span style="display: inline-block; width: 20px; height: 20px; background: #9f7aea; border-radius: 4px; margin-right: 8px;"></span>已选择
                            </span>
                        </div>
                        <div id="reserve-seat-grid" class="seat-grid">
                            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">请先选择日期和时段</div>
                        </div>
                    </div>
                    
                    <!-- 已预约列表（可取消） -->
                    <div class="card">
                        <h3 class="card-title">我的预约（可取消）</h3>
                        <div id="my-reservations-list">加载中...</div>
                    </div>
                    
                    <!-- 预约按钮 -->
                    <div style="text-align: right;">
                        <button class="btn btn-primary" id="submit-reserve-btn" disabled ${SeatReservePage.isBlacklisted ? 'disabled' : ''}>确认预约</button>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        SeatReservePage.bindEvents(el);
        SeatReservePage.initPage(el);
        return el;
    },

    /**
     * 初始化页面
     */
    initPage: async (el) => {
        await SeatReservePage.checkBlacklist();
        await SeatReservePage.loadBlacklistDetail();
        await SeatReservePage.loadUserReservations();
        SeatReservePage.loadDates(el);
        SeatReservePage.loadTimeSlots(el);
        SeatReservePage.updateBlacklistWarning(el);
        SeatReservePage.loadMyReservations(el);
    },

    /**
     * 加载黑名单详细信息
     */
    loadBlacklistDetail: async () => {
        try {
            const response = await API.checkBlacklistDetail();
            if (response.code === 200 && response.data) {
                SeatReservePage.blacklistInfo = response.data;
            }
        } catch (err) {
            console.warn('加载黑名单详情失败:', err);
        }
    },

    /**
     * 检查用户是否在黑名单
     */
    checkBlacklist: async () => {
        try {
            const response = await API.checkBlacklist();
            SeatReservePage.isBlacklisted = response.code === 200 && response.data;
        } catch (err) {
            console.warn('检查黑名单失败:', err);
        }
    },

    /**
     * 加载用户预约列表
     */
    loadUserReservations: async () => {
        try {
            const response = await API.getUserReservations();
            SeatReservePage.userReservations = response.code === 200 && response.data ? response.data : [];
        } catch (err) {
            console.warn('加载用户预约失败:', err);
            SeatReservePage.userReservations = [];
        }
    },

    /**
     * 更新黑名单提示
     */
    updateBlacklistWarning: (el) => {
        const warningEl = el.querySelector('#blacklist-warning');
        if (warningEl) {
            if (SeatReservePage.isBlacklisted && SeatReservePage.blacklistInfo) {
                const remainingDays = SeatReservePage.blacklistInfo.remainingDays || 0;
                const violationCount = SeatReservePage.blacklistInfo.violationCount || 0;
                warningEl.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">⚠️</span>
                        <div>
                            <strong>您当前处于预约黑名单中，暂无法预约座位</strong>
                            <p style="margin: 5px 0 0; font-weight: normal;">剩余封禁天数：${remainingDays} 天（累计违约${violationCount}次自动封禁7天）</p>
                        </div>
                    </div>
                `;
                warningEl.style.display = 'block';
            } else {
                warningEl.style.display = 'none';
            }
        }
        
        const autoAssignBtn = el.querySelector('#auto-assign-btn');
        const submitBtn = el.querySelector('#submit-reserve-btn');
        if (autoAssignBtn) autoAssignBtn.disabled = SeatReservePage.isBlacklisted;
        if (submitBtn) submitBtn.disabled = SeatReservePage.isBlacklisted;
    },

    /**
     * 检查当前时段是否已预约
     */
    hasReservationInSlot: () => {
        if (!SeatReservePage.selectedDate || !SeatReservePage.selectedTimeSlot) {
            return false;
        }
        return SeatReservePage.userReservations.some(res => 
            res.date === SeatReservePage.selectedDate && 
            res.timeSlot === SeatReservePage.selectedTimeSlot &&
            res.status === 'RESERVED'
        );
    },

    /**
     * 更新已预约提示
     */
    updateReservedWarning: (el) => {
        const warningEl = el.querySelector('#already-reserved-warning');
        const hasReserved = SeatReservePage.hasReservationInSlot();
        if (warningEl) {
            warningEl.style.display = hasReserved ? 'block' : 'none';
        }
        
        const submitBtn = el.querySelector('#submit-reserve-btn');
        if (submitBtn) {
            submitBtn.disabled = hasReserved || !SeatReservePage.selectedSeatId || SeatReservePage.isBlacklisted;
        }
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

        // 手动刷新座位状态
        el.querySelector('#refresh-seats-btn').addEventListener('click', async () => {
            if (SeatReservePage.isSubmitting) {
                Utils.message.warning('操作进行中，请稍候...');
                return;
            }
            if (!SeatReservePage.selectedDate || !SeatReservePage.selectedTimeSlot) {
                Utils.message.warning('请先选择日期和时段');
                return;
            }
            
            SeatReservePage.isSubmitting = true;
            const btn = el.querySelector('#refresh-seats-btn');
            const originalText = btn.textContent;
            btn.textContent = '刷新中...';
            btn.disabled = true;

            try {
                await SeatReservePage.loadUserReservations();
                SeatReservePage.loadSeats(el);
                SeatReservePage.updateReservedWarning(el);
                Utils.message.success('座位状态已刷新');
            } catch (err) {
                Utils.message.error(err.msg || '刷新失败，请稍后重试');
            } finally {
                SeatReservePage.isSubmitting = false;
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        // 自动分配座位
        el.querySelector('#auto-assign-btn').addEventListener('click', async () => {
            if (SeatReservePage.isSubmitting) {
                Utils.message.warning('操作进行中，请稍候...');
                return;
            }
            if (!SeatReservePage.selectedDate) {
                Utils.message.warning('请先选择日期');
                return;
            }
            if (!SeatReservePage.selectedTimeSlot) {
                Utils.message.warning('请先选择时段');
                return;
            }

            // 黑名单预约拦截
            await SeatReservePage.checkBlacklist();
            if (SeatReservePage.isBlacklisted) {
                Utils.message.warning('您当前处于黑名单中，暂无法预约');
                return;
            }

            // 同一时段冲突检查：请求API检查当前用户是否已有该时段的预约
            await SeatReservePage.loadUserReservations();
            if (SeatReservePage.hasReservationInSlot()) {
                Utils.message.warning('您已在当前时段预约了座位，同一时段只能预约一个');
                SeatReservePage.updateReservedWarning(el);
                return;
            }

            SeatReservePage.isSubmitting = true;
            const btn = el.querySelector('#auto-assign-btn');
            const originalText = btn.textContent;
            btn.textContent = '分配中...';
            btn.disabled = true;

            try {
                const response = await API.autoAssignSeat({
                    date: SeatReservePage.selectedDate,
                    timeSlot: SeatReservePage.selectedTimeSlot
                });

                if (response.code === 200 && response.data) {
                    const seat = response.data;
                    SeatReservePage.selectedSeatId = seat.id;
                    SeatReservePage.loadSeats(el);
                    Utils.message.success(`已自动分配座位: ${seat.seatNumber}`);
                    el.querySelector('#submit-reserve-btn').disabled = false;
                } else {
                    Utils.message.error(response.msg || '自动分配失败，当前时段无空闲座位');
                }
            } catch (err) {
                Utils.message.error(err.msg || '自动分配失败，请稍后重试');
            } finally {
                SeatReservePage.isSubmitting = false;
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        // 提交预约
        el.querySelector('#submit-reserve-btn').addEventListener('click', async () => {
            if (SeatReservePage.isSubmitting) {
                Utils.message.warning('操作进行中，请稍候...');
                return;
            }
            
            // 黑名单预约拦截：再次检查用户黑名单状态
            await SeatReservePage.checkBlacklist();
            if (SeatReservePage.isBlacklisted) {
                Utils.message.warning('您当前处于黑名单中，暂无法预约座位');
                SeatReservePage.updateBlacklistWarning(el);
                return;
            }
            if (!SeatReservePage.selectedSeatId) {
                Utils.message.warning('请选择座位');
                return;
            }
            if (SeatReservePage.hasReservationInSlot()) {
                Utils.message.warning('您已在当前时段预约了座位');
                return;
            }

            SeatReservePage.isSubmitting = true;
            const btn = el.querySelector('#submit-reserve-btn');
            const originalText = btn.textContent;
            btn.textContent = '预约中...';
            btn.disabled = true;

            try {
                const response = await API.createReservation({
                    seatId: SeatReservePage.selectedSeatId,
                    date: SeatReservePage.selectedDate,
                    timeSlot: SeatReservePage.selectedTimeSlot
                });

                if (response.code === 200) {
                    Utils.message.success('预约成功！请按时签到');
                    // 重置选择
                    SeatReservePage.selectedSeatId = null;
                    el.querySelector('#submit-reserve-btn').disabled = true;
                    // 刷新预约列表
                    await SeatReservePage.loadUserReservations();
                    SeatReservePage.loadSeats(el);
                    SeatReservePage.updateReservedWarning(el);
                } else {
                    Utils.message.error(response.msg || '预约失败，该座位可能已被他人预约');
                }
            } catch (err) {
                Utils.message.error(err.msg || '预约失败，请稍后重试');
            } finally {
                SeatReservePage.isSubmitting = false;
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    },

    /**
     * 加载日期选择（限制为今天和明天）
     * @param {HTMLElement} el 容器元素
     */
    loadDates: (el) => {
        const datePicker = el.querySelector('#date-picker');
        datePicker.innerHTML = '';

        // 只显示今天和明天
        for (let i = 0; i < 2; i++) {
            const date = Utils.date.addDays(i);
            const dateObj = new Date(date);
            const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const weekDay = weekDays[dateObj.getDay()];
            const isSelected = date === SeatReservePage.selectedDate;
            const isToday = date === Utils.date.today();

            const dateEl = Utils.dom.render(`
                <div class="date-item ${isSelected ? 'selected' : ''}" data-date="${date}">
                    <div>${dateObj.getMonth() + 1}/${dateObj.getDate()}</div>
                    <div style="font-size: 12px;">${weekDay}</div>
                    ${isToday ? '<div style="font-size: 10px; color: #667eea;">今天</div>' : '<div style="font-size: 10px; color: #48bb78;">明天</div>'}
                </div>
            `);

            dateEl.addEventListener('click', () => {
                SeatReservePage.selectedDate = date;
                datePicker.querySelectorAll('.date-item').forEach(item => item.classList.remove('selected'));
                dateEl.classList.add('selected');
                SeatReservePage.loadSeats(el);
                SeatReservePage.updateReservedWarning(el);
            });

            datePicker.appendChild(dateEl);
        }
    },

    /**
     * 加载时段选择
     * @param {HTMLElement} el 容器元素
     */
    loadTimeSlots: async (el) => {
        const timeSlotGroup = el.querySelector('#time-slot-group');
        timeSlotGroup.innerHTML = '<span style="color: #999;">加载中...</span>';

        try {
            const response = await API.getTimeSlots();
            
            if (response.code === 200 && response.data) {
                const timeSlots = response.data;
                timeSlotGroup.innerHTML = '';

                timeSlots.forEach(slot => {
                    const isSelected = slot.slot === SeatReservePage.selectedTimeSlot;
                    const slotEl = Utils.dom.render(`
                        <button class="time-slot ${isSelected ? 'selected' : ''}" data-slot="${slot.slot}">
                            ${slot.startTime} - ${slot.endTime}
                        </button>
                    `);

                    slotEl.addEventListener('click', () => {
                        SeatReservePage.selectedTimeSlot = slot.slot;
                        timeSlotGroup.querySelectorAll('.time-slot').forEach(item => item.classList.remove('selected'));
                        slotEl.classList.add('selected');
                        SeatReservePage.loadSeats(el);
                        SeatReservePage.updateReservedWarning(el);
                    });

                    timeSlotGroup.appendChild(slotEl);
                });
            } else {
                timeSlotGroup.innerHTML = '<span style="color: #999;">暂无时段数据</span>';
            }
        } catch (err) {
            timeSlotGroup.innerHTML = `<span style="color: #ff4757;">${err.msg || '加载失败'}</span>`;
        }
    },

    /**
     * 加载可预约座位
     * @param {HTMLElement} el 容器元素
     */
    loadSeats: async (el) => {
        const gridEl = el.querySelector('#reserve-seat-grid');
        
        if (!SeatReservePage.selectedDate || !SeatReservePage.selectedTimeSlot) {
            gridEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">请先选择日期和时段</div>';
            return;
        }

        // 检查同一时段是否已预约
        if (SeatReservePage.hasReservationInSlot()) {
            gridEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ffb347;">您已在当前时段预约了座位，如需更改请先取消原有预约</div>';
            return;
        }

        gridEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">加载中...</div>';

        try {
            const response = await API.getAvailableSeats({
                date: SeatReservePage.selectedDate,
                timeSlot: SeatReservePage.selectedTimeSlot
            });
            
            if (response.code === 200 && response.data) {
                const seats = response.data;
                gridEl.innerHTML = '';
                
                let hasFreeSeats = false;
                
                seats.forEach(seat => {
                    hasFreeSeats = true;
                    const isSelected = seat.id === SeatReservePage.selectedSeatId;
                    
                    const seatEl = Utils.dom.render(`
                        <div class="seat-item ${isSelected ? 'selected' : 'free'}" data-seat-id="${seat.id}">
                            <span style="font-size: 16px; font-weight: 600;">${seat.seatNumber}</span>
                            <span style="font-size: 10px;">${seat.zone}区</span>
                        </div>
                    `);

                    seatEl.addEventListener('click', () => {
                        SeatReservePage.selectedSeatId = seat.id;
                        gridEl.querySelectorAll('.seat-item').forEach(item => item.classList.remove('selected'));
                        seatEl.classList.add('selected');
                        el.querySelector('#submit-reserve-btn').disabled = false;
                    });

                    gridEl.appendChild(seatEl);
                });

                if (!hasFreeSeats) {
                    gridEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">当前时段暂无空闲座位</div>';
                }
            } else {
                gridEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">暂无座位数据</div>';
            }
        } catch (err) {
            gridEl.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ff4757;">${err.msg || '加载失败'}</div>`;
        }
    },

    /**
     * 判断预约是否已过期（不能取消）
     * @param {object} reservation 预约信息
     * @returns {boolean}
     */
    isReservationExpired: (reservation) => {
        const now = new Date();
        const reservationDate = new Date(reservation.date);
        const timeSlot = reservation.timeSlotDisplay || reservation.timeSlot;
        const [startTime] = timeSlot.split(' - ');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        reservationDate.setHours(startHour, startMinute, 0, 0);
        return now >= reservationDate;
    },

    /**
     * 加载我的预约列表（可取消）
     * @param {HTMLElement} el 容器元素
     */
    loadMyReservations: async (el) => {
        const listEl = el.querySelector('#my-reservations-list');
        
        try {
            const response = await API.getUserReservations();
            
            if (response.code === 200 && response.data && response.data.length > 0) {
                const reservations = response.data;
                listEl.innerHTML = `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>时段</th>
                                <th>座位号</th>
                                <th>区域</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reservations.map(res => {
                                const isExpired = SeatReservePage.isReservationExpired(res);
                                const canCancel = res.status === 'RESERVED' && !isExpired;
                                const seatNumber = `${res.seatRow}${res.seatColumn}`;
                                return `
                            <tr>
                                <td>${res.date}</td>
                                <td>${res.timeSlot}</td>
                                <td>${seatNumber}</td>
                                <td>${res.areaName}</td>
                                <td>${SeatReservePage.getStatusText(res.status)}</td>
                                <td>
                                    ${canCancel ? 
                                        `<button class="btn btn-sm btn-danger" data-reservation-id="${res.id}">取消预约</button>` : 
                                        isExpired ? '<span style="color: #999;">预约已开始</span>' : '<span style="color: #999;">无法取消</span>'}
                                </td>
                            </tr>
                            `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
                
                // 绑定取消预约事件
                listEl.querySelectorAll('.btn-danger').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const reservationId = e.target.dataset.reservationId;
                        const reservation = reservations.find(r => r.id == reservationId);
                        
                        if (!reservation) {
                            Utils.message.error('预约记录不存在');
                            return;
                        }

                        // 检查预约是否已经开始（约束4：预约开始后不能取消）
                        if (SeatReservePage.isReservationExpired(reservation)) {
                            Utils.message.warning('预约已开始，无法取消。如需帮助请联系管理员');
                            return;
                        }

                        if (!confirm('确定要取消预约吗？取消后可重新预约')) {
                            return;
                        }

                        // 防止重复点击
                        if (btn.disabled) {
                            Utils.message.warning('操作进行中，请稍候...');
                            return;
                        }
                        btn.disabled = true;
                        const originalText = btn.textContent;
                        btn.textContent = '取消中...';

                        try {
                            const response = await API.cancelReservation(reservationId);
                            if (response.code === 200) {
                                Utils.message.success('取消预约成功');
                                await SeatReservePage.loadUserReservations();
                                SeatReservePage.loadMyReservations(el);
                                SeatReservePage.updateReservedWarning(el);
                                SeatReservePage.loadSeats(el);
                            } else {
                                Utils.message.error(response.msg || '取消失败');
                            }
                        } catch (err) {
                            Utils.message.error(err.msg || '取消失败，请稍后重试');
                        } finally {
                            btn.disabled = false;
                            btn.textContent = originalText;
                        }
                    });
                });
            } else {
                listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无预约记录</div>';
            }
        } catch (err) {
            listEl.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff4757;">${err.msg || '加载失败'}</div>`;
        }
    },

    /**
     * 获取状态文本
     */
    getStatusText: (status) => {
        const statusMap = {
            'RESERVED': '已预约',
            'CHECKED_IN': '已签到',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消',
            'VIOLATED': '已违约'
        };
        return statusMap[status] || status;
    }
};

// 注册到全局
window.SeatReservePage = SeatReservePage;