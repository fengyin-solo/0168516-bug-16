import { Modal, Tag, Button, Space, message } from 'antd';
import { StarOutlined, StarFilled, EditOutlined, CopyOutlined } from '@ant-design/icons';
import type { PromptTemplate } from '../../types';
import './TemplatePreviewModal.css';

interface TemplatePreviewModalProps {
  open: boolean;
  template: PromptTemplate | null;
  onClose: () => void;
  onUse: (content: string) => void;
  onEdit: (template: PromptTemplate) => void;
  onToggleFavorite: (id: string) => void;
}

export function TemplatePreviewModal({
  open,
  template,
  onClose,
  onUse,
  onEdit,
  onToggleFavorite,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const handleCopyContent = () => {
    navigator.clipboard
      .writeText(template.content)
      .then(() => message.success('模板内容已复制'))
      .catch(() => message.error('复制失败，请手动选择内容复制'));
  };

  return (
    <Modal
      title={
        <div className="preview-modal-title">
          <span>{template.name}</span>
          <Tag color="blue">{template.category}</Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      destroyOnClose
      width={700}
      footer={
        <Space>
          <Button
            icon={template.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={() => onToggleFavorite(template.id)}
          >
            {template.isFavorite ? '取消收藏' : '收藏'}
          </Button>
          <Button icon={<CopyOutlined />} onClick={handleCopyContent}>
            复制内容
          </Button>
          <Button icon={<EditOutlined />} onClick={() => onEdit(template)}>
            编辑
          </Button>
          <Button type="primary" onClick={() => onUse(template.content)}>
            使用模板
          </Button>
        </Space>
      }
    >
      {template.description && (
        <p className="preview-description">{template.description}</p>
      )}
      <div className="preview-content">
        <pre>{template.content}</pre>
      </div>
    </Modal>
  );
}
