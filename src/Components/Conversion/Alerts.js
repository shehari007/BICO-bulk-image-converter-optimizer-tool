import React, { useState } from 'react';
import { Alert, Typography, Space, Tag, Collapse } from 'antd';
import { 
    BulbOutlined, ThunderboltOutlined, 
    FileImageOutlined, SettingOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

const alertStyles = {
    alert: {
        marginBottom: 16,
        background: 'rgba(88, 166, 255, 0.08)',
        border: '1px solid rgba(88, 166, 255, 0.25)',
        borderRadius: 12,
    },
    collapse: {
        marginTop: 8,
        background: 'transparent',
    },
    list: {
        margin: 0,
        paddingLeft: 20,
        color: '#c9d1d9',
    },
    listItem: {
        marginBottom: 4,
    },
    panelHeader: {
        color: '#c9d1d9',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
};

const Alerts = () => {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <Alert
            className="info-alert"
            type="info"
            showIcon
            icon={<BulbOutlined style={{ color: '#58a6ff' }} />}
            closable
            onClose={() => setVisible(false)}
            style={alertStyles.alert}
            message={
                <Space>
                    <Text strong style={{ color: '#f0f6fc' }}>Quick Tips</Text>
                    <Tag color="blue">v2.0.0</Tag>
                </Space>
            }
            description={
                <Collapse 
                    ghost 
                    size="small" 
                    accordion={false}
                    style={alertStyles.collapse}
                >
                    <Panel 
                        header={
                            <span style={alertStyles.panelHeader}>
                                <FileImageOutlined style={{ color: '#58a6ff' }} />
                                <span>Format Guide</span>
                            </span>
                        } 
                        key="formats"
                    >
                        <ul style={alertStyles.list}>
                            <li style={alertStyles.listItem}>
                                <Text strong style={{ color: '#58a6ff' }}>WebP:</Text>{' '}
                                <Text style={{ color: '#c9d1d9' }}>Best for web - excellent compression with quality</Text>
                            </li>
                            <li style={alertStyles.listItem}>
                                <Text strong style={{ color: '#58a6ff' }}>AVIF:</Text>{' '}
                                <Text style={{ color: '#c9d1d9' }}>Next-gen format - smallest file sizes</Text>
                            </li>
                            <li style={alertStyles.listItem}>
                                <Text strong style={{ color: '#58a6ff' }}>JPEG:</Text>{' '}
                                <Text style={{ color: '#c9d1d9' }}>Universal - great for photos, enable MozJPEG for better compression</Text>
                            </li>
                            <li style={alertStyles.listItem}>
                                <Text strong style={{ color: '#58a6ff' }}>PNG:</Text>{' '}
                                <Text style={{ color: '#c9d1d9' }}>Lossless with transparency support</Text>
                            </li>
                            <li style={alertStyles.listItem}>
                                <Text strong style={{ color: '#58a6ff' }}>TIFF:</Text>{' '}
                                <Text style={{ color: '#c9d1d9' }}>Professional/print quality</Text>
                            </li>
                        </ul>
                    </Panel>
                    <Panel 
                        header={
                            <span style={alertStyles.panelHeader}>
                                <ThunderboltOutlined style={{ color: '#f0883e' }} />
                                <span>Performance Tips</span>
                            </span>
                        } 
                        key="performance"
                    >
                        <ul style={alertStyles.list}>
                            <li style={alertStyles.listItem}>
                                <Text style={{ color: '#c9d1d9' }}>Use </Text>
                                <Text code style={{ background: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff', border: 'none' }}>Quick Presets</Text>
                                <Text style={{ color: '#c9d1d9' }}> for common use cases</Text>
                            </li>
                            <li style={alertStyles.listItem}>
                                <Text style={{ color: '#c9d1d9' }}>Adjust </Text>
                                <Text code style={{ background: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff', border: 'none' }}>Parallel Processing</Text>
                                <Text style={{ color: '#c9d1d9' }}> in advanced settings for faster conversion</Text>
                            </li>
                            <li style={alertStyles.listItem}>
                                <Text style={{ color: '#c9d1d9' }}>Lower quality (70-80%) can reduce file size by 50%+ with minimal visual difference</Text>
                            </li>
                        </ul>
                    </Panel>
                    <Panel 
                        header={
                            <span style={alertStyles.panelHeader}>
                                <SettingOutlined style={{ color: '#3fb950' }} />
                                <span>Output Options</span>
                            </span>
                        } 
                        key="output"
                    >
                        <ul style={alertStyles.list}>
                            <li style={alertStyles.listItem}>
                                <Text strong style={{ color: '#58a6ff' }}>ZIP:</Text>{' '}
                                <Text style={{ color: '#c9d1d9' }}>Downloads all converted images in a single archive</Text>
                            </li>
                            <li style={alertStyles.listItem}>
                                <Text strong style={{ color: '#58a6ff' }}>Folder:</Text>{' '}
                                <Text style={{ color: '#c9d1d9' }}>Saves images directly to your selected folder</Text>
                            </li>
                            <li style={alertStyles.listItem}>
                                <Text style={{ color: '#c9d1d9' }}>Drag & drop files directly onto the application</Text>
                            </li>
                        </ul>
                    </Panel>
                </Collapse>
            }
        />
    );
};

export default Alerts;

