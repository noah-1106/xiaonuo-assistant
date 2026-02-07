#!/bin/bash

# 测试脚本：验证微信支付证书

echo "检查证书文件..."
echo "当前目录: $(pwd)"
echo "文件列表:"
ls -la

echo "\n尝试从公钥文件提取信息..."
openssl rsa -in pub_key.pem -pubin -text -noout

echo "\n检查私钥文件..."
openssl rsa -in apiclient_key.pem -text -noout
