/**
 * 管理员违约管理页面组件
 */

const AdminViolationsPage = {
    // 防止重复点击
    isSubmitting: false,
    
    /**
     * 渲染违约管理页面
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
                        <li><a href="#/admin-time-slots">时段管理</a></li>
                        <li><a href="#/admin-users">用户管理</a></li>
                        <li><a href="#/admin-violations" class="active">违约管理</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h1 class="page-title">违约管理</h1>
                        <button class="btn btn-primary" id="add-violation-btn">添加违约记录</button>
                    </div>
                    
                    <!-- 用户违约概览 -->
                    <div class="card">
                        <h3 class="card-title">用户违约概览</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>用户名</th>
                                    <th>学号</th>
                                    <th>违约次数</th>
                                    <th>黑名单状态</th>
                                    <th>封禁到期</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="users-body">
                                <tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- 违约记录明细 -->
                    <div class="card">
                        <h3 class="card-title">违约记录明细</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>用户</th>
                                    <th>学号</th>
                                    <th>座位号</th>
                                    <th>违约类型</th>
                                    <th>违约时间</th>
                                    <th>备注</th>
                                </tr>
                            </thead>
                            <tbody id="violations-body">
                                <tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- 添加违约记录模态框 -->
                <div id="violation-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-title">添加违约记录</div>
                        <form id="violation-form">
                            <div class="form-group">
                                <label class="form-label">用户ID</label>
                                <input type="number" id="violation-user-id" class="form-input" placeholder="请输入用户ID">
                            </div>
                            <div class="form-group">
                                <label class="form-label">违约类型</label>
                                <select id="violation-type" class="form-input">
                                    <option value="NO_CHECKIN">未签到</option>
                                    <option value="NO_CHECKOUT">未签退</option>
                                    <option value="OVERTIME">超时占用</option>
                                    <option value="OTHER">其他</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">备注</label>
                                <textarea id="violation-note" class="form-input" placeholder="请输入备注信息" rows="3"></textarea>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="violation-modal-cancel">取消</button>
                                <button type="submit" class="btn btn-primary">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        AdminViolationsPage.bindEvents(el);
        await AdminViolationsPage.loadUsers(el);
        await AdminViolationsPage.loadViolations(el);
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

        // 添加违约记录
        el.querySelector('#add-violation-btn').addEventListener('click', () => {
            AdminViolationsPage.openModal(el);
        });

        // 取消按钮
        el.querySelector('#violation-modal-cancel').addEventListener('click', () => {
            AdminViolationsPage.closeModal(el);
        });

        // 表单提交
        el.querySelector('#violation-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (AdminViolationsPage.isSubmitting) {
                Utils.message.warning('操作进行中，请稍候...');
                return;
            }
            
            const userId = el.querySelector('#violation-user-id').value;
            const type = el.querySelector('#violation-type').value;
            const note = el.querySelector('#violation-note').value.trim();

            if (!userId) {
                Utils.message.warning('请输入用户ID');
                return;
            }

            AdminViolationsPage.isSubmitting = true;
            const submitBtn = el.querySelector('#violation-form button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '添加中...';
            submitBtn.disabled = true;

            try {
                const response = await API.addViolation(userId, { type, note });

                if (response.code === 200) {
                    Utils.message.success('添加成功');
                    AdminViolationsPage.closeModal(el);
                    AdminViolationsPage.loadUsers(el);
                    AdminViolationsPage.loadViolations(el);
                } else {
                    Utils.message.error(response.msg || '添加失败');
                }
            } catch (err) {
                Utils.message.error(err.msg || '添加失败，请稍后重试');
            } finally {
                AdminViolationsPage.isSubmitting = false;
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    },

    /**
     * 加载用户列表（显示违约概览）
     * @param {HTMLElement} el 容器元素
     */
    loadUsers: async (el) => {
        const tbody = el.querySelector('#users-body');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>';

        try {
            const usersResponse = await API.getUsers();
            
            if (usersResponse.code === 200 && usersResponse.data) {
                const users = usersResponse.data;

                tbody.innerHTML = '';

                users.forEach(user => {
                    const isBlacklisted = user.isBlacklisted || user.blacklisted || false;
                    const banEndDate = user.banEndDate ? new Date(user.banEndDate).toLocaleDateString('zh-CN') : '-';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.name || '-'}</td>
                        <td>${user.username || '-'}</td>
                        <td>${user.violationCount || 0}</td>
                        <td>${isBlacklisted ? '<span class="alert-error">是</span>' : '<span class="alert-success">否</span>'}</td>
                        <td>${banEndDate}</td>
                        <td>
                            ${isBlacklisted ? '<button class="btn btn-success btn-sm unban-btn" data-id="' + user.id + '">解除黑名单</button>' : '<button class="btn btn-warning btn-sm add-violation-btn" data-id="' + user.id + '">标记违约</button>'}
                        </td>
                    `;

                    tbody.appendChild(row);
                });

                // 绑定解除黑名单按钮事件
                el.querySelectorAll('.unban-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        if (AdminViolationsPage.isSubmitting) {
                            Utils.message.warning('操作进行中，请稍候...');
                            return;
                        }
                        
                        const userId = e.target.dataset.id;
                        if (confirm('确定要解除该用户的黑名单吗？')) {
                            AdminViolationsPage.isSubmitting = true;
                            const originalText = btn.textContent;
                            btn.textContent = '解除中...';
                            btn.disabled = true;

                            try {
                                const response = await API.removeFromBlacklist(userId);
                                if (response.code === 200) {
                                    Utils.message.success('已解除黑名单');
                                    AdminViolationsPage.loadUsers(el);
                                    AdminViolationsPage.loadViolations(el);
                                } else {
                                    Utils.message.error(response.msg || '操作失败');
                                }
                            } catch (err) {
                                Utils.message.error(err.msg || '操作失败，请稍后重试');
                            } finally {
                                AdminViolationsPage.isSubmitting = false;
                                btn.textContent = originalText;
                                btn.disabled = false;
                            }
                        }
                    });
                });

                // 绑定标记违约按钮事件
                el.querySelectorAll('.add-violation-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const userId = e.target.dataset.id;
                        AdminViolationsPage.openViolationModal(el, userId);
                    });
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">暂无用户数据</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #ff4757;">${err.msg || '加载失败'}</td></tr>`;
        }
    },

    /**
     * 加载违约记录列表
     * @param {HTMLElement} el 容器元素
     */
    loadViolations: async (el) => {
        const tbody = el.querySelector('#violations-body');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>';

        try {
            const response = await API.getAllViolations();
            
            if (response.code === 200 && response.data) {
                const violations = response.data;

                violations.sort((a, b) => new Date(b.violationTime) - new Date(a.violationTime));

                if (violations.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">暂无违约记录</td></tr>';
                    return;
                }

                tbody.innerHTML = '';

                violations.forEach(violation => {
                    const typeText = AdminViolationsPage.getViolationTypeText(violation.violationType);

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${violation.studentName || '-'}</td>
                        <td>${violation.studentUsername || '-'}</td>
                        <td>-</td>
                        <td><span class="alert-error">${typeText}</span></td>
                        <td>${violation.violationTime ? new Date(violation.violationTime).toLocaleString('zh-CN') : '-'}</td>
                        <td>${violation.description || '-'}</td>
                    `;

                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">暂无违约记录</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #ff4757;">${err.msg || '加载失败'}</td></tr>`;
        }
    },

    /**
     * 打开违约记录模态框（带用户ID预设）
     */
    openViolationModal: (el, userId) => {
        const modal = el.querySelector('#violation-modal');
        el.querySelector('#violation-user-id').value = userId || '';
        el.querySelector('#violation-type').value = 'OTHER';
        el.querySelector('#violation-note').value = '';
        modal.style.display = 'flex';
    },

    /**
     * 打开模态框
     * @param {HTMLElement} el 容器元素
     */
    openModal: (el) => {
        const modal = el.querySelector('#violation-modal');
        el.querySelector('#violation-user-id').value = '';
        el.querySelector('#violation-type').value = 'NO_CHECKIN';
        el.querySelector('#violation-note').value = '';
        modal.style.display = 'flex';
    },

    /**
     * 关闭模态框
     * @param {HTMLElement} el 容器元素
     */
    closeModal: (el) => {
        el.querySelector('#violation-modal').style.display = 'none';
    },

    /**
     * 获取违约类型文本
     * @param {string} type 类型码
     * @returns {string}
     */
    getViolationTypeText: (type) => {
        const typeMap = {
            'NO_CHECKIN': '未签到',
            'NO_CHECKOUT': '未签退',
            'OVERTIME': '超时占用',
            'OTHER': '其他',
            'NO_SHOW': '未到场',
            'LATE_CHECKIN': '迟到签到'
        };
        return typeMap[type] || type;
    }
};

// 注册到全局
window.AdminViolationsPage = AdminViolationsPage;