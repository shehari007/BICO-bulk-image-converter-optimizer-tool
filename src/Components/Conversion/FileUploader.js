import React from 'react';
import { Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const FileUploader = ({ btnDisabled, onClick }) => {
    return (
        <Button
            style={{ marginRight: '8px' }}
            type="primary"
            icon={<UploadOutlined />}
            disabled={btnDisabled}
            onClick={onClick}
        >
            Select Files
        </Button>
    );
};

export default FileUploader;
