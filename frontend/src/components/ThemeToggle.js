import { useState, useEffect } from 'react';
import '../css/App.css'; // 确认路径与实际文件层级一致

export default function ThemeToggle() {
  // 优化：简化localStorage初始值逻辑
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // 优化：直接操作document.body（与你之前的导航栏深色主题逻辑一致）
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="theme-toggle"
      // 修复：aria-label语义化，描述按钮功能
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      // 优化：添加title属性，鼠标悬浮提示
      title={isDark ? 'Light Theme' : 'Dark Theme'}
    >
      {isDark ? '🌞' : '🌙'}
    </button>
  );
}