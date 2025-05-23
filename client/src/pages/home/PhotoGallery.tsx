import { ArrowRight } from "lucide-react";

export default function PhotoGallery() {
  const images = [
    {
      src: "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=500",
      alt: "Lisbon tram"
    },
    {
      src: "https://pixabay.com/get/gfeffb151ccbee955a3e8da15ecc36e76d914e514eda1aa79568eedf06848837d030c8ccb9ea1b05d2d7deb1c05b2236be77eb1e890d52b591f6176df0663f860_1280.jpg",
      alt: "Lisbon rooftops"
    },
    {
      src: "https://pixabay.com/get/g12519647fb3ffe6179b7776c2ca187536c9ff68fd23885ea0fb29d333f7e60b197fce92c497c511e1ba8f3be4e7aab887d861ac58f96229cb8af260711b6a1c8_1280.jpg",
      alt: "Portuguese tiles"
    },
    {
      src: "https://images.unsplash.com/photo-1536663815808-535e2280d2c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=500",
      alt: "25 de Abril Bridge at sunset"
    },
    {
      src: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=500",
      alt: "Tour group in Lisbon",
      hideOnMobile: true
    },
    {
      src: "https://pixabay.com/get/ged6bb74988de94c394c4227bb3cb1781d86296440eeaea5b302d849f2456ef321d08a20bdef8c5ffc37bc1a9b71c5eb325ea5e57ae0348876e4b3cdb460086de_1280.jpg",
      alt: "Pasteis de nata",
      hideOnMobile: true
    },
    {
      src: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=500",
      alt: "São Jorge Castle at night",
      hideOnLgDown: true
    },
    {
      src: "https://pixabay.com/get/g31f78e5cd21081de4aed3994f20f65781f3ff8849bd3d57dea50d7cd82f18184b115b054c46f3c055561885add09d17aeca60d75250c1f27a5e7c35f9cf0408f_1280.jpg",
      alt: "Tourists at Lisbon viewpoint",
      hideOnLgDown: true
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Discover Lisbon Through Our Lens</h2>
          <p className="text-lg text-neutral-dark/80 max-w-2xl mx-auto">
            Get inspired by the beauty and charm of Lisbon with these snapshots from our tours.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <img
              key={index}
              src={image.src}
              alt={image.alt}
              className={`w-full h-64 object-cover rounded-lg shadow-md hover:opacity-90 transition-all cursor-pointer 
                ${image.hideOnMobile ? 'hidden md:block' : ''} 
                ${image.hideOnLgDown ? 'hidden lg:block' : ''}`}
            />
          ))}
        </div>
        
        <div className="text-center mt-8">
          <a href="#gallery" className="inline-flex items-center justify-center text-primary font-semibold hover:underline">
            View Full Gallery <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
