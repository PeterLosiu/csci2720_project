const authenticate = async (req, res, next) => {
    try {
        // 1. 从header获取token
        const token = req.headers.authorization?.split(' ')[1];
        
        // 2. 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. 查找用户
        const user = await User.findById(decoded.id);
        
        // 4. 将用户信息附加到request对象
        req.user = user;
        
        next(); // 继续处理请求
    } catch (error) {
        res.status(401).json({ message: '请先登录' });
    }
};