import React from 'react';

const socialLinks = [{
    id: 'github',
    url: ''
}, {
    id: 'twitter',
    url: ''
}, {
    id: 'facebook',
    url: ''
}, {
    id: 'discord',
    url: ''
}, {
    id: 'telegram',
    url: ''
}, {
    id: 'reddit',
    url: ''
}];

const Footer = ({version}) => {
    return (
        <div className="menu-footer">
            <div>Version: {version}</div>

            <div>
                <a className="fade" href="https://decentralamerica.com/" target="_blank">decentralamerica.com</a>
            </div>
        </div>
    );
}

export default Footer;
