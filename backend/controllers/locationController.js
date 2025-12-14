const LocationModel = require('../models/Location');

class locationController {
    
    // 1. Getter moethods
    static async getLocations(req, res) {
        /**
         * 1. Receive requests to get location data
         * 2. Use model functions to fetch location data from the database
         * 3. Return the location data to the client
         * 4. Capture and deal with errors
         */
    }
    static async getAllLocations(req, res) {}
    static async getLocationDistance(req, res) {}

    // 2. Setter methods
    static async createLocation(req, res) {
        try {
            // 1. 输入验证（参数检查）
            const { name, latitude, longitude } = req.body;
            if (!name || !latitude || !longitude) {
                return res.status(400).json({ error: '缺少必要字段' });
            }
            
            // 2. 业务逻辑处理（如检查地点是否已存在）
            const exists = await LocationModel.findByName(name);
            if (exists) {
                return res.status(409).json({ error: '地点已存在' });
            }
            
            // 3. 数据库操作（通过Model）
            const newLocation = await LocationModel.create({
                name,
                coordinates: { lat: latitude, lng: longitude }
            });
            
            // 4. 返回响应
            res.status(201).json({
                success: true,
                data: newLocation,
                message: '地点创建成功'
            });
            
        } catch (error) {
            // 5. 错误处理
            console.error('创建地点错误:', error);
            res.status(500).json({ error: '服务器内部错误' });
        }
    }

    // 3. Sort moethods: return a list of location objects
    static async sortByName(req, res) {
        const locations = await LocationModel.find().sort({ name: 1 });
        try{
            res.status(200).json({ locations });
        }catch(error){
            console.error('Sort locations by name error:', error);
            res.status(500).json({ error: 'Server Internal Error' });
        }
        
    }
    static async sortByDistance(req, res) {}
    static async sortByEventNumber(req, res) {
        // sort the locations and return a sorted list of location objects
        try {
            const locations = await LocationModel.find().sort({ eventCount: -1 });
            res.status(200).json({ locations });
        }catch(error){
            console.error('Sort locations by event number error:', error);
            res.status(500).json({ error: 'Server Internal Error' });
        }
    }

    // other methods 
    async calculateDistance(loc1, loc2) {
        return 0;
    }


}

module.exports = locationController;
