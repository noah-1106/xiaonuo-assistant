#!/bin/bash

# 生产服务器测试套餐管理API脚本
echo "🔍 准备测试生产服务器套餐管理API..."

# 配置信息
PROJECT_ROOT="$(dirname "$0")/.."
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$PROJECT_ROOT/backend/xiaonuoSev1.pem"
SERVER_DIR="/root/xiaonuo/backend"
API_BASE_URL="https://xiaonuo.top/api"

# 创建测试脚本
cat > /tmp/xiaonuo-admin/test-plan-api.js << 'EOF'
// 使用 Node.js 内置的 fetch API
// 注意：Node.js v18+ 内置了 fetch API

const API_BASE_URL = 'https://xiaonuo.top/api';

// 测试账号信息
const testAdmin = {
  username: 'admin_new2',
  password: 'admin123'
};

// 存储token
let token = '';

// 登录获取token
const login = async () => {
  try {
    console.log('🔑 正在登录...');
    const response = await fetch(`${API_BASE_URL}/auth/login-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: testAdmin.username,
        password: testAdmin.password,
        captcha: '123456' // 假设验证码为123456
      })
    });

    if (!response.ok) {
      throw new Error(`登录失败: ${response.status}`);
    }

    const data = await response.json();
    token = data.data.token;
    console.log('✅ 登录成功，获取到token');
    return true;
  } catch (error) {
    console.error('❌ 登录失败:', error);
    return false;
  }
};

// 获取所有套餐
const getAllPlans = async () => {
  try {
    console.log('📋 正在获取所有套餐...');
    const response = await fetch(`${API_BASE_URL}/plans/admin/plans`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`获取套餐失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 获取套餐成功，共', data.data.length, '个套餐');
    console.log('套餐列表:');
    data.data.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} - ¥${plan.price} - ${plan.duration}天 - ${plan.isActive ? '启用' : '禁用'}`);
      console.log(`   ID: ${plan._id}`);
    });
    return data.data;
  } catch (error) {
    console.error('❌ 获取套餐失败:', error);
    return [];
  }
};

// 创建新套餐
const createNewPlan = async () => {
  try {
    console.log('\n➕ 正在创建新套餐...');
    const newPlan = {
      name: '测试套餐',
      description: '这是一个测试套餐',
      price: 199,
      discountPrice: 99,
      duration: 30,
      features: ['测试功能1', '测试功能2', '测试功能3'],
      isActive: true
    };

    const response = await fetch(`${API_BASE_URL}/plans/admin/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newPlan)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`创建套餐失败: ${response.status} - ${errorData.message || '未知错误'}`);
    }

    const data = await response.json();
    console.log('✅ 创建套餐成功');
    console.log('新套餐信息:');
    console.log('名称:', data.data.name);
    console.log('价格:', data.data.price);
    console.log('ID:', data.data._id);
    return data.data;
  } catch (error) {
    console.error('❌ 创建套餐失败:', error);
    return null;
  }
};

// 删除套餐
const deletePlan = async (planId) => {
  try {
    console.log(`\n🗑️  正在删除套餐 (ID: ${planId})...`);
    const response = await fetch(`${API_BASE_URL}/plans/admin/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`删除套餐失败: ${response.status} - ${errorData.message || '未知错误'}`);
    }

    const data = await response.json();
    console.log('✅ 删除套餐成功');
    return true;
  } catch (error) {
    console.error('❌ 删除套餐失败:', error);
    return false;
  }
};

// 主测试函数
const main = async () => {
  console.log('🚀 开始测试套餐管理API...');
  
  // 登录
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('❌ 登录失败，测试终止');
    return;
  }
  
  // 获取所有套餐
  const plans = await getAllPlans();
  if (plans.length === 0) {
    console.log('⚠️  没有找到套餐，创建一个新套餐');
    await createNewPlan();
  } else {
    // 创建新套餐
    const newPlan = await createNewPlan();
    
    // 删除第一个套餐（测试删除功能）
    if (plans.length > 0) {
      await deletePlan(plans[0]._id);
    }
    
    // 再次获取所有套餐，验证操作结果
    console.log('\n🔍 再次获取所有套餐，验证操作结果...');
    await getAllPlans();
  }
  
  console.log('\n🎉 测试完成！');
};

main();
EOF

# 上传脚本到生产服务器
echo "📤 上传测试脚本到生产服务器..."
scp -i "$SERVER_KEY" /tmp/xiaonuo-admin/test-plan-api.js "$SERVER_USER@$SERVER_IP:$SERVER_DIR/"

if [ $? -ne 0 ]; then
  echo "❌ 上传脚本失败！"
  rm -rf /tmp/xiaonuo-admin
  exit 1
fi

# 登录生产服务器并执行脚本
echo "🚀 在生产服务器执行测试脚本..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && node test-plan-api.js"

if [ $? -ne 0 ]; then
  echo "❌ 执行脚本失败！"
  rm -rf /tmp/xiaonuo-admin
  exit 1
fi

# 清理临时文件
rm -rf /tmp/xiaonuo-admin

echo "✅ 套餐管理API测试脚本执行完成!"
