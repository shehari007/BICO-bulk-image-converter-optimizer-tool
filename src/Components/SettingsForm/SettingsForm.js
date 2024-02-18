import React, { useState } from 'react'
import { Form, Input, Select, Radio, Slider } from 'antd';


const SettingsForm = ({ changeHandler }) => {

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

    const handleInputChange = (name, value) => {
        // console.log(name, value);
        setFormData({
            ...formData,
            [name]: value,
        });

        changeHandler({
            ...formData,
            [name]: value,
        });

    };

    const [form] = Form.useForm();
    return (
        <div>
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
                {formData.type === 'jpg' ?

                    <Form.Item label="MozJPEG:">
                        <Select
                            defaultValue={false}
                            onChange={(e) => handleInputChange("mozjpeg", e)}
                            options={[
                                {
                                    value: true,
                                    label: 'Enabled',
                                },
                                {
                                    value: false,
                                    label: 'Disabled',
                                },
                            ]}
                        />
                    </Form.Item> : null
                }
                {formData.type === 'jpg' || formData.type === 'png' || formData.type === 'gif' ?

                    <Form.Item label="Progressive Scan:">
                        <Select
                            defaultValue={false}
                            onChange={(e) => handleInputChange("progressive", e)}
                            options={[
                                {
                                    value: true,
                                    label: 'Enabled',
                                },
                                {
                                    value: false,
                                    label: 'Disabled',
                                },
                            ]}
                        />
                    </Form.Item> : null
                }
                {formData.type === 'tiff' ?

                    <Form.Item label="Compression Type:">
                        <Select
                            defaultValue={'none'}
                            onChange={(e) => handleInputChange("compType", e)}
                            options={[
                                {
                                    value: 'none',
                                    label: 'None',
                                },
                                {
                                    value: 'jpeg',
                                    label: 'JPEG',
                                },
                                {
                                    value: 'deflate',
                                    label: 'Deflate',
                                },
                                {
                                    value: 'packbits',
                                    label: 'Packbits',
                                },
                                {
                                    value: 'lzw',
                                    label: 'LZW',
                                },
                                {
                                    value: 'webp',
                                    label: 'WEBP',
                                },
                                {
                                    value: 'jp2k',
                                    label: 'JP2K',
                                }
                            ]}
                        />
                    </Form.Item> : null
                }
                {formData.type === 'gif' || formData.type === 'webp' ?
                    <Form.Item label="Set Animation:">
                        <Radio.Group name="radiogroup" onChange={e => handleInputChange('animate', e.target.value)} defaultValue={formData.animate}>
                            <Radio value={true}>On</Radio>
                            <Radio value={false}>Off</Radio>
                        </Radio.Group>

                    </Form.Item> : null}
                {formData.type === 'avif' || formData.type === 'webp' ?
                    <Form.Item label="Lossless Compression:">
                        <Radio.Group name="radiogroup" onChange={e => handleInputChange('losscomp', e.target.value)} defaultValue={formData.losscomp}>
                            <Radio value={true}>On</Radio>
                            <Radio value={false}>Off</Radio>
                        </Radio.Group>

                    </Form.Item> : null}
                {formData.type === 'png' ?
                    <Form.Item label="Set PNG Compression:">
                        <Slider
                            max={9}
                            defaultValue={formData.compression}
                            onChange={(value) => handleInputChange("compression", value)}

                        />
                    </Form.Item>
                    :
                    formData.type === 'jpg' || formData.type === 'tiff' || formData.type === 'webp' ?
                        <Form.Item label="Set Quality:">
                            <Slider
                                max={100}
                                defaultValue={formData.quality}
                                onChange={(value) => handleInputChange("quality", value)}

                            />
                        </Form.Item> : null
                }
                <Form.Item label="Set Dimensions:">
                    <Radio.Group name="radiogroup" onChange={e => handleInputChange('dimensions', e.target.value)} defaultValue={formData.dimensions}>
                        <Radio value={true}>Keep Original</Radio>
                        <Radio value={false}>Custom</Radio>
                    </Radio.Group>

                </Form.Item>
                {!formData.dimensions ? <>
                    <Form.Item label="Set Height:">
                        <Input placeholder="input height"
                            value={formData.height}
                            type='number'
                            onChange={(e) => handleInputChange("height", e.target.value)} />
                    </Form.Item>
                    <Form.Item label="Set Width:">
                        <Input placeholder="input width"
                            value={formData.width}
                            type='number'
                            onChange={(e) => handleInputChange("width", e.target.value)} />
                    </Form.Item>
                </> : null}

                <Form.Item label="Set Orientation:">
                    <Select
                        defaultValue={0}

                        onChange={(e) => handleInputChange("orientation", e)}
                        options={[
                            {
                                value: 0,
                                label: 'Keep Original',
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
                        defaultValue={false}

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
    )
}

export default SettingsForm
