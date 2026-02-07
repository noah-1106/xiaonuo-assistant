import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  message,
  Modal,
  Tag,
  Popconfirm,
  Tooltip,
  Space,
  Input,
  Spin,
  Alert
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileTextOutlined,
  DeleteRowOutlined,
  CompressOutlined
} from '@ant-design/icons';
import { API_BASE_URL } from '../../utils/env';

// 日志文件类型定义
interface LogFile {
  filename: string;
  size: number;
  mtime: string;
  isCompressed: boolean;
}

const { TextArea } = Input;

const LogManagement: React.FC = () => {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [logContent, setLogContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  
  // 使用message.useMessage()创建实例
  const [messageApi, contextHolder] = message.useMessage();

  // 获取日志文件列表
  const fetchLogFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/logs/files`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取日志文件列表失败');
      }
      
      const data = await response.json();
      setLogFiles(data.data || []);
    } catch (error) {
      messageApi.error('获取日志文件列表失败');
      console.error('Failed to fetch log files:', error);
    } finally {
      setLoading(false);
    }
  };

  // 读取日志文件内容
  const readLogFile = async (filename: string) => {
    try {
      setContentLoading(true);
      const response = await fetch(`${API_BASE_URL}/logs/files/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('读取日志文件失败');
      }
      
      const data = await response.json();
      setLogContent(data.data.content || '');
      setSelectedFile(filename);
      setDetailModalVisible(true);
    } catch (error) {
      messageApi.error('读取日志文件失败');
      console.error('Failed to read log file:', error);
    } finally {
      setContentLoading(false);
    }
  };

  // 删除日志文件
  const deleteLogFile = async (filename: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs/files/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('删除日志文件失败');
      }
      
      messageApi.success('日志文件删除成功');
      fetchLogFiles();
    } catch (error) {
      messageApi.error('删除日志文件失败');
      console.error('Failed to delete log file:', error);
    }
  };

  // 清理过期日志
  const cleanupLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/logs/cleanup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('清理过期日志失败');
      }
      
      const data = await response.json();
      messageApi.success(data.message || '清理过期日志成功');
      fetchLogFiles();
    } catch (error) {
      messageApi.error('清理过期日志失败');
      console.error('Failed to cleanup logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    fetchLogFiles();
  }, []);

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (text: string) => (
        <div>
          <FileTextOutlined style={{ marginRight: 8 }} />
          <span>{text}</span>
          {text.endsWith('.gz') && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              <CompressOutlined style={{ marginRight: 4 }} />
              压缩
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size)
    },
    {
      title: '修改时间',
      dataIndex: 'mtime',
      key: 'mtime',
      render: (mtime: string) => formatDate(mtime)
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: LogFile) => (
        <Space size="middle">
          <Tooltip title="查看日志内容">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => readLogFile(record.filename)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个日志文件吗？"
            description="此操作不可恢复"
            onConfirm={() => deleteLogFile(record.filename)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除日志文件">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      {contextHolder}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>系统日志管理</span>
            <Space>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={fetchLogFiles}
                loading={loading}
              >
                刷新
              </Button>
              <Popconfirm
                title="确定要清理过期日志吗？"
                description="将删除30天前的所有日志文件"
                onConfirm={cleanupLogs}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="primary"
                  danger
                  icon={<DeleteRowOutlined />}
                >
                  清理过期日志
                </Button>
              </Popconfirm>
            </Space>
          </div>
        }
        variant="outlined"
      >
      <Alert
        title="日志管理提示"
        description="此页面用于查看和管理系统日志文件，仅管理员可访问。定期清理过期日志可以节省存储空间。"
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />
      
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={logFiles}
          rowKey="filename"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
          locale={{
            emptyText: '暂无日志文件'
          }}
        />
      </Spin>

      {/* 日志文件详情模态框 */}
      <Modal
        title={`日志文件详情: ${selectedFile}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Spin spinning={contentLoading}>
          <TextArea
            value={logContent}
            readOnly
            rows={20}
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.5'
            }}
          />
        </Spin>
      </Modal>
    </Card>
    </>
  );
};

export default LogManagement;