import {
  HeartPulse,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="w-full mx-auto px-4 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <HeartPulse
                className="text-sky-400"
                size={30}
              />
              <h3 className="text-2xl font-bold">
                CareOS
              </h3>

            </div>
            <p className="mt-4 text-slate-400">
              Enterprise Healthcare ERP &
              Hospital Operations Platform.
            </p>

          </div>

          <div>

            <h4 className="font-semibold text-lg mb-4">
              Product
            </h4>

            <ul className="space-y-2 text-slate-400">

              <li>Features</li>
              <li>Modules</li>
              <li>Security</li>
              <li>Analytics</li>

            </ul>

          </div>

          <div>

            <h4 className="font-semibold text-lg mb-4">
              Company
            </h4>

            <ul className="space-y-2 text-slate-400">

              <li>About Us</li>
              <li>Careers</li>
              <li>Contact</li>
              <li>FAQ</li>

            </ul>

          </div>

          <div>

            <h4 className="font-semibold text-lg mb-4">
              Contact
            </h4>

            <div className="space-y-3 text-slate-400">

              <div className="flex gap-2">
                <Mail size={18} />
                support@careos.com
              </div>

              <div className="flex gap-2">
                <Phone size={18} />
                +1 (555) 123-4567
              </div>

              <div className="flex gap-2">
                <MapPin size={18} />
                New York, USA
              </div>

            </div>

          </div>

        </div>

        <div
          className="
          mt-12
          pt-6
          border-t
          border-slate-700
          text-center
          text-slate-400
        "
        >
          © 2026 CareOS. All Rights Reserved.
        </div>

      </div>

    </footer>
  );
};

export default Footer;