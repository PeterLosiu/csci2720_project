const Location = require('../models/location');

// 手动定义10个位置数据（保持原始字段顺序，新增字段由模型自动添加）
const manualLocations = [
  {
    "locationId": 50110014,
    "nameC": "香港文化中心 (音樂廳)",
    "nameE": "Hong Kong Cultural Centre (Concert Hall)",
    "latitude": 22.29386,
    "longitude": 114.17053,
    "events": [
      { "$oid": "69416721ec2a06f91d287122" },
      { "$oid": "69416721ec2a06f91d287124" },
      { "$oid": "69416721ec2a06f91d287140" },
      { "$oid": "69416721ec2a06f91d287149" },
      { "$oid": "69416721ec2a06f91d28714a" },
      { "$oid": "69416721ec2a06f91d28714f" }
    ],
    "eventCount": 6,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:22.032Z" }
    // distanceKm会自动添加到此处（文档末尾）
  },
  {
    "locationId": 76810048,
    "nameC": "屯門大會堂 (演奏廳)",
    "nameE": "Tuen Mun Town Hall (Auditorium)",
    "latitude": 22.39181,
    "longitude": 113.976771,
    "events": [
      { "$oid": "69416721ec2a06f91d287130" },
      { "$oid": "69416721ec2a06f91d287131" },
      { "$oid": "69416721ec2a06f91d28714c" }
    ],
    "eventCount": 3,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:22.046Z" }
  },
  {
    "locationId": 76810049,
    "nameC": "屯門大會堂 (文娛廳)",
    "nameE": "Tuen Mun Town Hall (Cultural Activities Hall)",
    "latitude": 22.39181,
    "longitude": 113.976771,
    "events": [
      { "$oid": "69416721ec2a06f91d287137" },
      { "$oid": "69416721ec2a06f91d287138" },
      { "$oid": "69416721ec2a06f91d287139" },
      { "$oid": "69416721ec2a06f91d28713b" },
      { "$oid": "69416721ec2a06f91d28713c" },
      { "$oid": "69416721ec2a06f91d28713d" },
      { "$oid": "69416721ec2a06f91d287141" },
      { "$oid": "69416721ec2a06f91d287146" }
    ],
    "eventCount": 8,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:22.049Z" }
  },
  {
    "locationId": 87310051,
    "nameC": "元朗劇院 (演藝廳)",
    "nameE": "Yuen Long Theatre (Auditorium)",
    "latitude": 22.44152,
    "longitude": 114.02289,
    "events": [
      { "$oid": "69416721ec2a06f91d287125" },
      { "$oid": "69416721ec2a06f91d28712f" },
      { "$oid": "69416721ec2a06f91d28713a" },
      { "$oid": "69416721ec2a06f91d287145" },
      { "$oid": "69416721ec2a06f91d28714b" }
    ],
    "eventCount": 5,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:22.081Z" }
  },
  {
    "locationId": 87410030,
    "nameC": "牛池灣文娛中心 (劇院)",
    "nameE": "Ngau Chi Wan Civic Centre (Theatre)",
    "latitude": 22.334583,
    "longitude": 114.208766,
    "events": [
      { "$oid": "69416721ec2a06f91d287143" },
      { "$oid": "69416721ec2a06f91d287147" },
      { "$oid": "69416721ec2a06f91d28714d" }
    ],
    "eventCount": 3,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:22.093Z" }
  },
  {
    "locationId": 87610118,
    "nameC": "高山劇場 (劇院)",
    "nameE": "Ko Shan Theatre (Theatre)",
    "latitude": 22.31368,
    "longitude": 114.18556,
    "events": [
      { "$oid": "69416721ec2a06f91d287126" },
      { "$oid": "69416721ec2a06f91d287129" },
      { "$oid": "69416721ec2a06f91d28712d" },
      { "$oid": "69416721ec2a06f91d287134" },
      { "$oid": "69416721ec2a06f91d287135" },
      { "$oid": "69416721ec2a06f91d287136" }
    ],
    "eventCount": 6,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:22.102Z" }
  },
  {
    "locationId": 87616551,
    "nameC": "高山劇場 (新翼演藝廳)",
    "nameE": "Ko Shan Theatre (New Wing Auditorium)",
    "latitude": 22.31368,
    "longitude": 114.18556,
    "events": [
      { "$oid": "69416721ec2a06f91d287121" },
      { "$oid": "69416721ec2a06f91d287127" },
      { "$oid": "69416721ec2a06f91d287128" },
      { "$oid": "69416721ec2a06f91d28712a" },
      { "$oid": "69416721ec2a06f91d28712b" },
      { "$oid": "69416721ec2a06f91d28712c" },
      { "$oid": "69416721ec2a06f91d28712e" },
      { "$oid": "69416721ec2a06f91d287132" },
      { "$oid": "69416721ec2a06f91d287133" }
    ],
    "eventCount": 9,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:22.104Z" }
  },
  {
    "locationId": 87810042,
    "nameC": "上環文娛中心 (劇院)",
    "nameE": "Sheung Wan Civic Centre (Theatre)",
    "latitude": 22.28602,
    "longitude": 114.14967,
    "events": [
      { "$oid": "69416721ec2a06f91d287123" },
      { "$oid": "69416721ec2a06f91d28714e" },
      { "$oid": "69416721ec2a06f91d287150" }
    ],
    "eventCount": 3,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:22.108Z" }
  },
  {
    "locationId": 22512700,
    "nameC": "香港文化博物館 (專題展覽館一及二)",
    "nameE": "Hong Kong Heritage Museum (Thematic Galleries 1 & 2)",
    "latitude": 22.37737,
    "longitude": 114.1853,
    "events": [],
    "eventCount": 0,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:21.955Z" }
  },
  {
    "locationId": 3110031,
    "nameC": "北區大會堂 (演奏廳)",
    "nameE": "North District Town Hall (Auditorium)",
    "latitude": 22.501639,
    "longitude": 114.128911,
    "events": [],
    "eventCount": 0,
    "comments": [],
    "lastUpdated": { "$date": "2025-12-16T14:05:21.973Z" }
  }
];

// 初始化数据：清空原有数据并导入手动数据
async function initData() {
  try {
    await Location.deleteMany({});
    console.log('已清空原有locations数据');

    // 导入数据（模型会自动在末尾添加distanceKm）
    await Location.insertMany(manualLocations);
    console.log(`成功导入 ${manualLocations.length} 条位置数据，新增字段已添加到文档末尾`);
  } catch (err) {
    console.error('数据初始化失败:', err);
  }
}

module.exports = { initData };