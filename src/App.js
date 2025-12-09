import { useState, useCallback } from 'react';
import './App.css';
import Conversion from './Components/Conversion/Conversion';
import { Layout, ConfigProvider, theme } from 'antd';
import { Avatar, Typography } from 'antd';
import SettingsForm from './Components/SettingsForm/SettingsForm';
import Footer from './Components/Footer/Footer';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

function App() {

  const [formData, setFormData] = useState({
    quality: 80,
    compression: 8,
    type: "jpg",
    width: undefined,
    height: undefined,
    mozjpeg: false,
    compType: 'none',
    progressive: false,
    orientation: null,
    animate: false,
    grayscale: false,
    losscomp: false,
    dimensions: true,
    // New options
    outputMode: 'zip', // 'zip' or 'folder'
    outputFolder: '',
    preserveMetadata: false,
    autoRename: true,
    suffix: '_converted',
    sharpen: false,
    sharpenAmount: 1,
    blur: false,
    blurAmount: 0,
    flip: false,
    flop: false,
    normalize: false,
    gamma: false,
    gammaValue: 2.2,
    tint: false,
    tintColor: '#ffffff',
    concurrency: 4,
  });

  const captureChangeHandler = useCallback((changeHandler) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      ...changeHandler
    }));
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#58a6ff',
          colorBgContainer: '#161b22',
          colorBgElevated: '#21262d',
          colorBorder: '#30363d',
          colorText: '#e6edf3',
          colorTextSecondary: '#8b949e',
          borderRadius: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
        },
        components: {
          Button: {
            controlHeight: 34,
            fontWeight: 500,
          },
          Card: {
            colorBgContainer: '#161b22',
          },
          Table: {
            colorBgContainer: '#161b22',
            headerBg: '#21262d',
          },
          Input: {
            colorBgContainer: '#21262d',
          },
          Select: {
            colorBgContainer: '#21262d',
          },
        },
      }}
    >
      <Layout hasSider>
        <Sider
          className='custom-sider'
          width={300}
        >
          <div className="logo-container">
            <Avatar 
              size={72} 
              src="logo.png" 
            />
            <Title level={4} style={{ margin: '12px 0 4px', color: '#e6edf3' }}>
              BICO
            </Title>
            <Text style={{ color: '#8b949e', fontSize: 12 }}>
              Bulk Image Converter & Optimizer
            </Text>
          </div>
          <SettingsForm changeHandler={captureChangeHandler} formData={formData} />
        </Sider>
        <Layout className="main-content">
          <Content className="content-wrapper">
            <Conversion data={formData} />
          </Content>
          <Footer />
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
