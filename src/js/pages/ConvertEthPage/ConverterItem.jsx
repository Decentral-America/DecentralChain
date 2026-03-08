import { useState } from 'react';

export function ConverterItem(props) {
  const [dccValue, setDccValue] = useState('');
  const [ethValue, setEthValue] = useState('');
  let _isLoading = false;

  const convertDcc = async () => {
    if (dccValue.length) {
      const val = await props.convertW2E(dccValue);
      setEthValue(val);
    }
  };

  const convertEth = async () => {
    if (ethValue.length) {
      if (Object.hasOwn(props.convertE2W(ethValue), 'then')) {
        _isLoading = true;
      }
      const val = await props.convertE2W(ethValue);
      setDccValue(val);
    }
  };

  const handleKeyPress = (e, handler) => {
    if (e.key === 'Enter') handler();
  };

  const handleConvert = () => {
    if (dccValue) convertDcc();
    if (ethValue) convertEth();
  };

  return (
    <div className="converter">
      <div className="converter-title">{props.title}</div>
      <div className="converter-wrapper">
        <div className="converter-input">
          <input
            className="converter-input-field"
            value={dccValue}
            onChange={(e) => setDccValue(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, convertDcc)}
          />
          <div className="converter-dcc-title">DCC</div>
        </div>
        <div className="converter-arrows" />
        <div className="converter-input">
          <input
            className="converter-input-field"
            value={ethValue}
            onChange={(e) => setEthValue(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, convertEth)}
          />
          <div className="converter-ethereum-title">ETHEREUM</div>
        </div>
        <button type="button" className="converter-button" onClick={handleConvert}>
          <div className="converter-button-icon" />
          Convert
        </button>
      </div>
    </div>
  );
}
