import Header from "../components/common/Header";
import HeroSection from "../components/common/HeroSection";
import FeaturesSection from "../components/common/FeatureSection";
import AboutSection from "../components/common/AboutSection";
import FAQSection from "../components/common/FAQSection";
import Footer from "../components/common/Footer";

const LandingPage = () => {
  return (
    <div  className="w-full">
      <Header />
      <HeroSection />
    <FeaturesSection />
      <AboutSection />
      <FAQSection />
    </div>
  );
};

export default LandingPage;