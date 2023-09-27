import React, { useState } from 'react';
import { Button, message, Table, Tag, Card, Progress  } from 'antd';
import Alerts from '../Alerts/Alerts';
import { UploadOutlined } from '@ant-design/icons'
import JSZip from 'jszip';
const sharp = window.require('sharp');

const Conversion = ({ data }) => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setloading] = useState(false);
    const [btndisabled, setbtndisabled] = useState(false);
    const [status, setStatus] = useState([]);
    const [counPerc, setCountPerc] = useState(0);

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
            render: (_,record, index) => {
                const currIndex = index
                return ( 
                    <Button disabled={btndisabled} type='primary' danger onClick={()=>removeFileByIndex(currIndex)} >Remove</Button>
                )
            }
        },
    ];

    const removeFileByIndex = (indexToRemove) => {
        const updatedFileList = [...fileList];
        updatedFileList.splice(indexToRemove, 1);
        setFileList(updatedFileList);
      };

    const handleFileChange = (e) => {
        setStatus([]);
        setloading(false);
        const selectedFiles = Array.from(e.target.files);
        setFileList(selectedFiles);
        e.target.value = null;
    };
  
    async function view() {
        if (fileList.length === 0) {
            message.error('Please select one or more files to convert.');
            return;
        }

        try {
            const processedImages = [];
            setUploading(true);
            setStatus([]);
            setloading(true)
            setbtndisabled(true);
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                const fileBuffer = await file.arrayBuffer();

                const config = {
                    jpg: { quality: parseInt(data.quality) },
                    webp: { quality: parseInt(data.quality) },
                    tiff: { quality: parseInt(data.quality), force: true },
                    png: { compressionLevel: parseInt(data.compression), force: true },
                    gif: { force: true }
                }
                const qualityConfig = config[data.type || 'jpg'];
                const pipeline = sharp(fileBuffer, { animated: data.animate })

                    .resize(data.height || data.width ? { width: parseInt(data.width), height: parseInt(data.height), fit: 'fill' } : undefined)
                    .toFormat(data.type || 'jpg', qualityConfig)
                    .rotate(data.orientation)


                const processedImageBuffer = await pipeline.toBuffer();
                //  console.log(await sharp(processedImageBuffer).metadata())
                const fileNameParts = file.name.split('.');
                const fileNameWithoutExtension = fileNameParts[0];
                processedImages.push({ name: fileNameWithoutExtension + '.' + data.type, buffer: processedImageBuffer });

                setStatus(prevStatus => {
                    const updatedStatus = [...prevStatus];
                    updatedStatus[i] = 'Completed';
                    return updatedStatus;
                });
                
                setCountPerc((prevCountPerc) => {
                    const updatedCountPerc = i === fileList.length - 1 ? 100 : Math.floor((i / fileList.length) * 100);
                  return updatedCountPerc
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
            setbtndisabled(false);
            message.success('Images converted and zipped successfully.');
        } catch (error) {
            console.error(error);
            message.error('Error while processing the images.');
            setUploading(false);
        }
    }
    const clearList = () => {
        setFileList([]);
        setCountPerc(()=> 0)
        setloading(false);
        setUploading(false);
        setbtndisabled(false);
        setStatus([])
    }
    const scroll = {
        y: 300,
    };

    return (
        <>
            <Card>
                <Alerts />
            </Card>
            <Card
              title={`Total Files: ` + fileList.length}
                bordered={true}
                extra={<>
                    <Button
                        style={{ marginRight: '8px' }}
                        type='primary'
                        icon={<UploadOutlined />}
                        disabled={btndisabled}
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
                        style={{ marginRight: '8px' }}
                        disabled={fileList.length === 0}
                        loading={uploading}
                        
                    >
                        {uploading ? 'Converting' : 'Start Converting'}
                    </Button>
                    <Button
                        type="primary"
                        danger
                        style={{ marginRight: '8px' }}
                        onClick={clearList}
                        disabled={fileList.length === 0 ? true : btndisabled}
                        
                    >
                        Clear List
                    </Button>
                </>}
                style={{
                    width: '100%',
                }}
            >
                <div>
                {loading ? <Progress style={{maxWidth: '50%'}} percent={counPerc} />: null}
                </div>
                <Table bordered columns={columns} pagination={false} scroll={scroll} dataSource={fileList} />
            </Card>
            <div align="center" style={{ marginLeft: '10%' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} id='fileInput' multiple onChange={handleFileChange} />
            </div>
        </>
    );
};

export default Conversion;
