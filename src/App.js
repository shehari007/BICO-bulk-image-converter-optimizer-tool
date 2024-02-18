import { useState } from 'react';
import './App.css';
// import Conversion from './Components/ConversionModule/Conversion';
import Conversion from './Components/Conversion/Conversion';
import { Layout } from 'antd';
import { Avatar } from 'antd';
import SettingsForm from './Components/SettingsForm/SettingsForm';
import Footer from './Components/Footer/Footer';
const { Sider, Content } = Layout;

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
    dimensions: true
  });

  const captureChangeHandler = (changeHandler) => {
   
    setFormData(prevFormData => ({
      ...prevFormData,
      ...changeHandler
    }));
  }

  return (

    <Layout hasSider>

      <Sider
        className='custom-sider'
        theme='light'
      >
        <div className="demo-logo-vertical" align="center" >
          <Avatar size={100} src="logo.png" style={{ marginTop: '15px', marginBottom: '15px' }} />
        </div>
        <SettingsForm changeHandler={captureChangeHandler}/>
      </Sider>
      <Layout
        className="site-layout"
        style={{
        
           background: 'white',

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
          <Footer/>
      </Layout>
    </Layout>
  );
}

export default App;
