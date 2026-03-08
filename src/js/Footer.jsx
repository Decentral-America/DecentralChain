const _socialLinks = [
  {
    id: 'github',
    url: 'https://github.com/Decentral-America/',
  },
  {
    id: 'twitter',
    url: '',
  },
  {
    id: 'facebook',
    url: '',
  },
  {
    id: 'discord',
    url: '',
  },
  {
    id: 'telegram',
    url: '',
  },
  {
    id: 'reddit',
    url: '',
  },
];

const Footer = ({ version }) => {
  return (
    <div className="menu-footer">
      <div>Version: {version}</div>
      <div>
        <a className="fade" href="https://decentralamerica.com/" target="_blank" rel="noopener">
          decentralamerica.com
        </a>
      </div>
    </div>
  );
};

export default Footer;
