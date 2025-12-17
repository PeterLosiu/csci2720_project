// src/router/AppRouter.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// 导入页面组件
import Home from '../pages/Home';
import LocationList from '../pages/LocationList';
import SingleLocation from '../pages/SingleLocation';
import Favorites from '../pages/Favorites';
import Login from '../pages/Login';
import Register from '../pages/Register';
// 管理员页面
import AdminUserManager from '../pages/admin/UserManager';
import AdminEventManager from '../pages/admin/EventManager';
// 导航栏组件
import Navbar from '../components/Navbar';

// 私有路由组件（需登录才能访问）
const PrivateRoute = ({ children, isAdmin = false }) => {
  const token = localStorage.getItem('userToken');
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  // 未登录 → 跳转登录页
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 管理员页面 → 仅管理员可访问
  if (isAdmin && !currentUser.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <Router>
      {/* 导航栏（所有页面复用） */}
      <Navbar />
      {/* 路由规则 */}
      <Routes>
        {/* 公开路由（无需登录） */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 私有路由（需登录） */}
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
        <Route path="/locations" element={
          <PrivateRoute>
            <LocationList />
          </PrivateRoute>
        } />
        <Route path="/locations/:id" element={  // 场馆详情页（动态路由参数）
          <PrivateRoute>
            <SingleLocation />
          </PrivateRoute>
        } />
        <Route path="/favorites" element={
          <PrivateRoute>
            <Favorites />
          </PrivateRoute>
        } />
        
        {/* 管理员私有路由（仅管理员可访问） */}
        <Route path="/admin/users" element={
          <PrivateRoute isAdmin={true}>
            <AdminUserManager />
          </PrivateRoute>
        } />
        <Route path="/admin/events" element={
          <PrivateRoute isAdmin={true}>
            <AdminEventManager />
          </PrivateRoute>
        } />
        
        {/* 404路由（匹配所有未定义路径） */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;