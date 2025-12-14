const authenticate = (req, res, next) => {
  // 1. 从请求头获取token（如：req.headers.authorization）
  // 2. 验证token有效性（用JWT或其他方式）
  // 3. 如果有效：将用户信息存入req.user，调用next()
  // 4. 如果无效：返回401错误 res.status(401).json({error: '未认证'})
};

const requireAdmin = (req, res, next) => {
  // 1. 假设authenticate已把用户信息放在req.user
  // 2. 检查req.user.role === 'admin'
  // 3. 如果是管理员：next()
  // 4. 如果不是：返回403错误 res.status(403).json({error: '权限不足'})
};

module.exports = { authenticate, requireAdmin };