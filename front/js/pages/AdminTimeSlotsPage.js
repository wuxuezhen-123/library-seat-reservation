/**
 * 管理员时段管理页面组件
 */

const AdminTimeSlotsPage = {
    /**
     * 渲染时段管理页面
     * @returns {HTMLElement}
     */
    render: async () => {
        const template = `
            <div class="layout-container">
                <!-- 侧边栏 -->
                <div class="sidebar">
                    <div class="sidebar-header">管理员控制台</div>
                    <ul class="sidebar-nav">
                        <li><a href="#/admin-home">首页</a></li>
                        <li><a href="#/seat-browse">座位浏览</a></li>
                        <li><a href="#/admin-seats">座位管理</a></li>
                        <li><a href="#/admin-time-slots" class="active">时段管理</a></li>
                        <li><a href="#/admin-users">用户管理</a></li>
                        <li><a href="#/admin-violations">违约管理</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h1 class="page-title">时段管理</h1>
                        <button class="btn btn-primary" id="add-slot-btn">添加时段</button>
                    </div>
                    
                    <!-- 时段列表 -->
                    <div class="card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>时段标识</th>
                                    <th>开始时间</th>
                                    <th>结束时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="slots-body">
                                <tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- 添加/编辑时段模态框 -->
                <div id="slot-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-title" id="slot-modal-title">添加时段</div>
                        <form id="slot-form">
                            <input type="hidden" id="slot-id">
                            <div class="form-group">
                                <label class="form-label">时段标识</label>
                                <input type="text" id="slot-name" class="form-input" placeholder="如：AM1">
                            </div>
                            <div class="form-group">
                                <label class="form-label">开始时间</label>
                                <input type="time" id="slot-start" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">结束时间</label>
                                <input type="time" id="slot-end" class="form-input">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="slot-modal-cancel">取消</button>
                                <button type="submit" class="btn btn-primary">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        AdminTimeSlotsPage.bindEvents(el);
        await AdminTimeSlotsPage.loadSlots(el);
        return el;
    },

    /**
     * 绑定事件
     * @param {HTMLElement} el 容器元素
     */
    bindEvents: (el) => {
        // 退出登录
        const logoutBtn = el.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('确定要退出登录吗？')) {
                    Utils.auth.clearUser();
                    Utils.message.success('已退出登录');
                    Router.navigate('login');
                }
            });
        }

        // 添加时段
        const addSlotBtn = el.querySelector('#add-slot-btn');
        if (addSlotBtn) {
            addSlotBtn.addEventListener('click', () => {
                AdminTimeSlotsPage.openModal(el, null);
            });
        }

        // 取消按钮
        const slotModalCancel = el.querySelector('#slot-modal-cancel');
        if (slotModalCancel) {
            slotModalCancel.addEventListener('click', () => {
                AdminTimeSlotsPage.closeModal(el);
            });
        }

        // 表单提交
        const slotForm = el.querySelector('#slot-form');
        if (slotForm) {
            slotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const slotIdInput = el.querySelector('#slot-id');
                const slotNameInput = el.querySelector('#slot-name');
                const slotStartInput = el.querySelector('#slot-start');
                const slotEndInput = el.querySelector('#slot-end');
                
                const slotId = slotIdInput ? slotIdInput.value : '';
                const slot = slotNameInput ? slotNameInput.value.trim() : '';
                const startTime = slotStartInput ? slotStartInput.value : '';
                const endTime = slotEndInput ? slotEndInput.value : '';

                if (!slot) {
                    Utils.message.warning('请输入时段标识');
                    return;
                }
                if (!startTime) {
                    Utils.message.warning('请选择开始时间');
                    return;
                }
                if (!endTime) {
                    Utils.message.warning('请选择结束时间');
                    return;
                }
                if (startTime >= endTime) {
                    Utils.message.warning('结束时间必须大于开始时间');
                    return;
                }

            try {
                const slotData = { slot, startTime, endTime };
                let response;

                if (slotId) {
                    response = await API.updateTimeSlot(slotId, slotData);
                } else {
                    response = await API.createTimeSlot(slotData);
                }

                if (response.code === 200) {
                    Utils.message.success(slotId ? '修改成功' : '添加成功');
                    AdminTimeSlotsPage.closeModal(el);
                    AdminTimeSlotsPage.loadSlots(el);
                } else {
                    Utils.message.error(response.msg || '操作失败');
                }
            } catch (err) {
                Utils.message.error(err.msg || '操作失败');
            }
        });
        }
    },

    /**
     * 加载时段列表
     * @param {HTMLElement} el 容器元素
     */
    loadSlots: async (el) => {
        const tbody = el.querySelector('#slots-body');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>';

        try {
            console.log('AdminTimeSlotsPage.loadSlots called');
            const response = await API.getTimeSlots();
            console.log('API.getTimeSlots response:', response);
            
            if (response.code === 200 && response.data) {
                const slots = response.data;
                console.log('Slots data:', slots);
                console.log('Slots count:', slots.length);

                if (slots.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">暂无时段数据</td></tr>';
                    return;
                }

                tbody.innerHTML = '';

                slots.forEach(slot => {
                    console.log('Rendering slot:', slot);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${slot.slot}</td>
                        <td>${slot.startTime}</td>
                        <td>${slot.endTime}</td>
                        <td>
                            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px; margin-right: 5px;" 
                                data-id="${slot.id}" data-slot="${slot.slot}" 
                                data-start="${slot.startTime}" data-end="${slot.endTime}">编辑</button>
                            <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" data-id="${slot.id}">删除</button>
                        </td>
                    `;

                    // 编辑按钮事件
                    const editBtn = row.querySelector('.btn-primary');
                    if (editBtn) {
                        editBtn.addEventListener('click', (e) => {
                            const btn = e.target;
                            AdminTimeSlotsPage.openModal(el, {
                                id: btn.dataset.id,
                                slot: btn.dataset.slot,
                                startTime: btn.dataset.start,
                                endTime: btn.dataset.end
                            });
                        });
                    }

                    // 删除按钮事件
                    const deleteBtn = row.querySelector('.btn-danger');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', async (e) => {
                            const btn = e.target;
                            if (confirm('确定要删除这个时段吗？')) {
                                try {
                                    const response = await API.deleteTimeSlot(btn.dataset.id);
                                    if (response.code === 200) {
                                        Utils.message.success('删除成功');
                                        AdminTimeSlotsPage.loadSlots(el);
                                    } else {
                                        Utils.message.error(response.msg || '删除失败');
                                    }
                                } catch (err) {
                                    Utils.message.error(err.msg || '删除失败');
                                }
                            }
                        });
                    }

                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">暂无时段数据</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #ff4757;">${err.msg || '加载失败'}</td></tr>`;
        }
    },

    /**
     * 打开模态框
     * @param {HTMLElement} el 容器元素
     * @param {object|null} slot 时段数据
     */
    openModal: (el, slot) => {
        const modal = el.querySelector('#slot-modal');
        const title = el.querySelector('#slot-modal-title');
        const slotId = el.querySelector('#slot-id');
        const slotName = el.querySelector('#slot-name');
        const slotStart = el.querySelector('#slot-start');
        const slotEnd = el.querySelector('#slot-end');

        if (slot) {
            title.textContent = '编辑时段';
            slotId.value = slot.id;
            slotName.value = slot.slot;
            slotStart.value = slot.startTime;
            slotEnd.value = slot.endTime;
        } else {
            title.textContent = '添加时段';
            slotId.value = '';
            slotName.value = '';
            slotStart.value = '';
            slotEnd.value = '';
        }

        modal.style.display = 'flex';
    },

    /**
     * 关闭模态框
     * @param {HTMLElement} el 容器元素
     */
    closeModal: (el) => {
        el.querySelector('#slot-modal').style.display = 'none';
    }
};

// 注册到全局
window.AdminTimeSlotsPage = AdminTimeSlotsPage;