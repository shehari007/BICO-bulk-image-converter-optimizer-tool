import React, { useState } from 'react';
import { Button, message } from 'antd';
import JSZip from 'jszip';
const sharp = window.require('sharp');

const Conversion = ({data}) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFileList(selectedFiles)
  };

  async function view() {
    if (fileList.length === 0) {
      message.error('Please select one or more files to convert.');
      return;
    }
  
    try {
        const processedImages = [];
        console.log(typeof(data.type))
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const fileBuffer = await file.arrayBuffer();

          const config = {
            jpg: { quality: 80 },
            webp: { quality: 80 },
            png: { compressionLevel: 1 },
          }
          const qualityConfig = config[data.type || 'jpg'];
          const pipeline = sharp(fileBuffer)
          .resize(data.height || data.width ? { width: parseInt(data.width), height: parseInt(data.height), fit: 'fill' } : undefined)
          .toFormat(data.type || 'jpg', qualityConfig)
       
           
          const processedImageBuffer = await pipeline.toBuffer();
          processedImages.push({ name: file.name, buffer: processedImageBuffer });
    
          setStatus(prevStatus => {
            const updatedStatus = [...prevStatus];
            updatedStatus[i] = 'Completed';
            return updatedStatus;
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
      message.success('Images converted and zipped successfully.');
    } catch (error) {
      console.error(error);
      message.error('Error while processing the images.');
      setUploading(false);
    }
  }
  
  

 

  return (
    <>
      <div align="center" style={{ margin: '20%' }}>
      <div align="center" style={{ margin: '20%' }}>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        <Button
          type="primary"
          onClick={view}
          disabled={fileList.length === 0}
          loading={uploading}
          style={{
            marginTop: 16,
          }}
        >
          {uploading ? 'Converting' : 'Start View'}
        </Button>
      </div>
        <Button
          type="primary"
          onClick={view}
          disabled={fileList.length === 0}
          loading={uploading}
          style={{
            marginTop: 16,
          }}
        >
          {uploading ? 'Converting' : 'Start Upload'}
        </Button>
      </div>
      <div align="center" style={{ margin: '20%' }}>
        <table>
            <thead>
                <tr>
                    <th>File name</th>
                    <th>Type</th>
                    <th>status</th>
                </tr>
            </thead>
            <tbody>
      {fileList.map((file, index) => (
        <tr key={index}>
          <td>{file.name}</td>
          <td>{file.type}</td>
          <td>{status.length===0?'Pending':status[index] }</td>
        </tr>
      ))}
    </tbody>
        </table>
      </div>
    </>
  );
};

export default Conversion;
