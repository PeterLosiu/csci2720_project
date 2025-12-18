import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import '../style/NavbarStyle.css';

const Navbar = () =>{
    return(
        // <BrowserRouter>
        <nav class="navbar">
            {/*左侧Logo与菜单*/}
            <div class="navbar-left">
                Location & Event App
                <ul class="nav-menu">
                    <li class="nav-item"><Link to="/">Home</Link></li>
                    <li class="nav-item"><Link to="/LocationList">Location List</Link></li>
                    <li class="nav-item"><Link to="/Map">Map</Link></li>
                    <li class="nav-item"><Link to="/FavouriteList">Favourite List</Link></li>
                    {/* <!-- 管理员专属菜单（登录后根据权限显示） --> */}
                    <li class="nav-item"><Link to="/EventList">Event List</Link></li>
                    {/* <li class="nav-item admin-menu" style="display: none;">
                        User Manager
                    </li>
                    <li class="nav-item admin-menu" style="display: none;">
                        Event Manager
                    </li> */}
                </ul>
            </div>

            {/* <!-- 右侧：主题切换+用户名+退出登录 --> */}
            <div class="navbar-right">
                {/* <!-- 额外功能：深色/浅色主题切换 --> */}
                {/* <button class="theme-toggle" id="themeToggle">
                    <i class="uil uil-moon"></i>
                </button>
                <div class="user-info">
                    <span class="username" id="currentUsername"></span>
                    <button class="logout-btn" id="logoutBtn">Sign Out</button>
                </div> */}
            </div>
        </nav>
        // </BrowserRouter>
    )
}

export default Navbar;