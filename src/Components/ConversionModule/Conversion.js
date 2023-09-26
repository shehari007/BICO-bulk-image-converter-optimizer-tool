import React, { useState } from 'react';
import { Button, message, Table, Tag, Card, Alert } from 'antd';
import { UploadOutlined } from '@ant-design/icons'
import JSZip from 'jszip';
const sharp = window.require('sharp');

const Conversion = ({ data }) => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState([]);
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
                const currentStatus = status[index]; // Get the status corresponding to the current row
                return currentStatus === 'Completed' ? (
                    <Tag color='green'>{currentStatus}</Tag>
                ) : (
                    <Tag color='volcano'>Pending</Tag>
                );
            },
        }
    ];

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFileList(selectedFiles)
    };

    async function view() {
        if (fileList.length === 0) {
            message.error('Please select one or more files to convert.');
            return;
        }

        try {
            const processedImages = [];
            setUploading(true)
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                const fileBuffer = await file.arrayBuffer();

                const config = {
                    jpg: { quality: parseInt(data.quality) },
                    webp: { quality: parseInt(data.quality) },
                    tiff: { quality: parseInt(data.quality), force: true },
                    png: { compressionLevel: 9, force: true },
                }
                const qualityConfig = config[data.type || 'jpg'];
                const pipeline = sharp(fileBuffer)

                    .resize(data.height || data.width ? { width: parseInt(data.width), height: parseInt(data.height), fit: 'fill' } : undefined)
                    .toFormat(data.type || 'jpg', qualityConfig)
                    .rotate(data.orientation)


                const processedImageBuffer = await pipeline.toBuffer();
                //  console.log(await sharp(processedImageBuffer).metadata())
                processedImages.push({ name: file.name + '.' + data.type, buffer: processedImageBuffer });

                setStatus(prevStatus => {
                    const updatedStatus = [...prevStatus];
                    updatedStatus[i] = 'Completed';
                    return updatedStatus;
                });

                // await new Promise(resolve => setTimeout(resolve, 1000)); // For Debugging Adjust the delay time as needed
            }
            const zip = new JSZip();
            for (const { name, buffer } of processedImages) {
                zip.file(name, buffer);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = zipUrl;
            downloadLink.download = 'processed_images.zip';
            downloadLink.textContent = 'Download Zip File';

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            setUploading(false);
            message.success('Images converted and zipped successfully.');
        } catch (error) {
            console.error(error);
            message.error('Error while processing the images.');
            setUploading(false);
        }
    }

    const scroll = {
        y: 250,
    };

    return (
        <>
        <Card>
            <Alert
                message="Informational Notes"
                description={<><p><b>About JPG: </b>Select appropriate quality level when converting to jpg it defines the final quality & size of pictures. <b>Default is 80%</b></p>
                <p><b>About PNG: </b>Select appropriate Compression level when converting to PNG it defines the final quality & size of pictures. <b>Default is 8</b> ~Lower is better</p></>}
                type="info"
                showIcon
            /></Card>
            <Card
                title={`Total Files to be Converted: ` + fileList.length}
                bordered={true}
                extra={<>
                    <Button
                        style={{ marginRight: '8px' }}
                        type='primary'
                        icon={<UploadOutlined />}
                        onClick={() => {
                            const input = document.getElementById('fileInput')
                            input.click();
                        }}
                    >
                        Select Files
                    </Button>
                    <Button
                        type="primary"
                        onClick={view}

                        disabled={fileList.length === 0}
                        loading={uploading}
                        style={{
                            marginTop: 16,
                        }}
                    >
                        {uploading ? 'Converting' : 'Start Converting'}
                    </Button>
                </>}
                // align="center"
                style={{
                    width: '100%',
                    // marginLeft: '20%',
                    //marginTop: '5%',
                }}
            >
                <Table bordered columns={columns} pagination={false} scroll={scroll} dataSource={fileList} />
            </Card>
            <div align="center" style={{ marginLeft: '10%' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} id='fileInput' multiple onChange={handleFileChange} />
            </div>
        </>
    );
};

export default Conversion;
