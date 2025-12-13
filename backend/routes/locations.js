const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const LocationController = require('../controllers/locationController');

// 公开路由
router.get('/', authenticate, LocationController.getAllLocations);
router.get('/:id', authenticate, LocationController.getLocation);

// 受保护的管理员路由
router.post('/', authenticate, requireAdmin, LocationController.createLocation);
router.put('/:id', authenticate, requireAdmin, LocationController.updateLocation);
// 执行流程：
// 1. authenticate → 验证是否登录
// 2. requireAdmin → 验证是否是管理员
// 3. LocationController.createLocation → 执行业务逻辑

module.exports = router;