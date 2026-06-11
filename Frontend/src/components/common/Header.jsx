import {
  Menu,
  Search,
  X,
  ChevronRight
} from "lucide-react";

import {
  useState,
  useEffect
} from "react";

import {
  motion,
  AnimatePresence
} from "framer-motion";

import { useNavigate } from "react-router-dom";

import CareOSLogo from "../../assets/CareOS-logo.png";

const Header = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, []);

  const navLinks = [
    {
      name: "Home",
      href: "#"
    },
    {
      name: "Features",
      href: "#features"
    },
    {
      name: "About",
      href: "#about"
    },
    {
      name: "FAQ",
      href: "#faq"
    }
  ];

  return (
    <header
      className={`
        sticky
        top-0
        z-50
    
      `}
    >
      <div className="w-full px-6 lg:px-12 bg-white/90 backdrop-blur-sm border-b border-slate-200/50">

        <div className="h-20 flex items-center justify-between">

          <motion.a
            href="#"
            className="
              flex
              items-center
              cursor-pointer
              animate-none
            "
          >
            <img
              src={CareOSLogo}
              alt="CareOS"
              className="h-20 w-auto"
            />

            <div>
              <h1
                className="
                  text-3xl
                  font-bold
                  leading-none
                "
              >
                CareOS
              </h1>

              <p
                className="
                  text-xs
                  text-slate-500
                  pt-1
                  border-t
                  border-slate-200
                  font-semibold
                  tracking-wider
                  mt-1
              

                "
              >
                HEALTHCARE ERP
              </p>
            </div>
          </motion.a>

          <nav
            className="
              hidden
              lg:flex
              items-center
              gap-12
            "
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="
                  relative
                  text-slate-700
                  font-semibold
                  hover:text-sky-600
                  transition                  
                  group
                "
              >
                {link.name}

                <span
                  className="
                    absolute
                    left-0
                    -bottom-1
                    h-[4px]
                    w-0
                    bg-sky-600
                    transition-all
                    duration-300
                    group-hover:w-full
                  "
                />
              </a>
            ))}
          </nav>


          <div
            className="
              hidden
              lg:flex
              items-center
              gap-5
            "
          >
            <div className="relative">
            </div>

            <button
              onClick={() => navigate('/login')}
              className="
    bg-transparent
    cursor-pointer
    font-semibold
  "
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => navigate('/getconsult')}
              className="
                cursor-pointer
                bg-sky-600
                text-white
                font-semibold
                py-2.5
                px-5
                rounded-xl
                flex
                items-center
                gap-2
                hover:bg-sky-700
                transition-colors
                getstarted-btn
  "
            >
              <span className="whitespace-nowrap">Request a Consultation</span>
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() =>
              setMobileMenu(!mobileMenu)
            }
            className="lg:hidden"
          >
            {mobileMenu ? (
              <X size={28} />
            ) : (
              <Menu size={28} />
            )}
          </button>

        </div>
      </div>

      {/* Mobile Menu */}

      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0
            }}
            animate={{
              opacity: 1,
              height: "auto"
            }}
            exit={{
              opacity: 0,
              height: 0
            }}
            className="
              lg:hidden
              bg-white
              border-t
              overflow-hidden
            "
          >
            <div
              className="
                flex
                flex-col
                p-5
                gap-4
              "
            >
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="
                    py-3
                    px-4
                    rounded-lg
                    hover:bg-sky-50
                  "
                >
                  {link.name}
                </a>
              ))}

              <button>
                Login
              </button>

              <button onClick={() => navigate('/getconsult')}> Request a Consultation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
};

export default Header