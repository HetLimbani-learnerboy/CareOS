import Header from "../common/Header";
import HeroSection from "../common/HeroSection";
import FeaturesSection from "../common/FeatureSection";
import AboutSection from "../common/AboutSection";
import FAQSection from "../common/FAQSection";
import Footer from "../common/Footer";

const LandingPage = () => {
  return (
    <div className="w-full">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <FAQSection />
    </div>
  );
};

export default LandingPage;