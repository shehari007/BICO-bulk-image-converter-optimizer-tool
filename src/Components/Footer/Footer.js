import React, { useEffect, useState } from 'react';
import { Layout, Space, Typography, Tooltip } from 'antd';
import { HeartFilled, GithubOutlined } from '@ant-design/icons';

const { ipcRenderer } = window.require('electron');
const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

const Footer = () => {
    const [appInfo, setAppInfo] = useState({ version: '2.0.0', arch: 'x64' });

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const info = await ipcRenderer.invoke('get-app-info');
                setAppInfo({
                    version: info?.version || '2.0.0',
                    arch: info?.arch || 'x64',
                });
            } catch (e) {
                // fallback already set
                console.warn('App info unavailable, using defaults');
            }
        };
        fetchInfo();
    }, []);

    const urlToOpenProf = `https://github.com/shehari007`;
    const urlToOpenRepo = `https://github.com/shehari007/BICO-bulk-image-converter-optimizer-tool`;

    const handleLinkClick = (url) => {
        ipcRenderer.send('open-external-link', url);
    };

    return (
        <AntFooter className='app-footer'>
            <div className="footer-content">
                <Space size="middle" wrap>
                    <Text style={{ color: '#8b949e' }}>
                        BICO - Bulk Image Converter & Optimizer
                    </Text>
                    <span className="footer-version">v{appInfo.version} ({appInfo.arch})</span>
                    <Text style={{ color: '#6e7681' }}>•</Text>
                    <Text style={{ color: '#8b949e' }}>
                        Made with <HeartFilled style={{ color: '#f85149' }} /> by{' '}
                        <Link 
                            className="footer-link"
                            onClick={() => handleLinkClick(urlToOpenProf)}
                        >
                            Muhammad Sheharyar Butt
                        </Link>
                    </Text>
                    <Text style={{ color: '#6e7681' }}>•</Text>
                    <Tooltip title="View on GitHub">
                        <Link 
                            className="footer-link"
                            onClick={() => handleLinkClick(urlToOpenRepo)}
                        >
                            <GithubOutlined /> GitHub
                        </Link>
                    </Tooltip>
                </Space>
            </div>
        </AntFooter>
    );
};

export default Footer;

