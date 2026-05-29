/**
 * 学生首页组件
 * 显示个人信息、快捷入口、使用提示
 */

const StudentHomePage = {
    // 黑名单信息
    blacklistInfo: null,
    
    /**
     * 渲染学生首页
     * @returns {HTMLElement}
     */
    render: async () => {
        const user = Utils.auth.getUser();
        
        // 加载黑名单信息
        try {
            const response = await API.checkBlacklistDetail();
            if (response.code === 200 && response.data) {
                StudentHomePage.blacklistInfo = response.data;
            }
        } catch (err) {
            console.error('加载黑名单信息失败:', err);
        }
        
        const isBlacklisted = StudentHomePage.blacklistInfo?.isBlacklisted || false;
        const violationCount = StudentHomePage.blacklistInfo?.violationCount || 0;
        const remainingDays = StudentHomePage.blacklistInfo?.remainingDays || 0;
        
        const template = `
            <div class="layout-container">
                <!-- 侧边栏 -->
                <div class="sidebar">
                    <div class="sidebar-header">学生控制台</div>
                    <ul class="sidebar-nav">
                        <li><a href="#/student-home" class="active">首页</a></li>
                        <li><a href="#/seat-browse">座位浏览</a></li>
                        <li><a href="#/seat-reserve">预约座位</a></li>
                        <li><a href="#/my-reservations">我的预约</a></li>
                        <li><a href="#/my-violations">违约记录</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <!-- 欢迎横幅 -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px; color: white;">
                        <h1 class="page-title" style="color: white; margin-bottom: 10px;">欢迎回来，${user?.name || '同学'}</h1>
                        <p style="opacity: 0.9;">今天也要好好学习哦！📖</p>
                    </div>
                    
                    <!-- 黑名单警告 -->
                    ${isBlacklisted ? `
                    <div class="warning-box warning-box-red" style="margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">⚠️</span>
                            <div>
                                <strong>您已被列入黑名单</strong>
                                <p style="margin: 5px 0 0; font-weight: normal;">剩余封禁天数：${remainingDays} 天（累计违约3次自动封禁7天）</p>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- 个人信息卡片 -->
                    <div class="card">
                        <div style="display: flex; align-items: center; gap: 20px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                                ${user?.name?.charAt(0) || '?'}${user?.name?.charAt(1) || ''}
                            </div>
                            <div style="flex: 1;">
                                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">${user?.name || '未知用户'}</h3>
                                <p style="color: #666; font-size: 14px;">学号：${user?.username || 'N/A'}</p>
                                <p style="color: #666; font-size: 14px;">角色：学生</p>
                                <p style="color: ${isBlacklisted ? '#ff4757' : '#48bb78'}; font-size: 14px; font-weight: 500;">
                                    预约权限：${isBlacklisted ? '已暂停（黑名单）' : '正常'}
                                </p>
                                <p style="color: #666; font-size: 14px;">累计违约次数：${violationCount} 次</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 快捷入口 -->
                    <div class="card">
                        <h3 class="card-title">快捷操作</h3>
                        <div class="quick-actions">
                            <div class="action-card" id="action-reserve">
                                <div class="action-icon">📅</div>
                                <div class="action-title">预约座位</div>
                            </div>
                            <div class="action-card" id="action-reservations">
                                <div class="action-icon">📋</div>
                                <div class="action-title">我的预约</div>
                            </div>
                            <div class="action-card" id="action-violations">
                                <div class="action-icon">⚠️</div>
                                <div class="action-title">我的违约</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 使用提示 -->
                    <div class="card">
                        <h3 class="card-title">📌 使用提示</h3>
                        <ul style="padding-left: 20px; line-height: 2;">
                            <li>请提前预约座位，预约成功后请按时签到</li>
                            <li>签到时间为预约时段开始前30分钟至开始后15分钟</li>
                            <li>未按时签到将视为违约，累计3次违约将暂停预约权限一周</li>
                            <li>离开座位时请签退，方便其他同学使用</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        StudentHomePage.bindEvents(el);
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
        el.querySelector('#action-reserve').addEventListener('click', () => {
            Router.navigate('seat-reserve');
        });

        el.querySelector('#action-reservations').addEventListener('click', () => {
            Router.navigate('my-reservations');
        });

        el.querySelector('#action-violations').addEventListener('click', () => {
            Router.navigate('my-violations');
        });
    }
};

// 注册到全局
window.StudentHomePage = StudentHomePage;
