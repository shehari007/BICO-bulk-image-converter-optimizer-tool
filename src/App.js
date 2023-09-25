import { useState } from 'react';
import './App.css';
import Conversion from './Components/ConversionModule/Conversion';
import { Layout } from 'antd';
import {  Form, Input, Select } from 'antd';
const { Footer, Sider, Content } = Layout;

function App() {

  const [formData, setFormData] = useState({
    quality: 80,
    type: "jpg",
    width: 500,
    height: 500,
    orientation: null,
  });

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    
  };

  const [form] = Form.useForm();
  return (

    <Layout hasSider>

      <Sider
        className='custom-sider'
        theme='light'
        style={{
          overflow: 'auto',
          height: '100%',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="demo-logo-vertical" align="center" ><img style={{ marginBottom: '10px', marginTop: '20px' }} align="center" src='logo192.png' height={80} width={90} alt='logo' /></div>
        <div style={{ maxHeight: '10%' }} >
          <Form
            style={{ marginLeft: '15px', marginRight: '15px' }}
            layout="vertical"
            form={form}
          >
            <Form.Item label="Set Quality:">
              <Input placeholder="0 - 100"
              value={formData.quality}
              type='number'
              onChange={(e) => handleInputChange("quality", e.target.value)} />
            </Form.Item>
            <Form.Item label="Set Type:">
              <Select
                defaultValue="jpg"
              onChange={(e) => handleInputChange("type", e)}
                options={[
                  {
                    value: 'jpg',
                    label: 'jpg',
                  },
                  {
                    value: 'png',
                    label: 'png',
                  },
                  {
                    value: 'gif',
                    label: 'gif',
                  },
                  {
                    value: 'webp',
                    label: 'webp',
                  }
                ]}
              />
            </Form.Item>
            <Form.Item label="Set Height:">
              <Input placeholder="input placeholder"
              value={formData.height}
              type='number'
              onChange={(e) => handleInputChange("height", e.target.value)} />
            </Form.Item>
            <Form.Item label="Set Width:">
              <Input placeholder="input placeholder"
              value={formData.width}
              type='number'
              onChange={(e) => handleInputChange("width", e.target.value)} />
            </Form.Item>
            <Form.Item label="Set Orientation:">
            <Select
                defaultValue="0°"
                
              onChange={(e) => handleInputChange("orientation", e)}
                options={[
                  {
                    value: 90,
                    label: '90°',
                  },
                  {
                    value: 180,
                    label: '180', 
                  },
                  {
                    value: 360,
                    label: '360°',
                  },
                 
                ]}
              />
            </Form.Item>
          </Form>
        </div>
      </Sider>
      <Layout
        className="site-layout"
        style={{
          marginLeft: 200,
          // background: 'white',

        }}
      >
        {/* <Header
       style={{
         position: 'fixed',
         padding: 0,
         background: 'black',
       }}
     /> */}
        <Content
          style={{
            margin: '24px 16px 0',
            overflow: 'initial',
            justifyContent: 'center',

          }}
        ><div >
            <Conversion data={formData} />
          </div>
        </Content>
        <Footer
          className='footer'
          style={{
            textAlign: 'center',
          }}
        >
          v0.1.8 SYSPeek - System Information Viewer {new Date().getFullYear()} Made With ❤ By Muhammad Sheharyar Butt
        </Footer>
      </Layout>
    </Layout>
  );
}

export default App;
