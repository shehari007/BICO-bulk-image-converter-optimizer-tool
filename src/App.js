import { useState } from 'react';
import './App.css';
import Conversion from './Components/ConversionModule/Conversion';
import { Layout } from 'antd';
import { Form, Input, Select, Radio, Avatar } from 'antd';
const { ipcRenderer } = window.require('electron');
const { Footer, Sider, Content } = Layout;

function App() {
  const urlToOpenProf = `https://github.com/shehari007`

  const [formData, setFormData] = useState({
    quality: 80,
    compression: 8,
    type: "jpg",
    width: 500,
    height: 500,
    orientation: null,
    animate: false,
    grayscale: false,
    losscomp: false
  });

  const handleLinkClick = (type) => { 
    ipcRenderer.send('open-external-link', urlToOpenProf)
  };

  const handleInputChange = (name, value) => {
    console.log(name, value);
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
        <div className="demo-logo-vertical" align="center" >
          <Avatar size={100} src="logo.png" style={{ marginTop: '15px', marginBottom: '15px' }} />
        </div>
        <div style={{ maxHeight: '10%' }} >
          <Form
            style={{ marginLeft: '15px', marginRight: '15px' }}
            layout="vertical"
            form={form}
          >
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
                  },
                  {
                    value: 'tiff',
                    label: 'tiff',
                  },
                  {
                    value: 'avif',
                    label: 'avif',
                  }
                ]}
              />
            </Form.Item>
            {formData.type === 'gif' ?
              <Form.Item label="Set Animation:">
                <Radio.Group name="radiogroup" onChange={e => handleInputChange('animate', e.target.value)} defaultValue={formData.animate}>
                  <Radio value={true}>On</Radio>
                  <Radio value={false}>Off</Radio>
                </Radio.Group>

              </Form.Item> : null}
              {formData.type === 'avif' ?
              <Form.Item label="Lossless Compression:">
                <Radio.Group name="radiogroup" onChange={e => handleInputChange('losscomp', e.target.value)} defaultValue={formData.losscomp}>
                  <Radio value={true}>On</Radio>
                  <Radio value={false}>Off</Radio>
                </Radio.Group>

              </Form.Item> : null}
            {formData.type === 'png' ?
              <Form.Item label="Set PNG Compression:">
                <Input placeholder="0 - 9"
                  value={formData.compression}
                  type='number'
                  onInput={(e) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 0 || value > 9) {
                      e.preventDefault();
                      return;
                    }
                    handleInputChange("compression", value);
                  }} />
              </Form.Item>
              :
              formData.type === 'jpg' || formData.type === 'tiff' || formData.type === 'webp' ?
                <Form.Item label="Set Quality:">
                  <Input placeholder="0 - 100"
                    value={formData.quality}
                    type='number'
                    max={100}
                    onInput={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value) || value < 0 || value > 100) {
                        e.preventDefault();
                        return;
                      }
                      handleInputChange("quality", value);
                    }} />
                </Form.Item> : null
            }
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
                defaultValue="Original"

                onChange={(e) => handleInputChange("orientation", e)}
                options={[
                  {
                    value: 0,
                    label: 'Original',
                  },
                  {
                    value: 90,
                    label: '90°',
                  },
                  {
                    value: 180,
                    label: '180°',
                  },
                  {
                    value: 360,
                    label: '360°',
                  },

                ]}
              />
            </Form.Item>
            <Form.Item label="Set Grayscale:">
              <Select
                defaultValue="Keep Original"

                onChange={(e) => handleInputChange("grayscale", e)}
                options={[
                  {
                    value: false,
                    label: 'Keep Original',
                  },
                  {
                    value: true,
                    label: 'Grayscale On',
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
        <Content
          style={{
            margin: '24px 16px 0',
            overflow: 'initial',
            //justifyContent: 'center',

          }}
        >
          <div>
            <Conversion data={formData} />
          </div>
        </Content>
        <Footer
          className='footer'
          style={{
            textAlign: 'center',
          }}
        >
          v0.1.5 BICO - Bulk Image Converter & Optimizer {new Date().getFullYear()} Made With ❤ By <a href='##' onClick={handleLinkClick}>Muhammad Sheharyar Butt</a>
        </Footer>
      </Layout>
    </Layout>
  );
}

export default App;
