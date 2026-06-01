/**
 * 应用主入口文件
 * 初始化路由和全局事件
 */

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化路由
    Router.init();
    
    // 添加全局错误处理
    window.addEventListener('error', (event) => {
        console.error('全局错误:', event.error);
        Utils.message.error('系统发生错误，请刷新页面重试');
    });

    // 添加网络状态检测
    window.addEventListener('offline', () => {
        Utils.message.warning('网络连接已断开，请检查网络设置');
    });

    window.addEventListener('online', () => {
        Utils.message.success('网络连接已恢复');
    });
});

/**
 * 页面加载完成后的处理
 */
window.addEventListener('load', () => {
    // 可以在这里添加页面加载完成后的额外处理
});