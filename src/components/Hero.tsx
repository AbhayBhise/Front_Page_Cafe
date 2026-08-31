import { useEffect, useRef } from 'react';
import Typed from 'typed.js';

const Hero = () => {
  const el = useRef(null);
  
  useEffect(() => {
    const typed = new Typed(el.current, {
      strings: [
        'WELCOME TO FRONT PAGE CAFE', 
        'Everything Starts With A Coffee.', 
        'Given Enough Coffee Everything Is Possible.', 
        "Is Everything Okay? 'Yes' Have A Coffee, 'No' Have A Coffee.", 
        'Meet, Eat, Drink, Have Fun!'
      ],
      typeSpeed: 90,
    });
    
    return () => {
      typed.destroy();
    };
  }, []);

  return (
    <>
      <div className="d-flex justify-content-center fs-4 mb-0 pb-2">
        <span ref={el}></span>
      </div>
      <hr />
      <div id="carouselExampleRide" className="carousel slide position-relative container" data-bs-ride="true">
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src="https://images.unsplash.com/photo-1574126154517-d1e0d89ef734?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxleHBsb3JlLWZlZWR8M3x8fGVufDB8fHw=&w=1000&q=80" className="rounded object-fit-cover d-block w-100" alt="..." />
          </div>
          <div className="carousel-item">
            <img src="https://assets.digitalcontent.marksandspencer.app/image/upload/w_2560,q_auto,c_fill,f_auto/07324a12a68d27df3fb75e6a24ea400d.jpg" className="rounded object-fit-cover d-block w-100" alt="..." />
          </div>
          <div className="carousel-item">
            <img src="https://wallpaperaccess.com/full/1312729.jpg" className="rounded object-fit-cover d-block w-100" alt="..." />
          </div>
          <div className="carousel-item">
            <img src="https://wallpapers.com/images/hd/thick-cut-french-fries-dm3dmwxhcfh5olhy.jpg" className="rounded object-fit-cover d-block w-100" alt="..." />
          </div>                
          <div className="carousel-item">
            <img src="https://images.alphacoders.com/877/877421.jpg" className="rounded object-fit-cover d-block w-100" alt="..." />
          </div>
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleRide" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleRide" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
        </button>
      </div>
      <hr />
    </>
  );
};

export default Hero;
