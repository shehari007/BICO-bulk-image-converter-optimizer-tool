import React from 'react';
import { Alert, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const alertStyles = {
    alert: {
        marginBottom: 16,
        background: 'rgba(88, 166, 255, 0.08)',
        border: '1px solid rgba(88, 166, 255, 0.25)',
        borderRadius: 12,
    },
    list: {
        margin: 0,
        paddingLeft: 20,
        color: '#c9d1d9',
    },
    listItem: {
        marginBottom: 8,
    },
};

const Alerts = () => {
    return (
        <Alert
            message={<Text strong style={{ color: '#f0f6fc' }}>Informational Notes</Text>}
            closable
            icon={<InfoCircleOutlined style={{ color: '#58a6ff' }} />}
            style={alertStyles.alert}
            description={
                <ul style={alertStyles.list}>
                    <li style={alertStyles.listItem}>
                        <Text strong style={{ color: '#58a6ff' }}>About JPG:</Text>{' '}
                        <Text style={{ color: '#c9d1d9' }}>Select appropriate quality level when converting to JPG - it defines the final quality & size. </Text>
                        <Text strong style={{ color: '#f0883e' }}>Default is 80%</Text>
                        <Text style={{ color: '#8b949e' }}> ~Higher is better</Text>
                    </li>
                    <li style={alertStyles.listItem}>
                        <Text strong style={{ color: '#58a6ff' }}>About PNG:</Text>{' '}
                        <Text style={{ color: '#c9d1d9' }}>Select appropriate compression level when converting to PNG - it defines the final quality & size. </Text>
                        <Text strong style={{ color: '#f0883e' }}>Default is 8</Text>
                        <Text style={{ color: '#8b949e' }}> ~Lower is better</Text>
                    </li>
                    <li style={alertStyles.listItem}>
                        <Text strong style={{ color: '#58a6ff' }}>About GIF:</Text>{' '}
                        <Text style={{ color: '#c9d1d9' }}>Select animate option if your input file is animated - check </Text>
                        <Text strong style={{ color: '#3fb950' }}>ON</Text>
                        <Text style={{ color: '#c9d1d9' }}> for output to match the animated input file</Text>
                    </li>
                    <li style={alertStyles.listItem}>
                        <Text strong style={{ color: '#58a6ff' }}>ZIP FILE:</Text>{' '}
                        <Text style={{ color: '#c9d1d9' }}>After converting, a ZIP file with converted files is generated and a save dialog will appear.</Text>
                    </li>
                </ul>
            }
            type="info"
            showIcon
        />
    );
};

export default Alerts;
