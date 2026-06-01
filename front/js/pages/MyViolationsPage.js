/**
 * 个人违约记录页面组件
 * 显示违约次数、违约时间、黑名单状态、封禁提示
 */

const MyViolationsPage = {
    // 用户黑名单信息
    blacklistInfo: null,
    
    /**
     * 渲染违约记录页面
     * @returns {HTMLElement}
     */
    render: async () => {
        const template = `
            <div class="layout-container">
                <!-- 侧边栏 -->
                <div class="sidebar">
                    <div class="sidebar-header">学生控制台</div>
                    <ul class="sidebar-nav">
                        <li><a href="#/student-home">首页</a></li>
                        <li><a href="#/seat-browse">座位浏览</a></li>
                        <li><a href="#/seat-reserve">预约座位</a></li>
                        <li><a href="#/my-reservations">我的预约</a></li>
                        <li><a href="#/my-violations" class="active">违约记录</a></li>
                    </ul>
                    <button class="logout-btn" id="logout-btn">退出登录</button>
                </div>
                
                <!-- 主内容 -->
                <div class="main-content">
                    <h1 class="page-title">违约记录</h1>
                    
                    <!-- 黑名单警告 -->
                    <div id="blacklist-banner" class="warning-box warning-box-red" style="display: none;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">⚠️</span>
                            <div>
                                <strong>您已被列入黑名单</strong>
                                <p id="blacklist-days" style="margin: 5px 0 0; font-weight: normal;"></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 违约统计 -->
                    <div class="stats-row">
                        <div class="stat-card">
                            <div class="stat-number" id="stat-total">0</div>
                            <div class="stat-label">累计违约次数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="stat-recent">0</div>
                            <div class="stat-label">近30天违约</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="stat-status">正常</div>
                            <div class="stat-label">预约权限</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="stat-blacklist">否</div>
                            <div class="stat-label">是否黑名单</div>
                        </div>
                    </div>
                    
                    <!-- 违约规则提示 -->
                    <div class="card">
                        <h3 class="card-title">📌 违约规则说明</h3>
                        <ul style="padding-left: 20px; line-height: 2;">
                            <li>未按时签到：预约时段开始后15分钟内未签到视为违约</li>
                            <li>未按时签退：预约时段结束后未签退视为违约</li>
                            <li>累计3次违约将被列入黑名单，暂停预约权限7天</li>
                            <li>黑名单期满后自动解除限制</li>
                        </ul>
                    </div>
                    
                    <!-- 违约列表 -->
                    <div class="card">
                        <h3 class="card-title">违约记录列表</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>座位号</th>
                                    <th>区域</th>
                                    <th>预约日期</th>
                                    <th>时段</th>
                                    <th>违约类型</th>
                                    <th>违约时间</th>
                                    <th>备注</th>
                                </tr>
                            </thead>
                            <tbody id="violations-body">
                                <tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const el = Utils.dom.render(template);
        MyViolationsPage.bindEvents(el);
        await MyViolationsPage.loadViolations(el);
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
    },

    /**
     * 加载违约记录
     * @param {HTMLElement} el 容器元素
     */
    loadViolations: async (el) => {
        const tbody = el.querySelector('#violations-body');
        
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">加载中...</td></tr>';

        try {
            // 并行加载违约记录和黑名单信息
            const [violationsResponse, blacklistResponse] = await Promise.all([
                API.getViolations(),
                API.checkBlacklistDetail()
            ]);
            
            // 处理黑名单信息
            if (blacklistResponse.code === 200 && blacklistResponse.data) {
                MyViolationsPage.blacklistInfo = blacklistResponse.data;
                MyViolationsPage.updateBlacklistBanner(el);
            }
            
            // 处理违约记录
            if (violationsResponse.code === 200 && violationsResponse.data) {
                const violations = violationsResponse.data;

                // 更新统计数据
                MyViolationsPage.updateStats(el, violations);

                if (violations.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">暂无违约记录</td></tr>';
                    return;
                }

                tbody.innerHTML = '';

                violations.forEach(violation => {
                    const violationType = MyViolationsPage.getViolationTypeText(violation.type);
                    const violationTime = violation.createdAt 
                        ? new Date(violation.createdAt).toLocaleString('zh-CN') 
                        : '-';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${violation.seatNumber || '-'}</strong></td>
                        <td>${violation.zone || '-'}</td>
                        <td>${violation.date || '-'}</td>
                        <td>${violation.timeSlotDisplay || violation.timeSlot || '-'}</td>
                        <td><span class="status-badge status-danger">${violationType}</span></td>
                        <td>${violationTime}</td>
                        <td>${violation.note || '-'}</td>
                    `;

                    tbody.appendChild(row);
                });
            } else {
                MyViolationsPage.updateStats(el, []);
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">暂无违约记录</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #ff4757;">${err.msg || '加载失败'}</td></tr>`;
        }
    },

    /**
     * 更新黑名单横幅
     */
    updateBlacklistBanner: (el) => {
        const banner = el.querySelector('#blacklist-banner');
        const daysEl = el.querySelector('#blacklist-days');
        const statBlacklist = el.querySelector('#stat-blacklist');
        const statStatus = el.querySelector('#stat-status');
        
        if (MyViolationsPage.blacklistInfo && MyViolationsPage.blacklistInfo.isBlacklisted) {
            banner.style.display = 'block';
            
            // 计算剩余封禁天数
            const remainingDays = MyViolationsPage.calculateRemainingDays();
            daysEl.textContent = `剩余封禁天数：${remainingDays} 天（累计违约3次自动封禁7天）`;
            
            if (statBlacklist) statBlacklist.textContent = '是';
            if (statStatus) {
                statStatus.textContent = '已暂停';
                statStatus.style.color = '#ff4757';
            }
        } else {
            banner.style.display = 'none';
            if (statBlacklist) statBlacklist.textContent = '否';
            if (statStatus) {
                statStatus.textContent = '正常';
                statStatus.style.color = '#48bb78';
            }
        }
    },

    /**
     * 计算剩余封禁天数
     */
    calculateRemainingDays: () => {
        if (!MyViolationsPage.blacklistInfo || !MyViolationsPage.blacklistInfo.blacklistedUntil) {
            return 7;
        }
        
        const blacklistedUntil = new Date(MyViolationsPage.blacklistInfo.blacklistedUntil);
        const now = new Date();
        const diff = blacklistedUntil.getTime() - now.getTime();
        
        if (diff <= 0) {
            return 0;
        }
        
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },

    /**
     * 更新统计数据
     * @param {HTMLElement} el 容器元素
     * @param {array} violations 违约列表
     */
    updateStats: (el, violations) => {
        const statTotal = el.querySelector('#stat-total');
        const statRecent = el.querySelector('#stat-recent');
        const statStatus = el.querySelector('#stat-status');
        const statBlacklist = el.querySelector('#stat-blacklist');
        
        const totalCount = violations.length;
        
        // 计算近30天违约次数
        const recentCount = violations.filter(v => {
            const violationDate = new Date(v.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return violationDate > thirtyDaysAgo;
        }).length;
        
        const isBlacklisted = MyViolationsPage.blacklistInfo?.isBlacklisted || false;
        const hasWarning = totalCount >= 2 && !isBlacklisted;
        
        if (statTotal) statTotal.textContent = totalCount;
        if (statRecent) statRecent.textContent = recentCount;
        
        if (statStatus) {
            if (isBlacklisted) {
                statStatus.textContent = '已暂停';
                statStatus.style.color = '#ff4757';
            } else if (hasWarning) {
                statStatus.textContent = '警告';
                statStatus.style.color = '#f6ad55';
            } else {
                statStatus.textContent = '正常';
                statStatus.style.color = '#48bb78';
            }
        }
        
        if (statBlacklist) {
            statBlacklist.textContent = isBlacklisted ? '是' : '否';
            statBlacklist.style.color = isBlacklisted ? '#ff4757' : '#48bb78';
        }
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
            'OTHER': '其他'
        };
        return typeMap[type] || type;
    }
};

// 注册到全局
window.MyViolationsPage = MyViolationsPage;