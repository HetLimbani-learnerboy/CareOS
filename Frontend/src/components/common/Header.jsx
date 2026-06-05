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

import CareOSLogo from "../../assets/CareOS-logo.png";

const Header = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

             <input
  type="text"
  placeholder="Search..."
  className="
  relative
    h-10
    w-64
    pl-20
    pr-6
    py-2.5
    rounded-xl
    border
    border-slate-300
    focus:outline-none
    focus:ring-2
    focus:ring-sky-500
    transition-colors
    hover:border-slate-400
  "
/>
              <Search
                size={20}
                className="
                  absolute
                  right-3
                  top-2.5
                  text-slate-450
                "
              />
            </div>

            <button
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
              <span className="whitespace-nowrap">Get Started</span>
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

              <input
                type="text"
                placeholder="Search..."
                className="
                  border
                  rounded-xl
                  px-4
                  py-3
                "
              />

              <button>
                Login
              </button>

              <button> Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
};

export default Header