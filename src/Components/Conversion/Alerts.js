import React from 'react'
import { Alert } from 'antd';
const Alerts = () => {
    return (
        <><Alert
            message="Informational Notes"
            closable
            closeIcon
            description={<>
                <ul>
                    <li><b>About JPG: </b>Change quality level when converting to jpg it defines the final quality & size of pictures. <b>Default is 80%</b>  ~Higher is better
                    </li>
                    <li><b>About PNG: </b>Change Compression level when converting to PNG it defines the final quality & size of pictures. <b>Default is 8</b> ~Lower is better
                    </li>
                    <li>
                        <b>About Animated Files: </b>Select Animation option <b>ON</b> for output to be the animated same as input file applies on both webp and gif filetypes
                    </li>
                    <li><b>Output Location: </b>After converting a Zip file with converted files is generated and Save dialogue will appear.</li>
                </ul>
            </>}
            type="info"
            showIcon />
                </>
    )
}

export default Alerts
