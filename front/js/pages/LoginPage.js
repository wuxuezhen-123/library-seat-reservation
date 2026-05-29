/**
 * 登录页面组件
 * 支持学生/管理员角色切换、表单校验、登录接口对接、错误提示、未登录拦截
 */

const LoginPage = {
    // 当前选择的角色
    currentRole: 'STUDENT',
    // 登录中状态（防止重复提交）
    isLoading: false,
    
    /**
     * 渲染登录页面
     * @returns {HTMLElement}
     */
    render: () => {
        // 未登录拦截 - 检查是否已登录，如果已登录则自动跳转到对应首页
        if (Utils.auth.isLoggedIn()) {
            const user = Utils.auth.getUser();
            // 根据用户角色跳转到对应首页
            if (user && user.role === 'ADMIN') {
                Router.navigate('admin-home');
            } else {
                Router.navigate('student-home');
            }
            return Utils.dom.create('div', { style: 'text-align: center; padding: 100px; color: #667eea;' }, '跳转中...');
        }

        const template = `
            <div class="login-container">
                <div class="login-box">
                    <!-- 标题 -->
                    <h2 class="login-title">📚 图书馆自习座位预约系统</h2>
                    
                    <!-- 角色选择 -->
                    <div class="role-switch">
                        <button class="role-btn active" id="role-student" type="button">👨‍🎓 学生登录</button>
                        <button class="role-btn" id="role-admin" type="button">👨‍💼 管理员登录</button>
                    </div>
                    
                    <!-- 登录表单 -->
                    <form id="login-form" novalidate>
                        <!-- 账号输入 -->
                        <div class="form-group">
                            <label class="form-label">账号</label>
                            <input 
                                type="text" 
                                id="username" 
                                class="form-input" 
                                placeholder="请输入账号" 
                                autocomplete="username"
                                required
                            >
                            <div id="username-error" class="error-message" style="display: none;"></div>
                        </div>
                        
                        <!-- 密码输入 -->
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input 
                                type="password" 
                                id="password" 
                                class="form-input" 
                                placeholder="请输入密码" 
                                autocomplete="current-password"
                                required
                            >
                            <div id="password-error" class="error-message" style="display: none;"></div>
                        </div>
                        
                        <!-- 登录按钮 -->
                        <button type="submit" class="login-btn" id="login-btn">
                            <span class="btn-text">登 录</span>
                            <span class="btn-loading" style="display: none;">登录中...</span>
                        </button>
                        
                        <!-- 表单级错误提示 -->
                        <div id="form-error" class="error-message"></div>
                    </form>
                    
                    <!-- 测试账号提示 -->
                    <div style="margin-top: 20px; padding: 15px; background: #f0f4ff; border-radius: 8px; font-size: 12px; color: #666;">
                        <div style="margin-bottom: 5px;">💡 测试账号：</div>
                        <div>学生：student / 123456</div>
                        <div>管理员：admin / admin123</div>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        LoginPage.bindEvents(el);
        return el;
    },

    /**
     * 绑定事件
     * @param {HTMLElement} el 容器元素
     */
    bindEvents: (el) => {
        // 获取DOM元素引用
        const usernameInput = el.querySelector('#username');
        const passwordInput = el.querySelector('#password');
        const usernameErrorEl = el.querySelector('#username-error');
        const passwordErrorEl = el.querySelector('#password-error');
        const formErrorEl = el.querySelector('#form-error');
        const loginBtn = el.querySelector('#login-btn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');

        /**
         * 角色切换处理
         */
        el.querySelector('#role-student').addEventListener('click', () => {
            LoginPage.currentRole = 'STUDENT';
            el.querySelector('#role-student').classList.add('active');
            el.querySelector('#role-admin').classList.remove('active');
            formErrorEl.textContent = '';
        });

        el.querySelector('#role-admin').addEventListener('click', () => {
            LoginPage.currentRole = 'ADMIN';
            el.querySelector('#role-admin').classList.add('active');
            el.querySelector('#role-student').classList.remove('active');
            formErrorEl.textContent = '';
        });

        /**
         * 实时表单校验 - 账号
         */
        usernameInput.addEventListener('blur', () => {
            const error = Utils.validate.username(usernameInput.value.trim());
            if (error) {
                usernameErrorEl.textContent = error;
                usernameErrorEl.style.display = 'block';
                usernameInput.style.borderColor = '#ff4757';
            } else {
                usernameErrorEl.style.display = 'none';
                usernameInput.style.borderColor = '#e0e0e0';
            }
        });

        usernameInput.addEventListener('input', () => {
            if (usernameErrorEl.style.display === 'block') {
                const error = Utils.validate.username(usernameInput.value.trim());
                if (!error) {
                    usernameErrorEl.style.display = 'none';
                    usernameInput.style.borderColor = '#e0e0e0';
                }
            }
        });

        /**
         * 实时表单校验 - 密码
         */
        passwordInput.addEventListener('blur', () => {
            const error = Utils.validate.password(passwordInput.value);
            if (error) {
                passwordErrorEl.textContent = error;
                passwordErrorEl.style.display = 'block';
                passwordInput.style.borderColor = '#ff4757';
            } else {
                passwordErrorEl.style.display = 'none';
                passwordInput.style.borderColor = '#e0e0e0';
            }
        });

        passwordInput.addEventListener('input', () => {
            if (passwordErrorEl.style.display === 'block') {
                const error = Utils.validate.password(passwordInput.value);
                if (!error) {
                    passwordErrorEl.style.display = 'none';
                    passwordInput.style.borderColor = '#e0e0e0';
                }
            }
        });

        /**
         * 表单提交处理
         */
        el.querySelector('#login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 防止重复提交
            if (LoginPage.isLoading) {
                return;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // 清空之前的所有错误提示
            usernameErrorEl.textContent = '';
            usernameErrorEl.style.display = 'none';
            passwordErrorEl.textContent = '';
            passwordErrorEl.style.display = 'none';
            formErrorEl.textContent = '';
            usernameInput.style.borderColor = '#e0e0e0';
            passwordInput.style.borderColor = '#e0e0e0';

            // 执行表单校验
            const usernameError = Utils.validate.username(username);
            const passwordError = Utils.validate.password(password);
            
            if (usernameError) {
                usernameErrorEl.textContent = usernameError;
                usernameErrorEl.style.display = 'block';
                usernameInput.style.borderColor = '#ff4757';
                usernameInput.focus();
                return;
            }
            
            if (passwordError) {
                passwordErrorEl.textContent = passwordError;
                passwordErrorEl.style.display = 'block';
                passwordInput.style.borderColor = '#ff4757';
                passwordInput.focus();
                return;
            }

            // 设置登录中状态
            LoginPage.isLoading = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            loginBtn.disabled = true;

            try {
                // 调用登录接口
                const response = await API.login(username, password, LoginPage.currentRole);
                
                if (response.code === 200 && response.data) {
                    // 登录成功 - 保存用户信息
                    const user = response.data;
                    Utils.auth.setUser({
                        id: user.id,
                        username: user.username,
                        name: user.name,
                        role: user.role,
                        token: user.token,
                        isBlacklisted: user.isBlacklisted || false
                    });
                    
                    // 显示成功提示
                    Utils.message.success('登录成功！正在跳转...');
                    
                    // 检查黑名单状态并提示
                    if (user.isBlacklisted) {
                        setTimeout(() => {
                            Utils.message.warning('您已被列入黑名单，暂无法预约座位');
                        }, 1000);
                    }
                    
                    // 根据角色跳转到对应首页
                    setTimeout(() => {
                        if (user.role === 'ADMIN') {
                            Router.navigate('admin-home');
                        } else {
                            Router.navigate('student-home');
                        }
                    }, 800);
                } else {
                    // 登录失败
                    formErrorEl.textContent = response.msg || '登录失败，请检查账号和密码';
                    LoginPage.isLoading = false;
                    btnText.style.display = 'inline';
                    btnLoading.style.display = 'none';
                    loginBtn.disabled = false;
                }
            } catch (err) {
                // 网络错误或其他异常
                console.error('登录异常:', err);
                let errorMsg = '登录失败，请稍后重试';
                
                // 优先使用err中的msg（统一格式）
                if (err.msg) {
                    errorMsg = err.msg;
                } else if (err.code === 401) {
                    errorMsg = '账号或密码错误';
                } else if (err.message) {
                    if (err.message.includes('401')) {
                        errorMsg = '账号或密码错误';
                    } else if (err.message.includes('Network') || err.message.includes('Failed to fetch')) {
                        errorMsg = '网络异常，请稍后重试';
                    } else {
                        errorMsg = err.message;
                    }
                } else {
                    errorMsg = '登录失败，请稍后重试';
                }
                
                formErrorEl.textContent = errorMsg;
                LoginPage.isLoading = false;
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                loginBtn.disabled = false;
            }
        });

        /**
         * 回车键提交
         */
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                el.querySelector('#login-form').dispatchEvent(new Event('submit'));
            }
        });
    }
};

// 注册到全局
window.LoginPage = LoginPage;