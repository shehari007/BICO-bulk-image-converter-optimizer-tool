import React from 'react'
import { Alert } from 'antd';
const Alerts = () => {
    return (
        <><Alert
            message="Informational Notes"
            description={<>
                <ul>
                    <li><b>About JPG: </b>Select appropriate quality level when converting to jpg it defines the final quality & size of pictures. <b>Default is 80%</b>  ~Higher is better
                    </li>
                    <li><b>About PNG: </b>Select appropriate Compression level when converting to PNG it defines the final quality & size of pictures. <b>Default is 8</b> ~Lower is better
                    </li>
                    <li>
                        <b>About GIF: </b>Select animate option if your input file is animated check <b>ON</b> for output to be the animated same as input file
                    </li>
                    <li><b>ZIP FILE: </b>After converting a Zip file with converted files is generated and Save dialogue will appear.</li>
                </ul>
            </>}
            type="info"
            showIcon />
                </>
    )
}

export default Alerts
