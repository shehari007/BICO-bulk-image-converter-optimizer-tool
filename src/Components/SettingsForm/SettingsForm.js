import React, { useState, useCallback } from 'react';
import { 
    Form, Input, Select, Radio, Slider, Collapse, 
    Tooltip, InputNumber, Switch, Button, Space, Divider 
} from 'antd';
import { 
    SettingOutlined, CompressOutlined, 
    ExpandOutlined, BgColorsOutlined, ThunderboltOutlined,
    InfoCircleOutlined, FileImageOutlined
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Option } = Select;

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
        dimensions: true,
        // Advanced options
        sharpen: false,
        sharpenAmount: 1,
        blur: false,
        blurAmount: 0.5,
        flip: false,
        flop: false,
        normalize: false,
        gamma: false,
        gammaValue: 2.2,
        preserveMetadata: false,
        autoRename: true,
        suffix: '_converted',
        concurrency: 4,
    });

    const handleInputChange = useCallback((name, value) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            changeHandler(newData);
            return newData;
        });
    }, [changeHandler]);

    const applyPreset = useCallback((preset) => {
        let presetData = {};
        switch (preset) {
            case 'web':
                presetData = {
                    type: 'webp',
                    quality: 85,
                    mozjpeg: false,
                    progressive: true,
                    dimensions: true,
                    losscomp: false,
                };
                break;
            case 'print':
                presetData = {
                    type: 'tiff',
                    quality: 100,
                    compType: 'lzw',
                    dimensions: true,
                    preserveMetadata: true,
                };
                break;
            case 'social':
                presetData = {
                    type: 'jpg',
                    quality: 90,
                    mozjpeg: true,
                    progressive: true,
                    dimensions: true,
                };
                break;
            case 'compress':
                presetData = {
                    type: 'webp',
                    quality: 70,
                    losscomp: false,
                    dimensions: true,
                };
                break;
            default:
                return;
        }
        setFormData(prev => {
            const newData = { ...prev, ...presetData };
            changeHandler(newData);
            return newData;
        });
    }, [changeHandler]);

    const [form] = Form.useForm();

    const formatOptions = [
        { value: 'jpg', label: 'JPEG', desc: 'Best for photos' },
        { value: 'png', label: 'PNG', desc: 'Lossless, transparent' },
        { value: 'webp', label: 'WebP', desc: 'Modern, efficient' },
        { value: 'avif', label: 'AVIF', desc: 'Next-gen, smallest' },
        { value: 'gif', label: 'GIF', desc: 'Animated images' },
        { value: 'tiff', label: 'TIFF', desc: 'Print quality' },
        { value: 'heif', label: 'HEIF', desc: 'Apple format' },
    ];

    return (
        <div className="settings-form">
            {/* Quick Presets */}
            <div className="settings-section">
                <ThunderboltOutlined style={{ marginRight: 6 }} />
                Quick Presets
            </div>
            <div className="preset-buttons">
                <Tooltip title="Optimized for web: WebP, 85% quality">
                    <Button size="small" className="preset-btn" onClick={() => applyPreset('web')}>
                        Web
                    </Button>
                </Tooltip>
                <Tooltip title="Social media: JPEG, 90% quality, MozJPEG">
                    <Button size="small" className="preset-btn" onClick={() => applyPreset('social')}>
                        Social
                    </Button>
                </Tooltip>
                <Tooltip title="Print: TIFF, lossless">
                    <Button size="small" className="preset-btn" onClick={() => applyPreset('print')}>
                        Print
                    </Button>
                </Tooltip>
                <Tooltip title="Maximum compression">
                    <Button size="small" className="preset-btn" onClick={() => applyPreset('compress')}>
                        Compress
                    </Button>
                </Tooltip>
            </div>

            <Form
                layout="vertical"
                form={form}
                size="small"
            >
                <Collapse 
                    defaultActiveKey={['format']} 
                    ghost
                    expandIconPosition="end"
                    accordion
                >
                    {/* Format Section */}
                    <Panel 
                        header={<><FileImageOutlined /> Output Format</>} 
                        key="format"
                    >
                        <Form.Item label="Format">
                            <Select
                                value={formData.type}
                                onChange={(e) => handleInputChange("type", e)}
                                optionLabelProp="label"
                            >
                                {formatOptions.map(opt => (
                                    <Option key={opt.value} value={opt.value} label={opt.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{opt.label}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                                                {opt.desc}
                                            </span>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {formData.type === 'jpg' && (
                            <>
                                <Form.Item label={
                                    <Space>
                                        MozJPEG Encoder
                                        <Tooltip title="Better compression with same quality">
                                            <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />
                                        </Tooltip>
                                    </Space>
                                }>
                                    <Switch 
                                        checked={formData.mozjpeg}
                                        onChange={(e) => handleInputChange("mozjpeg", e)}
                                        checkedChildren="On" 
                                        unCheckedChildren="Off"
                                    />
                                </Form.Item>
                                <Form.Item label="Progressive Scan">
                                    <Switch 
                                        checked={formData.progressive}
                                        onChange={(e) => handleInputChange("progressive", e)}
                                        checkedChildren="On" 
                                        unCheckedChildren="Off"
                                    />
                                </Form.Item>
                            </>
                        )}

                        {formData.type === 'png' && (
                            <Form.Item label="Progressive">
                                <Switch 
                                    checked={formData.progressive}
                                    onChange={(e) => handleInputChange("progressive", e)}
                                    checkedChildren="On" 
                                    unCheckedChildren="Off"
                                />
                            </Form.Item>
                        )}

                        {formData.type === 'tiff' && (
                            <Form.Item label="Compression Type">
                                <Select
                                    value={formData.compType}
                                    onChange={(e) => handleInputChange("compType", e)}
                                >
                                    <Option value="none">None</Option>
                                    <Option value="jpeg">JPEG</Option>
                                    <Option value="deflate">Deflate</Option>
                                    <Option value="packbits">Packbits</Option>
                                    <Option value="lzw">LZW</Option>
                                    <Option value="webp">WebP</Option>
                                    <Option value="jp2k">JP2K</Option>
                                </Select>
                            </Form.Item>
                        )}

                        {(formData.type === 'gif' || formData.type === 'webp') && (
                            <Form.Item label="Animation Support">
                                <Switch 
                                    checked={formData.animate}
                                    onChange={(e) => handleInputChange("animate", e)}
                                    checkedChildren="On" 
                                    unCheckedChildren="Off"
                                />
                            </Form.Item>
                        )}

                        {(formData.type === 'avif' || formData.type === 'webp') && (
                            <Form.Item label={
                                <Space>
                                    Lossless
                                    <Tooltip title="No quality loss, larger file size">
                                        <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />
                                    </Tooltip>
                                </Space>
                            }>
                                <Switch 
                                    checked={formData.losscomp}
                                    onChange={(e) => handleInputChange("losscomp", e)}
                                    checkedChildren="On" 
                                    unCheckedChildren="Off"
                                />
                            </Form.Item>
                        )}
                    </Panel>

                    {/* Quality Section */}
                    <Panel 
                        header={<><CompressOutlined /> Quality & Compression</>} 
                        key="quality"
                    >
                        {formData.type === 'png' ? (
                            <Form.Item 
                                label={
                                    <Space>
                                        Compression Level
                                        <Tooltip title="0-9, lower = less compression, faster">
                                            <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />
                                        </Tooltip>
                                    </Space>
                                }
                            >
                                <Slider
                                    min={0}
                                    max={9}
                                    value={formData.compression}
                                    onChange={(value) => handleInputChange("compression", value)}
                                    marks={{ 0: '0', 3: '3', 6: '6', 9: '9' }}
                                />
                            </Form.Item>
                        ) : (
                            <Form.Item 
                                label={
                                    <Space>
                                        Quality
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                                            {formData.quality}%
                                        </span>
                                    </Space>
                                }
                            >
                                <Slider
                                    min={1}
                                    max={100}
                                    value={formData.quality}
                                    onChange={(value) => handleInputChange("quality", value)}
                                    marks={{ 1: '1', 50: '50', 75: '75', 100: '100' }}
                                />
                            </Form.Item>
                        )}
                    </Panel>

                    {/* Dimensions Section */}
                    <Panel 
                        header={<><ExpandOutlined /> Dimensions</>} 
                        key="dimensions"
                    >
                        <Form.Item label="Resize Mode">
                            <Radio.Group 
                                value={formData.dimensions}
                                onChange={e => handleInputChange('dimensions', e.target.value)}
                            >
                                <Radio value={true}>Keep Original</Radio>
                                <Radio value={false}>Custom Size</Radio>
                            </Radio.Group>
                        </Form.Item>

                        {!formData.dimensions && (
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Form.Item label="Width (px)">
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={1}
                                        max={10000}
                                        placeholder="Width"
                                        value={formData.width}
                                        onChange={(value) => handleInputChange("width", value)}
                                    />
                                </Form.Item>
                                <Form.Item label="Height (px)">
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={1}
                                        max={10000}
                                        placeholder="Height"
                                        value={formData.height}
                                        onChange={(value) => handleInputChange("height", value)}
                                    />
                                </Form.Item>
                            </Space>
                        )}

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                        <Form.Item label="Rotation">
                            <Select
                                value={formData.orientation || 0}
                                onChange={(e) => handleInputChange("orientation", e)}
                            >
                                <Option value={0}>No Rotation</Option>
                                <Option value={90}>90° Clockwise</Option>
                                <Option value={180}>180°</Option>
                                <Option value={270}>270° Clockwise</Option>
                            </Select>
                        </Form.Item>

                        <Space>
                            <Form.Item>
                                <Tooltip title="Flip vertically">
                                    <Switch 
                                        checked={formData.flip}
                                        onChange={(e) => handleInputChange("flip", e)}
                                        checkedChildren="Flip V" 
                                        unCheckedChildren="Flip V"
                                    />
                                </Tooltip>
                            </Form.Item>
                            <Form.Item>
                                <Tooltip title="Flip horizontally">
                                    <Switch 
                                        checked={formData.flop}
                                        onChange={(e) => handleInputChange("flop", e)}
                                        checkedChildren="Flip H" 
                                        unCheckedChildren="Flip H"
                                    />
                                </Tooltip>
                            </Form.Item>
                        </Space>
                    </Panel>

                    {/* Effects Section */}
                    <Panel 
                        header={<><BgColorsOutlined /> Effects & Filters</>} 
                        key="effects"
                    >
                        <Form.Item label="Grayscale">
                            <Switch 
                                checked={formData.grayscale}
                                onChange={(e) => handleInputChange("grayscale", e)}
                                checkedChildren="On" 
                                unCheckedChildren="Off"
                            />
                        </Form.Item>

                        <Form.Item label="Normalize (Auto Contrast)">
                            <Switch 
                                checked={formData.normalize}
                                onChange={(e) => handleInputChange("normalize", e)}
                                checkedChildren="On" 
                                unCheckedChildren="Off"
                            />
                        </Form.Item>

                        <Form.Item label="Sharpen">
                            <Switch 
                                checked={formData.sharpen}
                                onChange={(e) => handleInputChange("sharpen", e)}
                                checkedChildren="On" 
                                unCheckedChildren="Off"
                            />
                        </Form.Item>
                        {formData.sharpen && (
                            <Form.Item label="Sharpen Amount">
                                <Slider
                                    min={0.5}
                                    max={5}
                                    step={0.1}
                                    value={formData.sharpenAmount}
                                    onChange={(value) => handleInputChange("sharpenAmount", value)}
                                />
                            </Form.Item>
                        )}

                        <Form.Item label="Blur">
                            <Switch 
                                checked={formData.blur}
                                onChange={(e) => handleInputChange("blur", e)}
                                checkedChildren="On" 
                                unCheckedChildren="Off"
                            />
                        </Form.Item>
                        {formData.blur && (
                            <Form.Item label="Blur Amount">
                                <Slider
                                    min={0.3}
                                    max={10}
                                    step={0.1}
                                    value={formData.blurAmount}
                                    onChange={(value) => handleInputChange("blurAmount", value)}
                                />
                            </Form.Item>
                        )}

                        <Form.Item label="Gamma Correction">
                            <Switch 
                                checked={formData.gamma}
                                onChange={(e) => handleInputChange("gamma", e)}
                                checkedChildren="On" 
                                unCheckedChildren="Off"
                            />
                        </Form.Item>
                        {formData.gamma && (
                            <Form.Item label="Gamma Value">
                                <Slider
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={formData.gammaValue}
                                    onChange={(value) => handleInputChange("gammaValue", value)}
                                />
                            </Form.Item>
                        )}
                    </Panel>

                    {/* Advanced Section */}
                    <Panel 
                        header={<><SettingOutlined /> Advanced Options</>} 
                        key="advanced"
                    >
                        <Form.Item label="Preserve Metadata">
                            <Switch 
                                checked={formData.preserveMetadata}
                                onChange={(e) => handleInputChange("preserveMetadata", e)}
                                checkedChildren="On" 
                                unCheckedChildren="Off"
                            />
                        </Form.Item>

                        <Form.Item label="Auto Rename Duplicates">
                            <Switch 
                                checked={formData.autoRename}
                                onChange={(e) => handleInputChange("autoRename", e)}
                                checkedChildren="On" 
                                unCheckedChildren="Off"
                            />
                        </Form.Item>

                        <Form.Item 
                            label={
                                <Space>
                                    Parallel Processing
                                    <Tooltip title="Number of images to process simultaneously">
                                        <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />
                                    </Tooltip>
                                </Space>
                            }
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={1}
                                max={16}
                                value={formData.concurrency}
                                onChange={(value) => handleInputChange("concurrency", value)}
                            />
                        </Form.Item>

                        <Form.Item label="File Name Suffix">
                            <Input
                                placeholder="_converted"
                                value={formData.suffix}
                                onChange={(e) => handleInputChange("suffix", e.target.value)}
                            />
                        </Form.Item>
                    </Panel>
                </Collapse>
            </Form>
        </div>
    );
};

export default SettingsForm;
