import React from 'react';
import { Table, Empty } from 'antd';
import { FileImageOutlined } from '@ant-design/icons';

const FileTable = ({ fileList, columns }) => {
    const tableData = fileList.map((file, index) => ({
        key: `${file.name || 'file'}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        rawFile: file,
    }));

    return (
        <Table
            columns={columns}
            dataSource={tableData}
            pagination={fileList.length > 10 ? {
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} files`,
                pageSizeOptions: ['10', '25', '50', '100'],
            } : false}
            scroll={{ y: 400 }}
            size="middle"
            locale={{
                emptyText: (
                    <Empty
                        image={<FileImageOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                        description="No files added yet"
                    />
                ),
            }}
            rowClassName={(record, index) =>
                index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
            }
        />
    );
};

export default FileTable;

