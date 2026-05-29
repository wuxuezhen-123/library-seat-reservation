/**
 * 座位浏览页面组件
 * 支持A/B/C三区浏览、日期时段切换、点击选座
 */

const SeatBrowsePage = {
    // 当前选中的区域
    currentZone: '',
    // 当前选中的日期
    currentDate: Utils.date.today(),
    // 当前选中的时段
    currentTimeSlot: '',
    // 当前选中的座位
    selectedSeat: null,
    // 时段列表
    timeSlots: [],
    
    /**
     * 渲染座位浏览页面
     * @returns {HTMLElement}
     */
    render: async () => {
        const user = Utils.auth.getUser();
        const isAdmin = Utils.auth.isAdmin();
        
        const template = `
            <div class="layout-container">
                <!-- 侧边栏 -->
                <div class="sidebar">
                    <div class="sidebar-header">${isAdmin ? '管理员控制台' : '学生控制台'}</div>
                    <ul class="sidebar-nav">
                        ${isAdmin ? `
                        <li><a href="#/admin-home">首页</a></li>
                        <li><a href="#/seat-browse" class="active">座位浏览</a></li>
                        <li><a href="#/admin-seats">座位管理</a></li>
                        <li><a href="#/admin-time-slots">时段管理</a></li>
                        <li><a href="#/admin-users">用户管理</a></li>
                        <li><a href="#/admin-violations">违约管理</a></li>
                        ` : `
                        <li><a href="#/student-home">首页</a></li>
                        <li><a href="#/seat-browse" class="active">座位浏览</a></li>
                        <li><a href="#/seat-reserve">预约座位</a></li>
                        <li><a href="#/my-reservations">我的预约</a></li>
                        <li><a href="#/my-violations">违约记录</a></li>
                        `}
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <h1 class="page-title">座位浏览</h1>
                    
                    <!-- 日期选择 -->
                    <div class="card">
                        <h3 class="card-title">选择日期</h3>
                        <div class="date-picker" id="date-picker"></div>
                    </div>
                    
                    <!-- 时段选择 -->
                    <div class="card">
                        <h3 class="card-title">选择时段</h3>
                        <div class="time-slot-group" id="time-slot-group">加载中...</div>
                    </div>
                    
                    <!-- 区域筛选 -->
                    <div class="card">
                        <h3 class="card-title">选择区域</h3>
                        <div class="time-slot-group">
                            <button class="time-slot ${!SeatBrowsePage.currentZone ? 'selected' : ''}" id="zone-all">全部区域</button>
                            <button class="time-slot ${SeatBrowsePage.currentZone === 'A' ? 'selected' : ''}" id="zone-a">A区</button>
                            <button class="time-slot ${SeatBrowsePage.currentZone === 'B' ? 'selected' : ''}" id="zone-b">B区</button>
                            <button class="time-slot ${SeatBrowsePage.currentZone === 'C' ? 'selected' : ''}" id="zone-c">C区</button>
                        </div>
                    </div>
                    
                    <!-- 座位网格 -->
                    <div class="card">
                        <h3 class="card-title" style="margin-bottom: 15px;">座位状态</h3>
                        <div style="margin-bottom: 15px;">
                            <span style="display: inline-block; margin-right: 20px;">
                                <span style="display: inline-block; width: 20px; height: 20px; background: #c6f6d5; border-radius: 4px; margin-right: 8px;"></span>空闲（可预约）
                            </span>
                            <span style="display: inline-block; margin-right: 20px;">
                                <span style="display: inline-block; width: 20px; height: 20px; background: #feebc8; border-radius: 4px; margin-right: 8px;"></span>已预约
                            </span>
                            <span style="display: inline-block;">
                                <span style="display: inline-block; width: 20px; height: 20px; background: #fed7d7; border-radius: 4px; margin-right: 8px;"></span>已占用
                            </span>
                        </div>
                        <div id="seat-grid" class="seat-grid">
                            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">加载中...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        SeatBrowsePage.bindEvents(el);
        SeatBrowsePage.loadDates(el);
        await SeatBrowsePage.loadTimeSlots(el);
        await SeatBrowsePage.loadSeats(el);
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

        // 区域筛选
        el.querySelector('#zone-all').addEventListener('click', () => {
            SeatBrowsePage.currentZone = '';
            el.querySelectorAll('.time-slot').forEach(btn => btn.classList.remove('selected'));
            el.querySelector('#zone-all').classList.add('selected');
            SeatBrowsePage.loadSeats(el);
        });

        el.querySelector('#zone-a').addEventListener('click', () => {
            SeatBrowsePage.currentZone = 'A';
            el.querySelectorAll('.time-slot').forEach(btn => btn.classList.remove('selected'));
            el.querySelector('#zone-a').classList.add('selected');
            SeatBrowsePage.loadSeats(el);
        });

        el.querySelector('#zone-b').addEventListener('click', () => {
            SeatBrowsePage.currentZone = 'B';
            el.querySelectorAll('.time-slot').forEach(btn => btn.classList.remove('selected'));
            el.querySelector('#zone-b').classList.add('selected');
            SeatBrowsePage.loadSeats(el);
        });

        el.querySelector('#zone-c').addEventListener('click', () => {
            SeatBrowsePage.currentZone = 'C';
            el.querySelectorAll('.time-slot').forEach(btn => btn.classList.remove('selected'));
            el.querySelector('#zone-c').classList.add('selected');
            SeatBrowsePage.loadSeats(el);
        });

        // 确认选择按钮
        const confirmBtn = el.querySelector('#confirm-selection');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (SeatBrowsePage.selectedSeat) {
                    Utils.message.success(`已选择座位: ${SeatBrowsePage.selectedSeat.seatNumber}`);
                    // 将选中的座位信息传递到预约页面
                    Utils.storage.set('selectedSeat', SeatBrowsePage.selectedSeat);
                    Router.navigate('seat-reserve');
                }
            });
        }
    },

    /**
     * 加载日期选择器
     * @param {HTMLElement} el 容器元素
     */
    loadDates: (el) => {
        const datePicker = el.querySelector('#date-picker');
        datePicker.innerHTML = '';

        // 只显示今天和明天（约束：仅可预约当天+未来1天）
        for (let i = 0; i < 2; i++) {
            const date = Utils.date.addDays(i);
            const dateObj = new Date(date);
            const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const weekDay = weekDays[dateObj.getDay()];
            const isSelected = date === SeatBrowsePage.currentDate;
            const isToday = date === Utils.date.today();

            const dateEl = Utils.dom.render(`
                <div class="date-item ${isSelected ? 'selected' : ''}" data-date="${date}">
                    <div>${dateObj.getMonth() + 1}/${dateObj.getDate()}</div>
                    <div style="font-size: 12px;">${weekDay}</div>
                    ${isToday ? '<div style="font-size: 10px; color: #667eea;">今天</div>' : ''}
                </div>
            `);

            dateEl.addEventListener('click', () => {
                SeatBrowsePage.currentDate = date;
                datePicker.querySelectorAll('.date-item').forEach(item => item.classList.remove('selected'));
                dateEl.classList.add('selected');
                SeatBrowsePage.loadSeats(el);
            });

            datePicker.appendChild(dateEl);
        }
    },

    /**
     * 加载时段选择器
     * @param {HTMLElement} el 容器元素
     */
    loadTimeSlots: async (el) => {
        const timeSlotGroup = el.querySelector('#time-slot-group');
        timeSlotGroup.innerHTML = '<span style="color: #999;">加载中...</span>';

        try {
            const response = await API.getTimeSlots();
            
            if (response.code === 200 && response.data) {
                SeatBrowsePage.timeSlots = response.data;
                timeSlotGroup.innerHTML = '';

                // 添加全部时段选项
                const allBtn = Utils.dom.render(`
                    <button class="time-slot ${!SeatBrowsePage.currentTimeSlot ? 'selected' : ''}" data-slot="">全部时段</button>
                `);
                allBtn.addEventListener('click', () => {
                    SeatBrowsePage.currentTimeSlot = '';
                    timeSlotGroup.querySelectorAll('.time-slot').forEach(item => item.classList.remove('selected'));
                    allBtn.classList.add('selected');
                    SeatBrowsePage.loadSeats(el);
                });
                timeSlotGroup.appendChild(allBtn);

                response.data.forEach(slot => {
                    const isSelected = slot.slot === SeatBrowsePage.currentTimeSlot;
                    const slotEl = Utils.dom.render(`
                        <button class="time-slot ${isSelected ? 'selected' : ''}" data-slot="${slot.slot}">
                            ${slot.startTime} - ${slot.endTime}
                        </button>
                    `);

                    slotEl.addEventListener('click', () => {
                        SeatBrowsePage.currentTimeSlot = slot.slot;
                        timeSlotGroup.querySelectorAll('.time-slot').forEach(item => item.classList.remove('selected'));
                        slotEl.classList.add('selected');
                        SeatBrowsePage.loadSeats(el);
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
     * 加载座位列表
     * @param {HTMLElement} el 容器元素
     */
    loadSeats: async (el) => {
        const gridEl = el.querySelector('#seat-grid');
        const confirmBtn = el.querySelector('#confirm-selection');
        gridEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">加载中...</div>';

        try {
            const response = await API.getSeats(SeatBrowsePage.currentZone);
            
            if (response.code === 200 && response.data) {
                const seats = response.data;
                gridEl.innerHTML = '';
                
                // 按区域分组显示
                const zones = ['A', 'B', 'C'];
                
                zones.forEach(zone => {
                    const zoneSeats = seats.filter(s => s.areaName === zone + '区');
                    if (zoneSeats.length > 0) {
                        // 添加区域标题
                        const zoneTitle = Utils.dom.render(`
                            <div style="grid-column: 1 / -1; margin: 20px 0 10px; font-weight: 600; color: #667eea; font-size: 16px;">
                                📍 ${zone}区
                            </div>
                        `);
                        gridEl.appendChild(zoneTitle);
                        
                        // 添加该区域座位
                        zoneSeats.forEach(seat => {
                            gridEl.appendChild(SeatBrowsePage.createSeatElement(seat, el));
                        });
                    }
                });
                
                // 更新确认按钮状态
                if (confirmBtn) {
                    confirmBtn.disabled = !SeatBrowsePage.selectedSeat;
                    confirmBtn.textContent = SeatBrowsePage.selectedSeat 
                        ? `确认选择 (${SeatBrowsePage.selectedSeat.seatNumber})` 
                        : '确认选择';
                }
            } else {
                gridEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">暂无座位数据</div>';
            }
        } catch (err) {
            gridEl.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ff4757;">${err.msg || '加载失败'}</div>`;
        }
    },

    /**
     * 创建座位元素
     * @param {object} seat 座位数据
     * @param {HTMLElement} containerEl 容器元素
     * @returns {HTMLElement}
     */
    createSeatElement: (seat, containerEl) => {
        // 获取座位状态样式
        let statusClass = 'free';
        if (seat.status === 'RESERVED') {
            statusClass = 'reserved';
        } else if (seat.status === 'OCCUPIED') {
            statusClass = 'occupied';
        }
        
        // 检查是否为当前选中的座位
        const isSelected = SeatBrowsePage.selectedSeat?.id === seat.id;
        const displayClass = isSelected ? 'selected' : statusClass;
        
        const zone = seat.areaName?.replace('区', '') || '';
        const seatEl = Utils.dom.render(`
            <div class="seat-item ${displayClass}" data-seat-id="${seat.id}" 
                title="座位号: ${seat.seatNumber}\n区域: ${seat.areaName}\n状态: ${SeatBrowsePage.getStatusText(seat.status)}">
                <span style="font-size: 16px; font-weight: 600;">${seat.seatNumber}</span>
                <span style="font-size: 10px;">${seat.areaName}</span>
            </div>
        `);
        
        // 点击选座（仅空闲座位可选择）
        seatEl.addEventListener('click', () => {
            if (seat.status === 'FREE') {
                // 清除之前的选中状态
                containerEl.querySelectorAll('.seat-item').forEach(item => {
                    const itemSeatId = item.dataset.seatId;
                    if (itemSeatId === seat.id) {
                        // 切换选中状态
                        if (isSelected) {
                            SeatBrowsePage.selectedSeat = null;
                            item.classList.remove('selected');
                            item.classList.add(statusClass);
                        } else {
                            SeatBrowsePage.selectedSeat = seat;
                            item.classList.remove(statusClass);
                            item.classList.add('selected');
                        }
                    } else {
                        // 清除其他座位的选中状态
                        const otherSeatId = item.dataset.seatId;
                        if (SeatBrowsePage.selectedSeat?.id !== parseInt(otherSeatId)) {
                            item.classList.remove('selected');
                        }
                    }
                });
                
                // 更新确认按钮
                const confirmBtn = containerEl.querySelector('#confirm-selection');
                if (confirmBtn) {
                    confirmBtn.disabled = !SeatBrowsePage.selectedSeat;
                    confirmBtn.textContent = SeatBrowsePage.selectedSeat 
                        ? `确认选择 (${SeatBrowsePage.selectedSeat.seatNumber})` 
                        : '确认选择';
                }
            } else {
                // 非空闲座位给出提示
                Utils.message.warning(`座位 ${seat.seatNumber} 当前${SeatBrowsePage.getStatusText(seat.status)}，无法选择`);
            }
        });
        
        return seatEl;
    },

    /**
     * 获取状态文本
     * @param {string} status 状态码
     * @returns {string}
     */
    getStatusText: (status) => {
        const statusMap = {
            'FREE': '空闲',
            'RESERVED': '已预约',
            'OCCUPIED': '已占用'
        };
        return statusMap[status] || status;
    }
};

// 注册到全局
window.SeatBrowsePage = SeatBrowsePage;