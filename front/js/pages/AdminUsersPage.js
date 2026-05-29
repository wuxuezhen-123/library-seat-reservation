/**
 * 管理员用户管理页面组件
 */

const AdminUsersPage = {
    /**
     * 渲染用户管理页面
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
                        <li><a href="#/admin-users" class="active">用户管理</a></li>
                        <li><a href="#/admin-violations">违约管理</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h1 class="page-title">用户管理</h1>
                        <button class="btn btn-primary" id="add-user-btn">添加用户</button>
                    </div>
                    
                    <!-- 搜索框 -->
                    <div class="card">
                        <input type="text" id="search-input" class="form-input" placeholder="搜索用户名或姓名..." style="max-width: 300px;">
                    </div>
                    
                    <!-- 用户列表 -->
                    <div class="card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>用户名</th>
                                    <th>姓名</th>
                                    <th>角色</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="users-body">
                                <tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- 添加/编辑用户模态框 -->
                <div id="user-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-title" id="user-modal-title">添加用户</div>
                        <form id="user-form">
                            <input type="hidden" id="user-id">
                            <div class="form-group">
                                <label class="form-label">用户名</label>
                                <input type="text" id="user-username" class="form-input" placeholder="请输入用户名">
                            </div>
                            <div class="form-group">
                                <label class="form-label">姓名</label>
                                <input type="text" id="user-name" class="form-input" placeholder="请输入姓名">
                            </div>
                            <div class="form-group">
                                <label class="form-label">密码</label>
                                <input type="password" id="user-password" class="form-input" placeholder="请输入密码（编辑时留空不修改）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">角色</label>
                                <select id="user-role" class="form-input">
                                    <option value="STUDENT">学生</option>
                                    <option value="ADMIN">管理员</option>
                                </select>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="user-modal-cancel">取消</button>
                                <button type="submit" class="btn btn-primary">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        AdminUsersPage.bindEvents(el);
        await AdminUsersPage.loadUsers(el);
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

        // 添加用户
        const addUserBtn = el.querySelector('#add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                AdminUsersPage.openModal(el, null);
            });
        }

        // 取消按钮
        const userModalCancel = el.querySelector('#user-modal-cancel');
        if (userModalCancel) {
            userModalCancel.addEventListener('click', () => {
                AdminUsersPage.closeModal(el);
            });
        }

        // 搜索
        const searchInput = el.querySelector('#search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                AdminUsersPage.loadUsers(el, e.target.value);
            });
        }

        // 表单提交
        const userForm = el.querySelector('#user-form');
        if (userForm) {
            userForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const userIdInput = el.querySelector('#user-id');
                const userUsernameInput = el.querySelector('#user-username');
                const userNameInput = el.querySelector('#user-name');
                const userPasswordInput = el.querySelector('#user-password');
                const userRoleSelect = el.querySelector('#user-role');
                
                const userId = userIdInput ? userIdInput.value : '';
                const username = userUsernameInput ? userUsernameInput.value.trim() : '';
                const name = userNameInput ? userNameInput.value.trim() : '';
                const password = userPasswordInput ? userPasswordInput.value : '';
                const role = userRoleSelect ? userRoleSelect.value : '';

                if (!username) {
                    Utils.message.warning('请输入用户名');
                    return;
                }
                if (!name) {
                    Utils.message.warning('请输入姓名');
                    return;
                }
                if (!userId && !password) {
                    Utils.message.warning('请输入密码');
                    return;
                }

            try {
                const userData = { username, name, role };
                if (password) {
                    userData.password = password;
                }

                let response;

                if (userId) {
                    response = await API.updateUser(userId, userData);
                } else {
                    response = await API.createUser(userData);
                }

                if (response.code === 200) {
                    Utils.message.success(userId ? '修改成功' : '添加成功');
                    AdminUsersPage.closeModal(el);
                    AdminUsersPage.loadUsers(el);
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
     * 加载用户列表
     * @param {HTMLElement} el 容器元素
     * @param {string} keyword 搜索关键词
     */
    loadUsers: async (el, keyword = '') => {
        const tbody = el.querySelector('#users-body');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>';

        try {
            const response = await API.getUsers({ keyword });
            
            if (response.code === 200 && response.data) {
                const users = response.data;

                if (users.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">暂无用户数据</td></tr>';
                    return;
                }

                tbody.innerHTML = '';

                users.forEach(user => {
                    const roleText = user.role === 'ADMIN' ? '管理员' : '学生';
                    const statusText = user.enabled ? '启用' : '禁用';
                    const statusClass = user.enabled ? 'alert-success' : 'alert-error';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.username}</td>
                        <td>${user.name}</td>
                        <td>${roleText}</td>
                        <td><span class="${statusClass}">${statusText}</span></td>
                        <td>
                            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px; margin-right: 5px;" 
                                data-id="${user.id}" data-username="${user.username}" 
                                data-name="${user.name}" data-role="${user.role}">编辑</button>
                            <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" data-id="${user.id}">删除</button>
                        </td>
                    `;

                    // 编辑按钮事件
                    const editBtn = row.querySelector('.btn-primary');
                    if (editBtn) {
                        editBtn.addEventListener('click', (e) => {
                            const btn = e.target;
                            AdminUsersPage.openModal(el, {
                                id: btn.dataset.id,
                                username: btn.dataset.username,
                                name: btn.dataset.name,
                                role: btn.dataset.role
                            });
                        });
                    }

                    // 删除按钮事件
                    const deleteBtn = row.querySelector('.btn-danger');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', async (e) => {
                            const btn = e.target;
                            if (confirm('确定要删除这个用户吗？')) {
                                try {
                                    const response = await API.deleteUser(btn.dataset.id);
                                    if (response.code === 200) {
                                        Utils.message.success('删除成功');
                                        AdminUsersPage.loadUsers(el);
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
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">暂无用户数据</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #ff4757;">${err.msg || '加载失败'}</td></tr>`;
        }
    },

    /**
     * 打开模态框
     * @param {HTMLElement} el 容器元素
     * @param {object|null} user 用户数据
     */
    openModal: (el, user) => {
        const modal = el.querySelector('#user-modal');
        const title = el.querySelector('#user-modal-title');
        const userId = el.querySelector('#user-id');
        const userUsername = el.querySelector('#user-username');
        const userName = el.querySelector('#user-name');
        const userPassword = el.querySelector('#user-password');
        const userRole = el.querySelector('#user-role');

        if (user) {
            title.textContent = '编辑用户';
            userId.value = user.id;
            userUsername.value = user.username;
            userName.value = user.name;
            userPassword.value = '';
            userRole.value = user.role;
        } else {
            title.textContent = '添加用户';
            userId.value = '';
            userUsername.value = '';
            userName.value = '';
            userPassword.value = '';
            userRole.value = 'STUDENT';
        }

        modal.style.display = 'flex';
    },

    /**
     * 关闭模态框
     * @param {HTMLElement} el 容器元素
     */
    closeModal: (el) => {
        el.querySelector('#user-modal').style.display = 'none';
    }
};

// 注册到全局
window.AdminUsersPage = AdminUsersPage;