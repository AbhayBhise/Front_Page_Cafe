import React from 'react';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  return (
    <div className="container py-5 mt-5" style={{ minHeight: '70vh' }}>
      <div className="row justify-content-center">
        <div className="col-lg-8 text-center">
          <motion.img 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            src="/logo.png" 
            alt="Front Page Cafe Logo" 
            className="img-fluid mb-4"
            style={{ maxWidth: '200px' }}
          />
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="fw-bold mb-4"
          >
            About Front Page Cafe
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="card shadow-sm border-0 rounded-4 text-start p-4 p-md-5 mb-5"
          >
            <p className="fs-5 mb-4" style={{ lineHeight: '1.8' }}>
              Welcome to <strong>Front Page Cafe</strong>, your neighborhood spot for the finest coffee, mouth-watering pizzas, and hearty burgers. 
              We believe that great food brings people together, and our mission is to create a welcoming atmosphere where every meal feels like a 
              headline story.
            </p>
            
            <p className="fs-5 mb-4" style={{ lineHeight: '1.8' }}>
              Our ingredients are locally sourced, and our recipes are crafted with passion. Whether you're dropping by for a quick latte before work or 
              settling in for a weekend brunch with friends, we are dedicated to providing an unforgettable experience.
            </p>

            <h4 className="fw-bold mt-5 mb-3 text-secondary border-bottom pb-2">Our Origins</h4>
            <p className="fs-6 text-muted" style={{ lineHeight: '1.6' }}>
              Founded in 2023, Front Page Cafe started as a small coffee cart in the city center. Thanks to our loyal community, we expanded into 
              this beautiful location to serve not just drinks, but a full culinary experience.
            </p>
          </motion.div>

          {/* Contact Info */}
          <div className="row g-4 text-start">
            <div className="col-md-4">
              <div className="card h-100 border-0 bg-light p-3 text-center rounded-3">
                <i className="bi bi-geo-alt fs-1 text-primary mb-2"></i>
                <h5 className="fw-bold">Location</h5>
                <p className="text-muted mb-0">123 Cafe Street<br/>Foodville, FV 10012</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 bg-light p-3 text-center rounded-3">
                <i className="bi bi-envelope fs-1 text-primary mb-2"></i>
                <h5 className="fw-bold">Contact</h5>
                <p className="text-muted mb-0">hello@frontpagecafe.com<br/>+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 bg-light p-3 text-center rounded-3">
                <i className="bi bi-clock fs-1 text-primary mb-2"></i>
                <h5 className="fw-bold">Hours</h5>
                <p className="text-muted mb-0">Mon-Sun: 8am - 10pm<br/>Delivery available</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;
