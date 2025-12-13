const router = express.Router();
const { authenticate } = require('../middleware/auth');
const LocationController = require('../controllers/locationController');

// 公开路由
router.get('/', authenticate, LocationController.getAllLocations);
router.get('/:id', authenticate, LocationController.getLocation);

// 受保护的管理员路由
router.post('/', authenticate, requireAdmin, LocationController.createLocation);
router.put('/:id', authenticate, requireAdmin, LocationController.updateLocation);

module.exports = router;