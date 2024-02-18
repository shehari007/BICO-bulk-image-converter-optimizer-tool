import React from 'react'
import { Layout } from 'antd'
const { ipcRenderer } = window.require('electron');
const Footer = () => {

    const { Footer } = Layout;
    const urlToOpenProf = `https://github.com/shehari007`
    const handleLinkClick = (type) => {
        ipcRenderer.send('open-external-link', urlToOpenProf)
    };
    return (
        <Footer
            className='footer'
            style={{
                textAlign: 'center',
                background: 'white',
            }}
        >
            BICO - Bulk Image Converter & Optimizer x64 v1.5.0<br/>Made With ❤ By <a href='##' onClick={handleLinkClick}>Muhammad Sheharyar Butt</a>
        </Footer>
    )
}

export default Footer
