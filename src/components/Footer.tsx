import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer mt-3 d-flex align-items-center" style={{ height: '300px' }}>
      <div className="container container-fluid d-flex justify-content-center">
        <div className="navbar-expand-lg text-center">
          <p>Copyright &copy; FrontPageCafe.com</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
