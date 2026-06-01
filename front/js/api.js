/**
 * API封装模块
 * 统一处理后端接口请求，包含登录、预约、管理等功能
 * 支持模拟数据模式（无后端时使用）
 */

// 后端API基础地址
const BASE_URL = 'http://localhost:8080/library/api';

// 是否使用模拟数据（无后端时启用）
const USE_MOCK_DATA = true;

/**
 * 获取请求头（包含token）
 * @returns {object} 请求头配置
 */
function getHeaders() {
    const user = Utils.storage.get('user', null);
    const headers = {
        'Content-Type': 'application/json',
    };
    if (user && user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
    }
    return headers;
}

/**
 * 处理API响应
 * @param {Response} response 响应对象
 * @returns {Promise}
 */
async function handleResponse(response) {
    const data = await response.json();
    
    // 401未授权，清除用户信息并重定向到登录页
    if (response.status === 401) {
        Utils.auth.clearUser();
        window.location.href = '#/login';
        throw new Error('登录已失效，请重新登录');
    }
    
    // 403禁止访问
    if (response.status === 403) {
        throw new Error('您没有权限执行此操作');
    }
    
    // 其他错误状态
    if (!response.ok) {
        throw new Error(data.message || '操作失败');
    }
    
    return data;
}

// ========== 模拟数据 ==========
const MockData = {
    // 模拟用户数据
    users: {
        'student': {
            id: 1,
            username: 'student',
            name: '张三',
            role: 'STUDENT',
            token: 'student-token-12345',
            isBlacklisted: false,
            violationCount: 0
        },
        'admin': {
            id: 2,
            username: 'admin',
            name: '管理员',
            role: 'ADMIN',
            token: 'admin-token-12345',
            isBlacklisted: false,
            violationCount: 0
        }
    },
    
    // 模拟区域数据
    areas: [
        { id: 1, name: 'A区', description: '一楼东区' },
        { id: 2, name: 'B区', description: '一楼西区' },
        { id: 3, name: 'C区', description: '二楼自习区' }
    ],
    
    // 模拟座位数据
    seats: [
        // A区座位
        { id: 1, areaId: 1, areaName: 'A区', row: 'A', column: 1, seatNumber: 'A1', status: 'FREE' },
        { id: 2, areaId: 1, areaName: 'A区', row: 'A', column: 2, seatNumber: 'A2', status: 'FREE' },
        { id: 3, areaId: 1, areaName: 'A区', row: 'A', column: 3, seatNumber: 'A3', status: 'RESERVED' },
        { id: 4, areaId: 1, areaName: 'A区', row: 'B', column: 1, seatNumber: 'B1', status: 'OCCUPIED' },
        { id: 5, areaId: 1, areaName: 'A区', row: 'B', column: 2, seatNumber: 'B2', status: 'FREE' },
        { id: 6, areaId: 1, areaName: 'A区', row: 'B', column: 3, seatNumber: 'B3', status: 'FREE' },
        // B区座位
        { id: 7, areaId: 2, areaName: 'B区', row: 'A', column: 1, seatNumber: 'A1', status: 'FREE' },
        { id: 8, areaId: 2, areaName: 'B区', row: 'A', column: 2, seatNumber: 'A2', status: 'RESERVED' },
        { id: 9, areaId: 2, areaName: 'B区', row: 'A', column: 3, seatNumber: 'A3', status: 'FREE' },
        { id: 10, areaId: 2, areaName: 'B区', row: 'B', column: 1, seatNumber: 'B1', status: 'FREE' },
        { id: 11, areaId: 2, areaName: 'B区', row: 'B', column: 2, seatNumber: 'B2', status: 'OCCUPIED' },
        { id: 12, areaId: 2, areaName: 'B区', row: 'B', column: 3, seatNumber: 'B3', status: 'FREE' },
        // C区座位
        { id: 13, areaId: 3, areaName: 'C区', row: 'A', column: 1, seatNumber: 'A1', status: 'FREE' },
        { id: 14, areaId: 3, areaName: 'C区', row: 'A', column: 2, seatNumber: 'A2', status: 'FREE' },
        { id: 15, areaId: 3, areaName: 'C区', row: 'A', column: 3, seatNumber: 'A3', status: 'RESERVED' },
        { id: 16, areaId: 3, areaName: 'C区', row: 'B', column: 1, seatNumber: 'B1', status: 'FREE' },
        { id: 17, areaId: 3, areaName: 'C区', row: 'B', column: 2, seatNumber: 'B2', status: 'FREE' },
        { id: 18, areaId: 3, areaName: 'C区', row: 'B', column: 3, seatNumber: 'B3', status: 'OCCUPIED' }
    ],
    
    // 模拟时段数据（只保留三个时间段）
    timeSlots: [
        { id: 1, slot: 1, startTime: '08:00', endTime: '12:00', display: '08:00 - 12:00' },
        { id: 2, slot: 2, startTime: '12:00', endTime: '16:00', display: '12:00 - 16:00' },
        { id: 3, slot: 3, startTime: '16:00', endTime: '20:00', display: '16:00 - 20:00' }
    ],
    
    // 模拟预约数据
    reservations: [
        {
            id: 1,
            studentId: 1,
            studentName: '张三',
            seatId: 3,
            seatRow: 'A',
            seatColumn: 3,
            areaName: 'A区',
            date: new Date().toISOString().split('T')[0],
            timeSlot: '08:00 - 10:00',
            timeSlotId: 1,
            status: 'RESERVED',
            createTime: new Date().toISOString()
        },
        {
            id: 2,
            studentId: 1,
            studentName: '张三',
            seatId: 8,
            seatRow: 'A',
            seatColumn: 2,
            areaName: 'B区',
            date: new Date().toISOString().split('T')[0],
            timeSlot: '14:00 - 16:00',
            timeSlotId: 3,
            status: 'CHECKED_IN',
            createTime: new Date().toISOString(),
            checkInTime: new Date().toISOString()
        },
        {
            id: 3,
            studentId: 1,
            studentName: '张三',
            seatId: 15,
            seatRow: 'A',
            seatColumn: 3,
            areaName: 'C区',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            timeSlot: '10:00 - 12:00',
            timeSlotId: 2,
            status: 'RESERVED',
            createTime: new Date().toISOString()
        }
    ],
    
    // 模拟违约记录
    violations: [
        {
            id: 1,
            studentId: 1,
            studentName: '李四',
            studentUsername: 'lisi',
            violationType: 'NO_SHOW',
            violationTime: new Date(Date.now() - 86400000 * 2).toISOString(),
            description: '预约后未签到'
        },
        {
            id: 2,
            studentId: 1,
            studentName: '王五',
            studentUsername: 'wangwu',
            violationType: 'LATE_CHECKIN',
            violationTime: new Date(Date.now() - 86400000).toISOString(),
            description: '签到超时'
        }
    ],
    
    // 模拟所有用户列表
    allUsers: [
        { id: 1, username: 'student', name: '张三', role: 'STUDENT', enabled: true, isBlacklisted: false, blacklisted: false, violationCount: 0, banEndDate: null },
        { id: 2, username: 'admin', name: '管理员', role: 'ADMIN', enabled: true, isBlacklisted: false, blacklisted: false, violationCount: 0, banEndDate: null },
        { id: 3, username: 'lisi', name: '李四', role: 'STUDENT', enabled: true, isBlacklisted: true, blacklisted: true, violationCount: 3, banEndDate: new Date(Date.now() + 86400000 * 5).toISOString() },
        { id: 4, username: 'wangwu', name: '王五', role: 'STUDENT', enabled: true, isBlacklisted: false, blacklisted: false, violationCount: 1, banEndDate: null },
        { id: 5, username: 'zhaoliu', name: '赵六', role: 'STUDENT', enabled: true, isBlacklisted: false, blacklisted: false, violationCount: 0, banEndDate: null }
    ]
};

