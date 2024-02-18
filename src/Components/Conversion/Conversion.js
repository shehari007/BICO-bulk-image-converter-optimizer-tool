import React, { useState } from 'react';
import { Button, message, Card, Progress, Tag } from 'antd';
import FileTable from './FileTable';
import FileUploader from './FileUploader';
import { processImages } from './ImageProcessing';
import Alerts from './Alerts';

const Conversion = ({ data }) => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [countPerc, setCountPerc] = useState(0);
    const [status, setStatus] = useState([]);
    const [converting, setConverting] = useState(false);

    const view = async () => {
        if (fileList.length === 0) {
            message.error('Please select one or more files to convert.');
            return;
        }
        try {
            setConverting(true);
            setUploading(true);
            setLoading(true);
            setBtnDisabled(true);
    
            await processImages(fileList, data, setStatus, setCountPerc);

            setConverting(false); 
            setUploading(false);
            setBtnDisabled(false);
            message.success('Images converted and zipped successfully.');
        } catch (error) {
            console.error(error);
            message.error('Error while processing the images, check settings');
            setConverting(false);
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (fileList.length > 0) {
            setFileList([...fileList, ...selectedFiles]);
        } else {
            setFileList(selectedFiles);
        }
        setStatus([]);
        setLoading(false);
        e.target.value = null;
    };
    

    // const stopConversion = () => {
    //     setConverting(false);
    //     setUploading(false);
    //     setLoading(false);
    //     setBtnDisabled(false);
    //     message.info('Conversion stopped.');
    // };

    const clearList = () => {
        setFileList([]);
        setCountPerc(()=>0);
        setLoading(false);
        setUploading(false);
        setBtnDisabled(false);
        setStatus([]);
    };

    
    const removeFileByIndex = (indexToRemove) => {
        const updatedFileList = [...fileList];
        updatedFileList.splice(indexToRemove, 1);
        setFileList(updatedFileList);
    };

    const columns = [
        {
            title: '#.',
            dataIndex: 'name',
            key: '4',
            width: 75,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'FileName',
            dataIndex: 'name',
            key: '1',
            render: (text) => { return text },
        },
        {
            title: 'FileType',
            dataIndex: 'type',
            key: '2',
        },
        {
            title: 'Status',
            key: '3',
            render: (_, record, index) => {
                const currentStatus = status[index];
                return currentStatus === 'Completed' ? (
                    <Tag color='green'>{currentStatus}</Tag>
                ) : (
                    <Tag color='volcano'>Pending</Tag>
                );
            },
        },
        {
            title: 'Actions',
            dataIndex: 'type',
            key: '5',
            render: (_, record, index) => {
                const currIndex = index
                return (
                    <Button disabled={btnDisabled} type='primary' id="remove-btn" danger onClick={() => removeFileByIndex(currIndex)} >Remove</Button>
                )
            }
        },
    ];

    return (
        <>
            <Alerts />
            <br/>
            <Card
                title={`Total Files: ${fileList.length}`}
                bordered={true}
                extra={
                    <>
                        <FileUploader
                            btnDisabled={btnDisabled}
                            onClick={() => {
                                const input = document.getElementById('fileInput');
                                input.click();
                            }}
                        />
                        {/* {converting ? (
                            <Button type="primary" style={{ marginRight: '8px' }} danger onClick={stopConversion}>
                                Stop Converting
                            </Button>
                        ) : (
                            null
                        )} */}
                        <Button
                                type="primary"
                                onClick={view}
                                style={{ marginRight: '8px' }}
                                disabled={fileList.length === 0}
                                loading={uploading}
                            >
                                {uploading ? 'Converting' : 'Start Converting'}
                            </Button>
                        <Button
                            type="primary"
                            danger
                            onClick={clearList}
                            disabled={fileList.length === 0?true:converting?true:false}
                        >
                            Clear List
                        </Button>
                    </>
                }
                style={{
                    width: '100%',
                }}
            >
                <div>{loading&&fileList.length>0 ? <Progress style={{ maxWidth: '50%' }} percent={countPerc} /> : null}</div>
                <FileTable fileList={fileList} columns={columns} />
            </Card>
            <div align="center" style={{ marginLeft: '10%' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} id="fileInput" multiple onChange={handleFileChange} />
            </div>
        </>
    );
};

export default Conversion;
