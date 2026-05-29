/**
 * 管理员座位管理页面组件
 * 支持座位的增删改查、状态修改、批量操作
 */

const AdminSeatsPage = {
    // 选中的座位ID列表（用于批量操作）
    selectedSeats: [],
    // 防止重复点击
    isSubmitting: false,
    
    /**
     * 渲染座位管理页面
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
                        <li><a href="#/admin-seats" class="active">座位管理</a></li>
                        <li><a href="#/admin-time-slots">时段管理</a></li>
                        <li><a href="#/admin-users">用户管理</a></li>
                        <li><a href="#/admin-violations">违约管理</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h1 class="page-title">座位管理</h1>
                        <button class="btn btn-primary" id="add-seat-btn">添加座位</button>
                    </div>
                    
                    <!-- 搜索和筛选 -->
                    <div class="card">
                        <div style="display: flex; gap: 15px; align-items: center;">
                            <input type="text" id="search-input" class="form-input" placeholder="搜索座位号..." style="flex: 1; max-width: 300px;">
                            <select id="filter-zone" class="form-input" style="width: 120px;">
                                <option value="">全部区域</option>
                                <option value="A">A区</option>
                                <option value="B">B区</option>
                                <option value="C">C区</option>
                            </select>
                            <select id="filter-status" class="form-input" style="width: 120px;">
                                <option value="">全部状态</option>
                                <option value="FREE">空闲</option>
                                <option value="RESERVED">已预约</option>
                                <option value="OCCUPIED">已占用</option>
                            </select>
                            <button class="btn btn-secondary" id="search-btn">搜索</button>
                        </div>
                    </div>
                    
                    <!-- 批量操作栏 -->
                    <div class="card" id="batch-actions" style="display: none;">
                        <div style="display: flex; gap: 15px; align-items: center;">
                            <span>已选择 <span id="selected-count">0</span> 个座位</span>
                            <select id="batch-status" class="form-input" style="width: 120px;">
                                <option value="">批量修改状态</option>
                                <option value="FREE">设为空闲</option>
                                <option value="RESERVED">设为已预约</option>
                                <option value="OCCUPIED">设为已占用</option>
                            </select>
                            <button class="btn btn-primary" id="batch-update-btn">应用修改</button>
                            <button class="btn btn-danger" id="batch-delete-btn">批量删除</button>
                            <button class="btn btn-secondary" id="batch-cancel-btn">取消选择</button>
                        </div>
                    </div>
                    
                    <!-- 座位列表 -->
                    <div class="card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" id="select-all"></th>
                                    <th>座位号</th>
                                    <th>区域</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="seats-body">
                                <tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- 添加/编辑座位模态框 -->
                <div id="seat-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-title" id="modal-title">添加座位</div>
                        <form id="seat-form">
                            <input type="hidden" id="seat-id">
                            <div class="form-group">
                                <label class="form-label">座位号</label>
                                <input type="text" id="seat-number" class="form-input" placeholder="请输入座位号">
                            </div>
                            <div class="form-group">
                                <label class="form-label">区域</label>
                                <select id="seat-zone" class="form-input">
                                    <option value="A">A区</option>
                                    <option value="B">B区</option>
                                    <option value="C">C区</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select id="seat-status" class="form-input">
                                    <option value="FREE">空闲</option>
                                    <option value="RESERVED">已预约</option>
                                    <option value="OCCUPIED">已占用</option>
                                </select>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="modal-cancel">取消</button>
                                <button type="submit" class="btn btn-primary">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        AdminSeatsPage.bindEvents(el);
        await AdminSeatsPage.loadSeats(el);
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

        // 添加座位
        const addSeatBtn = el.querySelector('#add-seat-btn');
        if (addSeatBtn) {
            addSeatBtn.addEventListener('click', () => {
                AdminSeatsPage.openModal(el, null);
            });
        }

        // 取消按钮
        const modalCancel = el.querySelector('#modal-cancel');
        if (modalCancel) {
            modalCancel.addEventListener('click', () => {
                AdminSeatsPage.closeModal(el);
            });
        }

        // 表单提交
        const seatForm = el.querySelector('#seat-form');
        if (seatForm) {
            seatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (AdminSeatsPage.isSubmitting) {
                    Utils.message.warning('操作进行中，请稍候...');
                    return;
                }
                
                const seatIdInput = el.querySelector('#seat-id');
                const seatNumberInput = el.querySelector('#seat-number');
                const seatZoneSelect = el.querySelector('#seat-zone');
                const seatStatusSelect = el.querySelector('#seat-status');
                
                const seatId = seatIdInput ? seatIdInput.value : '';
                const seatNumber = seatNumberInput ? seatNumberInput.value.trim() : '';
                const zone = seatZoneSelect ? seatZoneSelect.value : '';
                const status = seatStatusSelect ? seatStatusSelect.value : '';

                if (!seatNumber) {
                    Utils.message.warning('请输入座位号');
                    return;
                }

                AdminSeatsPage.isSubmitting = true;
                const submitBtn = el.querySelector('#seat-form button[type="submit"]');
                const originalText = submitBtn ? submitBtn.textContent : '保存';
                if (submitBtn) {
                    submitBtn.textContent = '保存中...';
                    submitBtn.disabled = true;
                }

                try {
                    const seatData = { seatNumber, zone, status };
                    let response;

                    if (seatId) {
                        response = await API.updateSeat(seatId, seatData);
                    } else {
                        response = await API.createSeat(seatData);
                    }

                    if (response.code === 200) {
                        Utils.message.success(seatId ? '修改成功' : '添加成功');
                        AdminSeatsPage.closeModal(el);
                        AdminSeatsPage.loadSeats(el);
                    } else {
                        Utils.message.error(response.msg || '操作失败');
                    }
                } catch (err) {
                    Utils.message.error(err.msg || '操作失败，请稍后重试');
                } finally {
                    AdminSeatsPage.isSubmitting = false;
                    if (submitBtn) {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }
                }
            });
        }

        // 搜索按钮
        const searchBtn = el.querySelector('#search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                AdminSeatsPage.loadSeats(el);
            });
        }

        // 搜索输入回车
        const searchInput = el.querySelector('#search-input');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    AdminSeatsPage.loadSeats(el);
                }
            });
        }

        // 筛选条件变化
        const filterZone = el.querySelector('#filter-zone');
        if (filterZone) {
            filterZone.addEventListener('change', () => {
                AdminSeatsPage.loadSeats(el);
            });
        }
        const filterStatus = el.querySelector('#filter-status');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => {
                AdminSeatsPage.loadSeats(el);
            });
        }

        // 全选
        const selectAll = el.querySelector('#select-all');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checkboxes = el.querySelectorAll('.seat-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                    const seatId = parseInt(checkbox.dataset.id);
                    if (e.target.checked) {
                        if (!AdminSeatsPage.selectedSeats.includes(seatId)) {
                            AdminSeatsPage.selectedSeats.push(seatId);
                        }
                    } else {
                        AdminSeatsPage.selectedSeats = AdminSeatsPage.selectedSeats.filter(id => id !== seatId);
                    }
                });
                AdminSeatsPage.updateBatchActions(el);
            });
        }

        // 批量修改状态
        const batchUpdateBtn = el.querySelector('#batch-update-btn');
        if (batchUpdateBtn) {
            batchUpdateBtn.addEventListener('click', async () => {
            if (AdminSeatsPage.isSubmitting) {
                Utils.message.warning('操作进行中，请稍候...');
                return;
            }
            
            const status = el.querySelector('#batch-status').value;
            if (!status) {
                Utils.message.warning('请选择要修改的状态');
                return;
            }
            if (AdminSeatsPage.selectedSeats.length === 0) {
                Utils.message.warning('请选择要修改的座位');
                return;
            }

            if (confirm(`确定要将选中的 ${AdminSeatsPage.selectedSeats.length} 个座位状态修改为${AdminSeatsPage.getStatusText(status)}吗？`)) {
                AdminSeatsPage.isSubmitting = true;
                const btn = el.querySelector('#batch-update-btn');
                const originalText = btn.textContent;
                btn.textContent = '修改中...';
                btn.disabled = true;

                try {
                    const response = await API.batchUpdateSeatStatus({
                        seatIds: AdminSeatsPage.selectedSeats,
                        status: status
                    });
                    if (response.code === 200) {
                        Utils.message.success('批量修改成功');
                        AdminSeatsPage.selectedSeats = [];
                        AdminSeatsPage.loadSeats(el);
                    } else {
                        Utils.message.error(response.msg || '批量修改失败');
                    }
                } catch (err) {
                    Utils.message.error(err.msg || '批量修改失败，请稍后重试');
                } finally {
                    AdminSeatsPage.isSubmitting = false;
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }
        });
        }

        // 批量删除
        const batchDeleteBtn = el.querySelector('#batch-delete-btn');
        if (batchDeleteBtn) {
            batchDeleteBtn.addEventListener('click', async () => {
            if (AdminSeatsPage.isSubmitting) {
                Utils.message.warning('操作进行中，请稍候...');
                return;
            }
            
            if (AdminSeatsPage.selectedSeats.length === 0) {
                Utils.message.warning('请选择要删除的座位');
                return;
            }

            if (confirm(`确定要删除选中的 ${AdminSeatsPage.selectedSeats.length} 个座位吗？`)) {
                AdminSeatsPage.isSubmitting = true;
                const btn = el.querySelector('#batch-delete-btn');
                const originalText = btn.textContent;
                btn.textContent = '删除中...';
                btn.disabled = true;

                try {
                    const response = await API.batchDeleteSeats(AdminSeatsPage.selectedSeats);
                    if (response.code === 200) {
                        Utils.message.success('批量删除成功');
                        AdminSeatsPage.selectedSeats = [];
                        AdminSeatsPage.loadSeats(el);
                    } else {
                        Utils.message.error(response.msg || '批量删除失败');
                    }
                } catch (err) {
                    Utils.message.error(err.msg || '批量删除失败，请稍后重试');
                } finally {
                    AdminSeatsPage.isSubmitting = false;
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }
        });
        }

        // 取消选择
        const batchCancelBtn = el.querySelector('#batch-cancel-btn');
        if (batchCancelBtn) {
            batchCancelBtn.addEventListener('click', () => {
                AdminSeatsPage.selectedSeats = [];
                el.querySelectorAll('.seat-checkbox').forEach(checkbox => {
                    checkbox.checked = false;
                });
                const selectAll = el.querySelector('#select-all');
                if (selectAll) {
                    selectAll.checked = false;
                }
                AdminSeatsPage.updateBatchActions(el);
            });
        }
    },

    /**
     * 更新批量操作栏显示
     */
    updateBatchActions: (el) => {
        const batchActions = el.querySelector('#batch-actions');
        const selectedCount = el.querySelector('#selected-count');
        
        if (AdminSeatsPage.selectedSeats.length > 0) {
            batchActions.style.display = 'flex';
            selectedCount.textContent = AdminSeatsPage.selectedSeats.length;
        } else {
            batchActions.style.display = 'none';
        }
    },

    /**
     * 加载座位列表
     * @param {HTMLElement} el 容器元素
     */
    loadSeats: async (el) => {
        const tbody = el.querySelector('#seats-body');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>';

        try {
            console.log('AdminSeatsPage.loadSeats called');
            
            // 获取筛选条件
            const searchInput = el.querySelector('#search-input');
            const filterZoneSelect = el.querySelector('#filter-zone');
            const filterStatusSelect = el.querySelector('#filter-status');
            
            const searchKeyword = searchInput ? searchInput.value.trim() : '';
            const filterZone = filterZoneSelect ? filterZoneSelect.value : '';
            const filterStatus = filterStatusSelect ? filterStatusSelect.value : '';

            console.log('Calling API.getSeats with zone:', filterZone);
            const response = await API.getSeats(filterZone);
            console.log('API.getSeats response:', response);
            
            if (response.code === 200 && response.data) {
                let seats = response.data;

                // 搜索过滤
                if (searchKeyword) {
                    seats = seats.filter(s => s.seatNumber.includes(searchKeyword));
                }
                // 状态过滤
                if (filterStatus) {
                    seats = seats.filter(s => s.status === filterStatus);
                }

                if (seats.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">暂无座位数据</td></tr>';
                    AdminSeatsPage.selectedSeats = [];
                    AdminSeatsPage.updateBatchActions(el);
                    return;
                }

                tbody.innerHTML = '';
                AdminSeatsPage.selectedSeats = [];

                seats.forEach(seat => {
                    const statusText = AdminSeatsPage.getStatusText(seat.status);
                    const statusClass = AdminSeatsPage.getStatusClass(seat.status);

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="checkbox" class="seat-checkbox" data-id="${seat.id}"></td>
                        <td>${seat.seatNumber}</td>
                        <td>${seat.areaName}</td>
                        <td>
                            <select class="status-select" data-id="${seat.id}" data-current="${seat.status}">
                                <option value="FREE" ${seat.status === 'FREE' ? 'selected' : ''}>空闲</option>
                                <option value="RESERVED" ${seat.status === 'RESERVED' ? 'selected' : ''}>已预约</option>
                                <option value="OCCUPIED" ${seat.status === 'OCCUPIED' ? 'selected' : ''}>已占用</option>
                            </select>
                        </td>
                        <td>
                            <button class="btn btn-primary btn-sm" data-id="${seat.id}" data-seatnumber="${seat.seatNumber}" data-zone="${seat.areaName ? seat.areaName.replace('区', '') : ''}" data-status="${seat.status}">编辑</button>
                            <button class="btn btn-danger btn-sm" data-id="${seat.id}">删除</button>
                        </td>
                    `;

                    const statusSelect = row.querySelector('.status-select');
                    if (statusSelect) {
                        statusSelect.addEventListener('change', async (e) => {
                            const select = e.target;
                            const newStatus = select.value;
                            const seatId = select.dataset.id;
                            const oldStatus = select.dataset.current;

                            if (newStatus !== oldStatus) {
                                select.disabled = true;

                                try {
                                const response = await API.updateSeatStatus(seatId, newStatus);
                                if (response.code === 200) {
                                    Utils.message.success('状态修改成功');
                                    select.dataset.current = newStatus;
                                } else {
                                    select.value = oldStatus;
                                    Utils.message.error(response.msg || '状态修改失败');
                                }
                            } catch (err) {
                                select.value = oldStatus;
                                Utils.message.error(err.msg || '状态修改失败，请稍后重试');
                            } finally {
                                    select.disabled = false;
                                }
                            }
                        });
                    }

                    const editBtn = row.querySelector('.btn-primary');
                    if (editBtn) {
                        editBtn.addEventListener('click', (e) => {
                            const btn = e.target;
                            AdminSeatsPage.openModal(el, {
                                id: btn.dataset.id,
                                seatNumber: btn.dataset.seatnumber,
                                zone: btn.dataset.zone,
                                status: btn.dataset.status
                            });
                        });
                    }

                    const deleteBtn = row.querySelector('.btn-danger');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', async (e) => {
                            const btn = e.target;
                            if (btn.disabled) {
                                Utils.message.warning('操作进行中，请稍候...');
                                return;
                            }

                            if (confirm('确定要删除这个座位吗？')) {
                                btn.disabled = true;
                                const originalText = btn.textContent;
                                btn.textContent = '删除中...';

                                try {
                                    const response = await API.deleteSeat(btn.dataset.id);
                                    if (response.code === 200) {
                                        Utils.message.success('删除成功');
                                        AdminSeatsPage.loadSeats(el);
                                    } else {
                                        Utils.message.error(response.msg || '删除失败');
                                    }
                                } catch (err) {
                                    Utils.message.error(err.msg || '删除失败，请稍后重试');
                                } finally {
                                    btn.textContent = originalText;
                                    btn.disabled = false;
                                }
                            }
                        });
                    }

                    const checkbox = row.querySelector('.seat-checkbox');
                    if (checkbox) {
                        checkbox.addEventListener('change', (e) => {
                            const checkboxEl = e.target;
                            const seatId = parseInt(checkboxEl.dataset.id);

                            if (checkboxEl.checked) {
                                if (!AdminSeatsPage.selectedSeats.includes(seatId)) {
                                    AdminSeatsPage.selectedSeats.push(seatId);
                                }
                            } else {
                                AdminSeatsPage.selectedSeats = AdminSeatsPage.selectedSeats.filter(id => id !== seatId);
                            }

                            const allCheckboxes = el.querySelectorAll('.seat-checkbox');
                            const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                            el.querySelector('#select-all').checked = allChecked;

                            AdminSeatsPage.updateBatchActions(el);
                        });
                    }

                    tbody.appendChild(row);
                });
                
                AdminSeatsPage.updateBatchActions(el);
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">暂无座位数据</td></tr>';
                AdminSeatsPage.selectedSeats = [];
                AdminSeatsPage.updateBatchActions(el);
            }
        } catch (err) {
            console.error('加载座位列表失败:', err);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #ff4757;">加载失败: ${err.msg || err.message || '未知错误'}</td></tr>`;
            AdminSeatsPage.selectedSeats = [];
            AdminSeatsPage.updateBatchActions(el);
        }
    },

    /**
     * 打开模态框
     * @param {HTMLElement} el 容器元素
     * @param {object|null} seat 座位数据
     */
    openModal: (el, seat) => {
        const modal = el.querySelector('#seat-modal');
        const title = el.querySelector('#modal-title');
        const seatId = el.querySelector('#seat-id');
        const seatNumber = el.querySelector('#seat-number');
        const seatZone = el.querySelector('#seat-zone');
        const seatStatus = el.querySelector('#seat-status');

        if (seat) {
            title.textContent = '编辑座位';
            seatId.value = seat.id;
            seatNumber.value = seat.seatNumber;
            seatZone.value = seat.zone;
            seatStatus.value = seat.status || 'FREE';
        } else {
            title.textContent = '添加座位';
            seatId.value = '';
            seatNumber.value = '';
            seatZone.value = 'A';
            seatStatus.value = 'FREE';
        }

        modal.style.display = 'flex';
    },

    /**
     * 关闭模态框
     * @param {HTMLElement} el 容器元素
     */
    closeModal: (el) => {
        el.querySelector('#seat-modal').style.display = 'none';
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
    },

    /**
     * 获取状态样式类
     * @param {string} status 状态码
     * @returns {string}
     */
    getStatusClass: (status) => {
        const classMap = {
            'FREE': 'alert-success',
            'RESERVED': 'alert-warning',
            'OCCUPIED': 'alert-error'
        };
        return classMap[status] || '';
    }
};

// 注册到全局
window.AdminSeatsPage = AdminSeatsPage;