const API = {
    // ========== 认证相关 ==========
    
    /**
     * 用户登录
     * @param {string} username 用户名
     * @param {string} password 密码
     * @param {string} role 角色（STUDENT/ADMIN）
     * @returns {Promise}
     */
    login: async (username, password, role) => {
        if (USE_MOCK_DATA) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const user = MockData.users[username];
                    if (user && password === (username === 'student' ? '123456' : 'admin123') && user.role === role) {
                        resolve({ code: 200, msg: '登录成功', data: user });
                    } else {
                        reject({ code: 401, msg: '账号或密码错误', data: null });
                    }
                }, 500);
            });
        }

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ username, password, role })
            });
            const data = await response.json();
            if (response.ok && data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '登录失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 检查用户是否在黑名单
     * @returns {Promise}
     */
    checkBlacklist: async () => {
        if (USE_MOCK_DATA) {
            const user = Utils.auth.getUser();
            if (!user) {
                return Promise.resolve({ code: 200, msg: '查询成功', data: false });
            }
            const userInfo = MockData.allUsers.find(u => u.username === user.username);
            return Promise.resolve({ code: 200, msg: '查询成功', data: userInfo?.isBlacklisted || false });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/blacklist/check`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 获取用户预约列表（旧版方法名）
     * @returns {Promise}
     */
    getUserReservations: async () => {
        if (USE_MOCK_DATA) {
            const user = Utils.auth.getUser();
            if (!user) {
                return Promise.resolve({ code: 200, msg: '查询成功', data: [] });
            }
            const reservations = MockData.reservations.filter(
                r => r.studentId === user.id
            );
            return Promise.resolve({ code: 200, msg: '查询成功', data: reservations });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/reserve/list`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 检查黑名单详情
     * @returns {Promise}
     */
    checkBlacklistDetail: async () => {
        if (USE_MOCK_DATA) {
            const user = Utils.auth.getUser();
            if (!user) {
                return Promise.resolve({
                    code: 200,
                    msg: '查询成功',
                    data: {
                        isBlacklisted: false,
                        violationCount: 0,
                        remainingDays: 0
                    }
                });
            }
            const userInfo = MockData.allUsers.find(u => u.username === user.username);
            return Promise.resolve({
                code: 200,
                msg: '查询成功',
                data: {
                    isBlacklisted: userInfo?.isBlacklisted || false,
                    violationCount: userInfo?.violationCount || 0,
                    remainingDays: userInfo?.isBlacklisted ? 7 : 0
                }
            });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/blacklist/detail`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 获取用户信息
     * @returns {Promise}
     */
    getUserInfo: async () => {
        if (USE_MOCK_DATA) {
            const user = Utils.auth.getUser();
            return Promise.resolve({ code: 200, msg: '查询成功', data: user || {} });
        }
        try {
            const response = await fetch(`${BASE_URL}/auth/info`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    // ========== 座位相关 ==========

    /**
     * 获取区域列表（学生端）
     * @returns {Promise}
     */
    getAreas: async () => {
        if (USE_MOCK_DATA) {
            return Promise.resolve({ code: 200, msg: '查询成功', data: MockData.areas });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/area/list`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 获取可用座位（按日期和时段筛选）
     * @param {object} params 参数
     * @param {string} params.date 日期
     * @param {number} params.timeSlot 时段ID
     * @returns {Promise}
     */
    getAvailableSeats: async (params) => {
        if (USE_MOCK_DATA) {
            const { date, timeSlot } = params;
            const reservedSeatIds = MockData.reservations
                .filter(r => r.date === date && r.timeSlotId === timeSlot)
                .map(r => r.seatId);
            
            const availableSeats = MockData.seats.filter(
                s => s.status === 'FREE' && !reservedSeatIds.includes(s.id)
            );
            
            return Promise.resolve({ code: 200, msg: '查询成功', data: availableSeats });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/reserve/available`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(params)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 获取座位列表（学生端）
     * @param {string} zone 区域（A/B/C，可选）
     * @returns {Promise}
     */
    getSeats: async (zone = '') => {
        if (USE_MOCK_DATA) {
            console.log('getSeats called with zone:', zone);
            let seats = [...MockData.seats];
            console.log('Original seats count:', seats.length);
            if (zone) {
                seats = seats.filter(s => s.areaName === zone + '区');
                console.log('Filtered seats count:', seats.length);
            }
            const result = { code: 200, msg: '查询成功', data: seats };
            console.log('getSeats returning:', result);
            return Promise.resolve(result);
        }
        try {
            const url = zone ? `${BASE_URL}/student/seat/list?zone=${zone}` : `${BASE_URL}/student/seat/list`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 获取座位详情
     * @param {number} seatId 座位ID
     * @returns {Promise}
     */
    getSeatById: async (seatId) => {
        if (USE_MOCK_DATA) {
            const seat = MockData.seats.find(s => s.id === seatId);
            return Promise.resolve({ code: 200, msg: '查询成功', data: seat || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/seat/list/${seatId}`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 创建座位（管理员）
     * @param {object} seat 座位信息
     * @returns {Promise}
     */
    createSeat: async (seat) => {
        if (USE_MOCK_DATA) {
            const newSeat = {
                id: MockData.seats.length + 1,
                ...seat,
                status: 'FREE'
            };
            MockData.seats.push(newSeat);
            return Promise.resolve({ code: 200, msg: '创建成功', data: newSeat });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/seat/add`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(seat)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '创建失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 更新座位信息（管理员）
     * @param {number} seatId 座位ID
     * @param {object} seat 座位信息
     * @returns {Promise}
     */
    updateSeat: async (seatId, seat) => {
        if (USE_MOCK_DATA) {
            const index = MockData.seats.findIndex(s => s.id === seatId);
            if (index !== -1) {
                MockData.seats[index] = { ...MockData.seats[index], ...seat };
            }
            return Promise.resolve({ code: 200, msg: '更新成功', data: MockData.seats[index] || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/seat/update/${seatId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(seat)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '更新失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 删除座位（管理员）
     * @param {number} seatId 座位ID
     * @returns {Promise}
     */
    deleteSeat: async (seatId) => {
        if (USE_MOCK_DATA) {
            MockData.seats = MockData.seats.filter(s => s.id !== seatId);
            return Promise.resolve({ code: 200, msg: '删除成功', data: null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/seat/delete/${seatId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '删除失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 更新座位状态（管理员）
     * @param {number} seatId 座位ID
     * @param {string} status 状态
     * @returns {Promise}
     */
    updateSeatStatus: async (seatId, status) => {
        if (USE_MOCK_DATA) {
            const seat = MockData.seats.find(s => s.id === seatId);
            if (seat) {
                seat.status = status;
            }
            return Promise.resolve({ code: 200, msg: '更新成功', data: seat || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/seat/status/${seatId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status })
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '更新失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 批量更新座位状态（管理员）
     * @param {object} params 参数
     * @returns {Promise}
     */
    batchUpdateSeatStatus: async (params) => {
        if (USE_MOCK_DATA) {
            const { seatIds, status } = params;
            seatIds.forEach(seatId => {
                const seat = MockData.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.status = status;
                }
            });
            return Promise.resolve({ code: 200, msg: '批量更新成功', data: null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/seat/batch/status`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(params)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '批量更新失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 批量删除座位（管理员）
     * @param {number[]} seatIds 座位ID列表
     * @returns {Promise}
     */
    batchDeleteSeats: async (seatIds) => {
        if (USE_MOCK_DATA) {
            MockData.seats = MockData.seats.filter(s => !seatIds.includes(s.id));
            return Promise.resolve({ code: 200, msg: '批量删除成功', data: null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/seat/batch/delete`, {
                method: 'DELETE',
                headers: getHeaders(),
                body: JSON.stringify({ seatIds })
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '批量删除失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    // ========== 预约相关 ==========

    /**
     * 创建预约（学生端）
     * @param {object} reservation 预约信息
     * @returns {Promise}
     */
    createReservation: async (reservation) => {
        if (USE_MOCK_DATA) {
            const user = Utils.auth.getUser();
            if (!user) {
                throw { code: 401, msg: '请先登录', data: null };
            }
            const seat = MockData.seats.find(s => s.id === reservation.seatId);
            const timeSlot = MockData.timeSlots.find(t => t.id === reservation.timeSlotId);
            
            // 检查是否已在同一时段预约
            const existingReservation = MockData.reservations.find(
                r => r.studentId === user.id && 
                     r.date === reservation.date && 
                     r.timeSlotId === reservation.timeSlotId
            );
            if (existingReservation) {
                throw { code: 400, msg: '您已在当前时段预约了座位', data: null };
            }
            
            // 检查座位是否已被预约
            const seatReserved = MockData.reservations.find(
                r => r.seatId === reservation.seatId && 
                     r.date === reservation.date && 
                     r.timeSlotId === reservation.timeSlotId &&
                     r.status !== 'CANCELLED'
            );
            if (seatReserved) {
                throw { code: 400, msg: '该座位当前时间段已被预约，无法选择', data: null };
            }
            
            const newReservation = {
                id: MockData.reservations.length + 1,
                studentId: user.id,
                studentName: user.name,
                seatId: reservation.seatId,
                seatRow: seat?.row || '',
                seatColumn: seat?.column || '',
                areaName: seat?.areaName || '',
                date: reservation.date,
                timeSlot: timeSlot?.display || reservation.timeSlot,
                timeSlotId: reservation.timeSlotId,
                status: 'RESERVED',
                createTime: new Date().toISOString()
            };
            MockData.reservations.push(newReservation);
            
            // 更新座位状态
            if (seat) {
                seat.status = 'RESERVED';
            }
            
            return Promise.resolve({ code: 200, msg: '预约成功', data: newReservation });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/reserve/add`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(reservation)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '预约失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 获取当前用户预约列表（学生端）
     * @returns {Promise}
     */
    getMyReservations: async () => {
        if (USE_MOCK_DATA) {
            const user = Utils.auth.getUser();
            if (!user) {
                return Promise.resolve({ code: 200, msg: '查询成功', data: [] });
            }
            const userReservations = MockData.reservations.filter(
                r => r.studentId === user.id
            );
            return Promise.resolve({ code: 200, msg: '查询成功', data: userReservations });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/reserve/list`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 获取所有预约（管理员）
     * @param {object} params 查询参数
     * @returns {Promise}
     */
    getAllReservations: async (params = {}) => {
        if (USE_MOCK_DATA) {
            let reservations = [...MockData.reservations];
            if (params.date) {
                reservations = reservations.filter(r => r.date === params.date);
            }
            if (params.status) {
                reservations = reservations.filter(r => r.status === params.status);
            }
            return Promise.resolve(reservations);
        }
        const url = new URL(`${BASE_URL}/admin/reserve/list`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    /**
     * 取消预约（学生端）
     * @param {number} reservationId 预约ID
     * @returns {Promise}
     */
    cancelReservation: async (reservationId) => {
        if (USE_MOCK_DATA) {
            const reservation = MockData.reservations.find(r => r.id === reservationId);
            if (reservation) {
                reservation.status = 'CANCELLED';
                const seat = MockData.seats.find(s => s.id === reservation.seatId);
                if (seat) {
                    seat.status = 'AVAILABLE';
                }
            }
            return Promise.resolve({ code: 200, msg: '取消成功', data: reservation || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/reserve/cancel/${reservationId}`, {
                method: 'PUT',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '取消失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 自动分配座位
     * @param {object} params 参数（date, timeSlot）
     * @returns {Promise}
     */
    autoAssignSeat: async (params) => {
        if (USE_MOCK_DATA) {
            const user = Utils.auth.getUser();
            if (!user) {
                throw { code: 401, msg: '请先登录', data: null };
            }
            
            // 检查是否已在同一时段预约
            const existingReservation = MockData.reservations.find(
                r => r.studentId === user.id && 
                     r.date === params.date && 
                     r.timeSlotId === params.timeSlotId
            );
            if (existingReservation) {
                throw { code: 400, msg: '您已预约当前时间段其他座位，请勿重复预约', data: null };
            }
            
            // 查找可用座位
            const availableSeats = MockData.seats.filter(s => s.status === 'AVAILABLE');
            if (availableSeats.length === 0) {
                throw { code: 400, msg: '当前时段没有可用座位', data: null };
            }
            
            const seat = availableSeats[0];
            const timeSlot = MockData.timeSlots.find(t => t.id === params.timeSlotId);
            
            const newReservation = {
                id: MockData.reservations.length + 1,
                studentId: user.id,
                studentName: user.name,
                seatId: seat.id,
                seatRow: seat.row,
                seatColumn: seat.column,
                areaName: seat.areaName,
                date: params.date,
                timeSlot: timeSlot?.display || '',
                timeSlotId: params.timeSlotId,
                status: 'RESERVED',
                createTime: new Date().toISOString()
            };
            MockData.reservations.push(newReservation);
            seat.status = 'RESERVED';
            
            return Promise.resolve(newReservation);
        }
        const response = await fetch(`${BASE_URL}/student/reserve/add/auto`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(params)
        });
        return handleResponse(response);
    },

    /**
     * 根据学号查询预约（管理员）
     * @param {string} studentId 学号
     * @returns {Promise}
     */
    searchReservationByStudentId: async (studentId) => {
        if (USE_MOCK_DATA) {
            const reservations = MockData.reservations.filter(
                r => r.studentId == studentId && 
                     (r.status === 'RESERVED' || r.status === 'CHECKED_IN')
            );
            // 找到第一个可操作的预约
            const currentReservation = reservations.find(r => 
                r.status === 'RESERVED' || r.status === 'CHECKED_IN'
            );
            return Promise.resolve({ code: 200, msg: '查询成功', data: currentReservation || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/reserve/search?studentId=${studentId}`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    // ========== 签到签退（管理员） ==========

    /**
     * 学生签到
     * @param {number} reservationId 预约ID
     * @returns {Promise}
     */
    checkIn: async (reservationId) => {
        if (USE_MOCK_DATA) {
            const reservation = MockData.reservations.find(r => r.id === reservationId);
            if (reservation && reservation.status === 'RESERVED') {
                reservation.status = 'CHECKED_IN';
                reservation.checkInTime = new Date().toISOString();
                const seat = MockData.seats.find(s => s.id === reservation.seatId);
                if (seat) {
                    seat.status = 'OCCUPIED';
                }
            }
            return Promise.resolve({ code: 200, msg: '签到成功', data: reservation || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/check/in/${reservationId}`, {
                method: 'PUT',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '签到失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 学生签退
     * @param {number} reservationId 预约ID
     * @returns {Promise}
     */
    checkOut: async (reservationId) => {
        if (USE_MOCK_DATA) {
            const reservation = MockData.reservations.find(r => r.id === reservationId);
            if (reservation && reservation.status === 'CHECKED_IN') {
                reservation.status = 'COMPLETED';
                reservation.checkOutTime = new Date().toISOString();
                const seat = MockData.seats.find(s => s.id === reservation.seatId);
                if (seat) {
                    seat.status = 'AVAILABLE';
                }
            }
            return Promise.resolve({ code: 200, msg: '签退成功', data: reservation || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/check/out/${reservationId}`, {
                method: 'PUT',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '签退失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    // ========== 用户管理 ==========

    /**
     * 获取用户列表（管理员）
     * @param {object} params 查询参数
     * @returns {Promise}
     */
    getUsers: async (params = {}) => {
        if (USE_MOCK_DATA) {
            let users = [...MockData.allUsers];
            if (params.role) {
                users = users.filter(u => u.role === params.role);
            }
            if (params.isBlacklisted !== undefined) {
                users = users.filter(u => u.isBlacklisted === (params.isBlacklisted === 'true'));
            }
            if (params.keyword) {
                const keyword = params.keyword.toLowerCase();
                users = users.filter(u => 
                    u.username.toLowerCase().includes(keyword) || 
                    u.name.toLowerCase().includes(keyword)
                );
            }
            return Promise.resolve({ code: 200, msg: '查询成功', data: users });
        }
        try {
            const url = new URL(`${BASE_URL}/admin/user/list`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 创建用户（管理员）
     * @param {object} user 用户信息
     * @returns {Promise}
     */
    createUser: async (user) => {
        if (USE_MOCK_DATA) {
            const newUser = {
                id: MockData.allUsers.length + 1,
                ...user,
                isBlacklisted: false,
                violationCount: 0
            };
            MockData.allUsers.push(newUser);
            return Promise.resolve({ code: 200, msg: '创建成功', data: newUser });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/user/add`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(user)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '创建失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 更新用户信息（管理员）
     * @param {number} userId 用户ID
     * @param {object} user 用户信息
     * @returns {Promise}
     */
    updateUser: async (userId, user) => {
        if (USE_MOCK_DATA) {
            const index = MockData.allUsers.findIndex(u => u.id === userId);
            if (index !== -1) {
                MockData.allUsers[index] = { ...MockData.allUsers[index], ...user };
            }
            return Promise.resolve({ code: 200, msg: '更新成功', data: MockData.allUsers[index] || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/user/update/${userId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(user)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '更新失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 删除用户（管理员）
     * @param {number} userId 用户ID
     * @returns {Promise}
     */
    deleteUser: async (userId) => {
        if (USE_MOCK_DATA) {
            MockData.allUsers = MockData.allUsers.filter(u => u.id !== userId);
            return Promise.resolve({ code: 200, msg: '删除成功', data: null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/user/delete/${userId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '删除失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 获取用户违约记录（学生端）
     * @returns {Promise}
     */
    getViolations: async () => {
        if (USE_MOCK_DATA) {
            const user = Utils.auth.getUser();
            if (!user) {
                return Promise.resolve({ code: 200, msg: '查询成功', data: [] });
            }
            const userViolations = MockData.violations.filter(
                v => v.studentId === user.id
            );
            return Promise.resolve({ code: 200, msg: '查询成功', data: userViolations });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/violate/list`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 获取所有违约记录（管理员）
     * @param {object} params 查询参数
     * @returns {Promise}
     */
    getAllViolations: async (params = {}) => {
        if (USE_MOCK_DATA) {
            let violations = [...MockData.violations];
            if (params.studentId) {
                violations = violations.filter(v => v.studentId == params.studentId);
            }
            return Promise.resolve({ code: 200, msg: '查询成功', data: violations });
        }
        try {
            const url = new URL(`${BASE_URL}/admin/violate/list`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 添加违约记录（管理员）
     * @param {number} userId 用户ID
     * @param {object} violation 违约信息
     * @returns {Promise}
     */
    addViolation: async (userId, violation) => {
        if (USE_MOCK_DATA) {
            const user = MockData.allUsers.find(u => u.id === userId);
            if (user) {
                user.violationCount = (user.violationCount || 0) + 1;
                if (user.violationCount >= 3) {
                    user.isBlacklisted = true;
                }
            }
            const newViolation = {
                id: MockData.violations.length + 1,
                studentId: userId,
                studentName: user?.name || '未知用户',
                studentUsername: user?.username || '',
                violationType: violation.violationType || 'OTHER',
                violationTime: new Date().toISOString(),
                description: violation.description || '违约'
            };
            MockData.violations.push(newViolation);
            return Promise.resolve({ code: 200, msg: '添加违约记录成功', data: newViolation });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/violate/add/${userId}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(violation)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '添加违约失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 解除用户黑名单（管理员）
     * @param {number} userId 用户ID
     * @returns {Promise}
     */
    removeFromBlacklist: async (userId) => {
        if (USE_MOCK_DATA) {
            const user = MockData.allUsers.find(u => u.id === userId);
            if (user) {
                user.isBlacklisted = false;
                user.violationCount = 0;
            }
            return Promise.resolve({ code: 200, msg: '解除黑名单成功', data: user || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/black/remove/${userId}`, {
                method: 'PUT',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '解除黑名单失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    // ========== 时段管理 ==========

    /**
     * 获取时段列表（学生端）
     * @returns {Promise}
     */
    getTimeSlots: async () => {
        if (USE_MOCK_DATA) {
            return Promise.resolve({ code: 200, msg: '查询成功', data: MockData.timeSlots });
        }
        try {
            const response = await fetch(`${BASE_URL}/student/timeslot/list`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 创建时段（管理员）
     * @param {object} timeSlot 时段信息
     * @returns {Promise}
     */
    createTimeSlot: async (timeSlot) => {
        if (USE_MOCK_DATA) {
            const newSlot = {
                id: MockData.timeSlots.length + 1,
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                display: `${timeSlot.startTime} - ${timeSlot.endTime}`
            };
            MockData.timeSlots.push(newSlot);
            return Promise.resolve({ code: 200, msg: '创建成功', data: newSlot });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/timeslot/add`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(timeSlot)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '创建失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 更新时段（管理员）
     * @param {number} slotId 时段ID
     * @param {object} timeSlot 时段信息
     * @returns {Promise}
     */
    updateTimeSlot: async (slotId, timeSlot) => {
        if (USE_MOCK_DATA) {
            const index = MockData.timeSlots.findIndex(t => t.id === slotId);
            if (index !== -1) {
                MockData.timeSlots[index] = {
                    ...MockData.timeSlots[index],
                    ...timeSlot,
                    display: `${timeSlot.startTime} - ${timeSlot.endTime}`
                };
            }
            return Promise.resolve({ code: 200, msg: '更新成功', data: MockData.timeSlots[index] || null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/timeslot/update/${slotId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(timeSlot)
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '更新失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    /**
     * 删除时段（管理员）
     * @param {number} slotId 时段ID
     * @returns {Promise}
     */
    deleteTimeSlot: async (slotId) => {
        if (USE_MOCK_DATA) {
            MockData.timeSlots = MockData.timeSlots.filter(t => t.id !== slotId);
            return Promise.resolve({ code: 200, msg: '删除成功', data: null });
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/timeslot/delete/${slotId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '删除失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    },

    // ========== 统计数据 ==========

    /**
     * 获取统计数据（管理员）
     * @returns {Promise}
     */
    getStatistics: async () => {
        if (USE_MOCK_DATA) {
            const totalSeats = MockData.seats.length;
            const availableSeats = MockData.seats.filter(s => s.status === 'FREE').length;
            const reservedSeats = MockData.seats.filter(s => s.status === 'RESERVED').length;
            const occupiedSeats = MockData.seats.filter(s => s.status === 'OCCUPIED').length;
            const totalUsers = MockData.allUsers.length;
            const blacklistedUsers = MockData.allUsers.filter(u => u.isBlacklisted).length;
            const totalViolations = MockData.violations.length;
            const totalReservations = MockData.reservations.length;
            
            return Promise.resolve({
                code: 200,
                msg: '查询成功',
                data: {
                    totalSeats,
                    availableSeats,
                    reservedSeats,
                    occupiedSeats,
                    totalUsers,
                    blacklistedUsers,
                    totalViolations,
                    totalReservations
                }
            });
        }
        try {
            const response = await fetch(`${BASE_URL}/statistics`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.code === 200) {
                return data;
            } else {
                throw { code: data.code || 500, msg: data.msg || '查询失败', data: null };
            }
        } catch (err) {
            if (err.code) {
                throw err;
            }
            throw { code: 500, msg: '网络异常，请稍后重试', data: null };
        }
    }
};

// 注册到全局
window.API = API;

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}