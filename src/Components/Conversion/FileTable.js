import React from 'react';
import { Table } from 'antd';

const FileTable = ({ fileList, columns }) => {


    return (
        <Table
            bordered
            columns={columns}
            pagination={false}
            dataSource={fileList}
        />
    );
};

export default FileTable;
