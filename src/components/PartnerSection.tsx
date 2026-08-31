import { Link } from 'react-router-dom';

const PartnerSection = () => {
  return (
    <div className="container d-flex align-items-center justify-content-evenly justify-content-sm-between">
      <div className="card text-bg-dark text-center object-fit-cover mx-sm-1">
        <img src="https://foto.wuestenigel.com/wp-content/uploads/api/vase-with-flowers-in-a-cafe-colorful-blurry-background-.jpeg" className="card-img" alt="..." />
        <div className="card-img-overlay">
          <Link to="/signup" className="card-title fs-3 link-offset-2-hover text-white" style={{ textShadow: '0 0 5px black', textDecoration: 'none' }}>
            Partner With Us
          </Link>
          <p className="card-text"><small><i className="bi bi-buildings fs-2"></i></small></p>
        </div>
      </div>
      <div className="card text-bg-dark text-center object-fit-cover mx-sm-1">
        <img src="https://lh3.googleusercontent.com/zPbisGnkgfYb-rSUxy_dmoJEijW6QPIObeVcSrGJZDUWyX6mfN30Zk70gUddEyDpqhu13xOcM2Bx30cw0OqXzXhtxU4-sJd9bTebvagctWOrNAsUYT9uzOamcErTZAJQyoD-5sm23CNQPeRSE1bzn-vCffONmijingNoa7MdoabM_hs5A_bpNRKHg1lDeZeQNodxVtTOdpP0uR5RaVT8h-KpTzqOx8xfm-BMwkeJjKH-QDaGFwYx1uJXevELJJM-xUezI4MEXiaGrsm3CQf61OnIOJZwtFLmUax834VUkD_XIOCvPeq7qMLDq7yJruW5_jdVXiQmRFM5jwhpQYYr4S9C8jtM3nFT4D-QP1HqpqTZib6P5gJdRl-vv1eEDTJY-YiSeDA5O0kPyI2jE7CVxJ-5vZqd0p8Kl5cgCYf2v6nJYz03OUmywirPX3uiYtA4f5jm1VJyQbnCo8yip4MN5MSmwkMC9pB8o4v8o-pafEmbz8bz-7XAeKj7RmkPs5xrKlihfv70fQypPk93XP0EVbs6TBbSbO5ofgvRZK1vDDAyzJb6Cv11JlvkChrm2vdX9w-c3dw1gHBNI4kQuvMIAvbm6M2xbbCY9ewDlJjdbIklrtrmNo1aMsR1i_Rho0ZjHdMzxzgKphHCeVSDjmNV5_IDFCbI7pCVazillhyEovjmAtnHyOusMaYOkzHLXlp3GnDtGQyiWXdFeEeozaU=w509-h904-no?.jpg" className="card-img" alt="..." />
        <div className="card-img-overlay">
          <Link to="/about" className="card-title fs-3 link-offset-2-hover text-white" style={{ textShadow: '0 0 5px black', textDecoration: 'none' }}>
            Find Us Near You
          </Link>
          <p className="card-text"><small><i className="bi bi-geo-alt-fill fs-2"></i></small></p>
        </div>
      </div>
    </div>
  );
};

export default PartnerSection;
