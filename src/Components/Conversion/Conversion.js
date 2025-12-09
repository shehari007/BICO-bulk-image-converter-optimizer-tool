import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
    Button, message, Card, Progress, Tag, Radio, Space, 
    Typography, Tooltip, Row, Col, Modal, Descriptions, Divider
} from 'antd';
import { 
    UploadOutlined, PlayCircleOutlined, DeleteOutlined, 
    FolderOpenOutlined, FileZipOutlined, CloudDownloadOutlined,
    FileImageOutlined, ThunderboltOutlined, CheckCircleOutlined,
    InboxOutlined, ExclamationCircleOutlined, PauseCircleOutlined,
    StopOutlined, CaretRightOutlined, FolderOutlined,
    SettingOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import FileTable from './FileTable';
import { processImages, pauseConversion, resumeConversion, stopConversion, resetConversionController, estimateOutputSize } from './ImageProcessing';
import Alerts from './Alerts';

const { Text, Title } = Typography;
const { ipcRenderer } = window.require('electron');

const previewCache = new Map();

const Conversion = ({ data }) => {
    const [fileList, setFileList] = useState([]);
    const [previews, setPreviews] = useState({});
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [countPerc, setCountPerc] = useState(0);
    const [status, setStatus] = useState([]);
    const [converting, setConverting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [outputMode, setOutputMode] = useState('zip');
    const [outputFolder, setOutputFolder] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [conversionStats, setConversionStats] = useState(null);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const newPreviews = {};
        fileList.forEach((file, index) => {
            const key = file.name + '-' + file.size + '-' + index;
            if (!previewCache.has(key) && file instanceof File) {
                try {
                    const url = URL.createObjectURL(file);
                    previewCache.set(key, url);
                } catch (e) {
                    console.error('Error creating preview:', e);
                }
            }
            newPreviews[key] = previewCache.get(key);
        });
        setPreviews(newPreviews);

        return () => {
            previewCache.forEach((url, key) => {
                if (!newPreviews[key]) {
                    URL.revokeObjectURL(url);
                    previewCache.delete(key);
                }
            });
        };
    }, [fileList]);

    const totalSize = useMemo(() => 
        fileList.reduce((sum, file) => sum + (file.size || 0), 0), 
        [fileList]
    );

    const estimatedSize = useMemo(() => {
        if (fileList.length === 0) return 0;
        return fileList.reduce((sum, file) => sum + estimateOutputSize(file.size || 0, data), 0);
    }, [fileList, data]);

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const showConfirmModal = () => {
        if (fileList.length === 0) {
            message.error('Please select one or more files to convert.');
            return;
        }
        if (outputMode === 'folder' && !outputFolder) {
            message.error('Please select an output folder first.');
            return;
        }
        setConfirmModalVisible(true);
    };

    const startConversion = async () => {
        setConfirmModalVisible(false);
        
        try {
            resetConversionController();
            setConverting(true);
            setUploading(true);
            setLoading(true);
            setBtnDisabled(true);
            setIsPaused(false);
            setConversionStats(null);

            const stats = await processImages(fileList, data, setStatus, setCountPerc, outputMode, outputFolder);

            setConversionStats(stats);
            setConverting(false);
            setUploading(false);
            setBtnDisabled(false);
            setIsPaused(false);
            setLoading(false);
            
            Modal.success({
                title: (
                    <span style={{ color: '#f0f6fc', fontSize: 18 }}>
                        <CheckCircleOutlined style={{ color: '#3fb950', marginRight: 8 }} />
                        Conversion Complete!
                    </span>
                ),
                icon: null,
                className: 'dark-modal',
                width: 760,
                content: (
                    <div style={{ marginTop: 8, color: '#c9d1d9', padding: '8px 4px 4px' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <div style={{ textAlign: 'center', padding: 16, background: 'rgba(63, 185, 80, 0.1)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 28, fontWeight: 700, color: '#3fb950' }}>{stats.processed}</div>
                                    <div style={{ color: '#8b949e', fontSize: 12 }}>Processed</div>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div style={{ textAlign: 'center', padding: 16, background: stats.failed > 0 ? 'rgba(248, 81, 73, 0.1)' : 'rgba(63, 185, 80, 0.1)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 28, fontWeight: 700, color: stats.failed > 0 ? '#f85149' : '#3fb950' }}>{stats.failed}</div>
                                    <div style={{ color: '#8b949e', fontSize: 12 }}>Failed</div>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div style={{ textAlign: 'center', padding: 16, background: 'rgba(88, 166, 255, 0.1)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 28, fontWeight: 700, color: '#58a6ff' }}>{stats.savings > 0 ? stats.savings.toFixed(1) : 0}%</div>
                                    <div style={{ color: '#8b949e', fontSize: 12 }}>Space Saved</div>
                                </div>
                            </Col>
                        </Row>
                        
                        <Divider style={{ borderColor: '#30363d', margin: '16px 0' }} />
                        
                        <div style={{ background: 'rgba(88, 166, 255, 0.05)', padding: 14, borderRadius: 10, border: '1px solid rgba(88, 166, 255, 0.2)' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Text style={{ color: '#8b949e' }}>Original Size:</Text>
                                    <Text strong style={{ color: '#f0f6fc', marginLeft: 8 }}>{formatSize(stats.totalOriginal || totalSize)}</Text>
                                </Col>
                                <Col span={12}>
                                    <Text style={{ color: '#8b949e' }}>Final Size:</Text>
                                    <Text strong style={{ color: '#3fb950', marginLeft: 8 }}>{formatSize(stats.totalNew || 0)}</Text>
                                </Col>
                            </Row>
                            <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={12}>
                                    <Text style={{ color: '#8b949e' }}>Output Format:</Text>
                                    <Tag color="blue" style={{ marginLeft: 8 }}>{(data.type || 'JPG').toUpperCase()}</Tag>
                                </Col>
                                <Col span={12}>
                                    <Text style={{ color: '#8b949e' }}>Save Method:</Text>
                                    <Tag color="purple" style={{ marginLeft: 8 }}>{outputMode === 'zip' ? 'ZIP Archive' : 'Folder'}</Tag>
                                </Col>
                            </Row>
                        </div>
                        
                        {outputMode === 'folder' && outputFolder && (
                            <div style={{ marginTop: 12 }}>
                                <Button 
                                    type="link" 
                                    icon={<FolderOutlined />} 
                                    onClick={() => openOutputFolder()}
                                    style={{ color: '#58a6ff', padding: 0 }}
                                >
                                    Open Output Folder
                                </Button>
                            </div>
                        )}
                        
                        {stats.wasStopped && (
                            <div style={{ marginTop: 12, padding: 8, background: 'rgba(240, 136, 62, 0.1)', borderRadius: 4 }}>
                                <Text style={{ color: '#f0883e' }}>
                                    <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                                    Conversion was stopped. {stats.skipped} files skipped.
                                </Text>
                            </div>
                        )}
                    </div>
                ),
                okText: 'Done',
                okButtonProps: { style: { background: '#238636', borderColor: '#238636' } },
            });
        } catch (error) {
            console.error(error);
            message.error('Error while processing images. Check your settings.');
            setConverting(false);
            setUploading(false);
            setBtnDisabled(false);
            setIsPaused(false);
            setLoading(false);
        }
    };

    const handlePauseResume = () => {
        if (isPaused) {
            resumeConversion();
            setIsPaused(false);
            message.info('Conversion resumed');
        } else {
            pauseConversion();
            setIsPaused(true);
            message.info('Conversion paused');
        }
    };

    const handleStop = () => {
        Modal.confirm({
            title: <span style={{ color: '#f0f6fc' }}>Stop Conversion?</span>,
            icon: <ExclamationCircleOutlined style={{ color: '#f0883e' }} />,
            content: <span style={{ color: '#c9d1d9' }}>Are you sure you want to stop? Already processed images will be saved.</span>,
            okText: 'Stop',
            okType: 'danger',
            cancelText: 'Continue',
            className: 'dark-modal',
            onOk() {
                stopConversion();
                message.warning('Stopping conversion...');
            },
        });
    };

    const openOutputFolder = () => {
        if (outputFolder) {
            ipcRenderer.send('open-folder', outputFolder);
        }
    };

    const handleFileChange = useCallback((e) => {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
        e.target.value = null;
    }, []);

    const handleFiles = useCallback((files) => {
        const imageFiles = files.filter(file => 
            file.type.startsWith('image/') || 
            /\.(jpg|jpeg|png|gif|webp|tiff|avif|heif|bmp)$/i.test(file.name)
        );

        if (imageFiles.length === 0) {
            message.warning('No valid image files selected.');
            return;
        }

        setFileList(prev => {
            const existingNames = new Set(prev.map(f => f.name));
            const newFiles = imageFiles.filter(f => !existingNames.has(f.name));
            if (newFiles.length < imageFiles.length) {
                message.info((imageFiles.length - newFiles.length) + ' duplicate files skipped.');
            }
            return [...prev, ...newFiles];
        });
        setStatus([]);
        setLoading(false);
        setConversionStats(null);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, [handleFiles]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const selectOutputFolder = async () => {
        try {
            const result = await ipcRenderer.invoke('select-folder');
            if (result && !result.canceled && result.filePaths.length > 0) {
                setOutputFolder(result.filePaths[0]);
                message.success('Output folder selected!');
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
            message.error('Failed to select folder');
        }
    };

    const clearList = () => {
        previewCache.forEach((url) => URL.revokeObjectURL(url));
        previewCache.clear();
        setFileList([]);
        setPreviews({});
        setCountPerc(0);
        setLoading(false);
        setUploading(false);
        setBtnDisabled(false);
        setStatus([]);
        setConversionStats(null);
    };

    const removeFileByIndex = useCallback((indexToRemove) => {
        setFileList(prev => prev.filter((_, index) => index !== indexToRemove));
        setStatus(prev => prev.filter((_, index) => index !== indexToRemove));
    }, []);

    const columns = [
        {
            title: '#',
            dataIndex: 'index',
            key: 'index',
            width: 50,
            render: (_, __, index) => <span style={{ color: '#8b949e' }}>{index + 1}</span>,
        },
        {
            title: 'Preview',
            dataIndex: 'preview',
            key: 'preview',
            width: 70,
            render: (_, record, index) => {
                const key = record.name + '-' + record.size + '-' + index;
                const previewUrl = previews[key];
                return (
                    <div style={{ 
                        width: 48, height: 48, borderRadius: 6, overflow: 'hidden', 
                        background: '#21262d', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', border: '1px solid #30363d'
                    }}>
                        {previewUrl ? (
                            <img src={previewUrl} alt={record.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <FileImageOutlined style={{ fontSize: 20, color: '#8b949e' }} />
                        )}
                    </div>
                );
            },
        },
        {
            title: 'File Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text}>
                    <span style={{ color: '#f0f6fc', fontWeight: 500 }}>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 90,
            render: (type, record) => {
                const ext = type?.split('/')[1]?.toUpperCase() || record.name?.split('.').pop()?.toUpperCase() || 'IMG';
                return <Tag style={{ background: 'rgba(88, 166, 255, 0.15)', border: 'none', color: '#58a6ff', borderRadius: 4 }}>{ext}</Tag>;
            },
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
            width: 100,
            render: (size) => <span style={{ color: '#c9d1d9' }}>{formatSize(size || 0)}</span>,
        },
        {
            title: 'Est. Output',
            key: 'estimated',
            width: 100,
            render: (_, record) => {
                const est = estimateOutputSize(record.size || 0, data);
                const savings = record.size > 0 ? ((record.size - est) / record.size * 100).toFixed(0) : 0;
                return (
                    <Tooltip title={'Estimated ' + savings + '% smaller'}>
                        <span style={{ color: savings > 0 ? '#3fb950' : '#c9d1d9' }}>~{formatSize(est)}</span>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            width: 100,
            render: (_, __, index) => {
                const currentStatus = status[index];
                if (currentStatus === 'Completed') {
                    return <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 4 }}>Done</Tag>;
                } else if (currentStatus === 'Failed') {
                    return <Tag color="error" icon={<ExclamationCircleOutlined />} style={{ borderRadius: 4 }}>Failed</Tag>;
                }
                return <Tag style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', borderRadius: 4 }}>Pending</Tag>;
            },
        },
        {
            title: '',
            key: 'actions',
            width: 50,
            render: (_, __, index) => (
                <Tooltip title="Remove">
                    <Button type="text" icon={<DeleteOutlined />} disabled={btnDisabled} onClick={() => removeFileByIndex(index)} style={{ color: '#f85149' }} />
                </Tooltip>
            ),
        },
    ];

    const estimatedSavings = totalSize > 0 ? ((totalSize - estimatedSize) / totalSize * 100).toFixed(0) : 0;

    return (
        <div className="conversion-container fade-in">
            <Alerts />

            {fileList.length > 0 && (
                <div style={{ background: '#161b22', borderRadius: 12, padding: '16px 24px', marginBottom: 16, border: '1px solid #30363d' }}>
                    <Row gutter={[24, 16]} align="middle">
                        <Col xs={12} sm={12} md={12} lg={6} xl={6}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FileImageOutlined style={{ fontSize: 24, color: '#58a6ff' }} />
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f0f6fc' }}>{fileList.length}</div>
                                    <div style={{ fontSize: 12, color: '#8b949e' }}>Files</div>
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} sm={12} md={12} lg={6} xl={6}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <CloudDownloadOutlined style={{ fontSize: 24, color: '#a371f7' }} />
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f0f6fc' }}>{formatSize(totalSize)}</div>
                                    <div style={{ fontSize: 12, color: '#8b949e' }}>Total Size</div>
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} sm={12} md={12} lg={6} xl={6}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <ThunderboltOutlined style={{ fontSize: 24, color: '#f0883e' }} />
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f0f6fc' }}>{(data.type || 'JPG').toUpperCase()}</div>
                                    <div style={{ fontSize: 12, color: '#8b949e' }}>Output Format</div>
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} sm={12} md={12} lg={6} xl={6}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <CheckCircleOutlined style={{ fontSize: 24, color: '#3fb950' }} />
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#3fb950' }}>~{formatSize(estimatedSize)}</div>
                                    <div style={{ fontSize: 12, color: '#8b949e' }}>Est. Output (~{estimatedSavings}% smaller)</div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            <Card className="main-card" bordered={false} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #21262d', padding: '16px 16px 0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileImageOutlined style={{ fontSize: 20, color: '#58a6ff' }} />
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#f0f6fc' }}>Image Files</span>
                        {fileList.length > 0 && <Tag style={{ background: '#238636', border: 'none', color: '#fff', borderRadius: 10 }}>{fileList.length}</Tag>}
                    </div>
                    <Space wrap>
                        <Button type="primary" icon={<UploadOutlined />} disabled={btnDisabled} onClick={() => fileInputRef.current?.click()} style={{ background: '#21262d', borderColor: '#30363d' }}>
                            Add Files
                        </Button>
                        
                        {converting ? (
                            <>
                                <Button icon={isPaused ? <CaretRightOutlined /> : <PauseCircleOutlined />} onClick={handlePauseResume} style={{ background: isPaused ? '#238636' : '#f0883e', borderColor: isPaused ? '#238636' : '#f0883e', color: '#fff' }}>
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button icon={<StopOutlined />} onClick={handleStop} danger>Stop</Button>
                            </>
                        ) : (
                            <Button type="primary" icon={<PlayCircleOutlined />} onClick={showConfirmModal} disabled={fileList.length === 0} loading={uploading} style={{ background: '#238636', borderColor: '#238636' }}>
                                {uploading ? 'Converting...' : 'Start Conversion'}
                            </Button>
                        )}
                        
                        <Button icon={<DeleteOutlined />} onClick={clearList} disabled={fileList.length === 0 || converting} style={{ background: '#21262d', borderColor: '#30363d', color: '#f85149' }}>
                            Clear
                        </Button>
                    </Space>
                </div>

                {loading && fileList.length > 0 && (
                    <div style={{ marginBottom: 16, padding: 16, background: '#161b22', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: '#c9d1d9' }}>{isPaused ? 'Paused...' : (countPerc === 100 ? 'Completed!' : 'Processing images...')}</span>
                            <span style={{ color: '#58a6ff', fontWeight: 600 }}>{countPerc}%</span>
                        </div>
                        <Progress percent={countPerc} status={isPaused ? 'exception' : countPerc === 100 ? 'success' : 'active'} strokeColor={isPaused ? '#f0883e' : { '0%': '#58a6ff', '100%': '#3fb950' }} trailColor="rgba(255,255,255,0.1)" showInfo={false} />
                    </div>
                )}

                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#161b22', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ color: '#8b949e' }}>Save As:</span>
                    <Radio.Group value={outputMode} onChange={(e) => setOutputMode(e.target.value)} disabled={converting} buttonStyle="solid">
                        <Radio.Button value="zip" style={{ background: outputMode === 'zip' ? '#238636' : '#21262d' }}><FileZipOutlined /> ZIP</Radio.Button>
                        <Radio.Button value="folder" style={{ background: outputMode === 'folder' ? '#238636' : '#21262d' }}><FolderOpenOutlined /> Folder</Radio.Button>
                    </Radio.Group>
                    
                    {outputMode === 'folder' && (
                        <Space>
                            <Button icon={<FolderOpenOutlined />} onClick={selectOutputFolder} disabled={converting} size="small" style={{ background: '#21262d', borderColor: '#30363d' }}>Browse</Button>
                            {outputFolder && (
                                <Tooltip title="Click to open folder">
                                    <Button type="link" onClick={openOutputFolder} style={{ color: '#58a6ff', padding: '0 8px', maxWidth: 300 }} icon={<FolderOutlined />}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 250 }}>{outputFolder}</span>
                                    </Button>
                                </Tooltip>
                            )}
                        </Space>
                    )}
                </div>

                {fileList.length === 0 ? (
                    <div
                        style={{ border: '2px dashed ' + (dragOver ? '#58a6ff' : '#30363d'), borderRadius: 12, padding: '60px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', background: dragOver ? 'rgba(88, 166, 255, 0.1)' : '#161b22' }}
                        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()}
                    >
                        <InboxOutlined style={{ fontSize: 64, color: '#58a6ff', marginBottom: 16 }} />
                        <Title level={4} style={{ color: '#f0f6fc', margin: 0 }}>Drop images here or click to upload</Title>
                        <Text style={{ color: '#8b949e' }}>Supports JPG, PNG, WebP, GIF, TIFF, AVIF, HEIF and more</Text>
                    </div>
                ) : (
                    <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} style={{ padding: '0 16px 16px 16px' }}>
                        <FileTable fileList={fileList} columns={columns} />
                    </div>
                )}
            </Card>

            <input ref={fileInputRef} type="file" accept="image/*,.heif,.heic,.avif,.webp,.tiff,.tif" style={{ display: 'none' }} multiple onChange={handleFileChange} />

            <Modal
                title={<span style={{ color: '#f0f6fc', fontSize: 18 }}><SettingOutlined style={{ color: '#58a6ff', marginRight: 8 }} />Confirm Conversion Settings</span>}
                open={confirmModalVisible} onOk={startConversion} onCancel={() => setConfirmModalVisible(false)}
                okText="Start Conversion" cancelText="Cancel" className="dark-modal"
                okButtonProps={{ icon: <PlayCircleOutlined />, style: { background: '#238636', borderColor: '#238636' } }} width={600}
            >
                <div style={{ color: '#c9d1d9' }}>
                    <Divider style={{ borderColor: '#30363d', margin: '16px 0' }} />
                    <Descriptions column={2} size="small" labelStyle={{ color: '#8b949e' }} contentStyle={{ color: '#f0f6fc', fontWeight: 500 }}>
                        <Descriptions.Item label="Files to Convert"><Tag color="blue">{fileList.length} files</Tag></Descriptions.Item>
                        <Descriptions.Item label="Total Size">{formatSize(totalSize)}</Descriptions.Item>
                        <Descriptions.Item label="Output Format"><Tag color="green">{(data.type || 'JPG').toUpperCase()}</Tag></Descriptions.Item>
                        <Descriptions.Item label="Quality">{data.quality || 80}%</Descriptions.Item>
                        <Descriptions.Item label="Estimated Output"><span style={{ color: '#3fb950' }}>~{formatSize(estimatedSize)}</span></Descriptions.Item>
                        <Descriptions.Item label="Est. Savings"><span style={{ color: '#3fb950' }}>~{estimatedSavings}%</span></Descriptions.Item>
                        <Descriptions.Item label="Save Method"><Tag color="purple">{outputMode === 'zip' ? 'ZIP Archive' : 'Folder'}</Tag></Descriptions.Item>
                        {outputMode === 'folder' && <Descriptions.Item label="Output Folder" span={2}><Text style={{ color: '#58a6ff' }} ellipsis={{ tooltip: outputFolder }}>{outputFolder || 'Not selected'}</Text></Descriptions.Item>}
                    </Descriptions>
                    <Divider style={{ borderColor: '#30363d', margin: '16px 0' }} />
                    <div style={{ background: 'rgba(88, 166, 255, 0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(88, 166, 255, 0.2)' }}>
                        <Text style={{ color: '#8b949e' }}><InfoCircleOutlined style={{ marginRight: 8, color: '#58a6ff' }} />Advanced Settings:</Text>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {data.mozjpeg && <Tag>MozJPEG</Tag>}
                            {data.progressive && <Tag>Progressive</Tag>}
                            {data.preserveMetadata && <Tag>Keep Metadata</Tag>}
                            {data.sharpen && <Tag>Sharpen</Tag>}
                            {data.grayscale && <Tag>Grayscale</Tag>}
                            {data.normalize && <Tag>Normalize</Tag>}
                            {data.losscomp && <Tag>Lossless</Tag>}
                            {(data.width || data.height) && !data.dimensions && <Tag>Resize: {data.width || 'auto'}x{data.height || 'auto'}</Tag>}
                            {!data.mozjpeg && !data.progressive && !data.preserveMetadata && !data.sharpen && !data.grayscale && !data.normalize && !data.losscomp && data.dimensions && <Tag color="default">Default Settings</Tag>}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Conversion;
