import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  FlaskConical,
  ClipboardList,
  Menu,
  X,
  BarChart3,
  Settings,
  UserCog,
  Building2,
  LogOut,
} from "lucide-react";

import { useState } from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    title: "Hospital Operations",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/",
      },
      {
        name: "Patients",
        icon: Users,
        path: "/patients",
      },
      {
        name: "Appointments",
        icon: Calendar,
        path: "/appointments",
      },
    ],
  },

  {
    title: "Clinical",
    items: [
      {
        name: "Laboratory",
        icon: FlaskConical,
        path: "/laboratory",
      },
      {
        name: "Pharmacy",
        icon: Pill,
        path: "/pharmacy",
      },
    ],
  },

  {
    title: "Management",
    items: [
      {
        name: "Tasks",
        icon: ClipboardList,
        path: "/tasks",
      },
      {
        name: "Analytics",
        icon: BarChart3,
        path: "/analytics",
      },
    ],
  },

  {
    title: "Administration",
    items: [
      {
        name: "Users",
        icon: UserCog,
        path: "/users",
      },
      {
        name: "Departments",
        icon: Building2,
        path: "/departments",
      },
      {
        name: "Settings",
        icon: Settings,
        path: "/settings",
      },
    ],
  },
];

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}

      <button
        onClick={() => setOpen(true)}
        className="
          lg:hidden
          fixed
          top-4
          left-4
          z-50
          bg-sky-600
          text-white
          p-2
          rounded-lg
        "
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="
            fixed
            inset-0
            bg-black/40
            z-40
            lg:hidden
          "
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
        fixed lg:static
        top-0
        left-0
        z-50
        h-screen
        w-72
        bg-slate-900
        text-white
        flex
        flex-col
        transform
        transition-all
        duration-300
        ${
          open
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        {/* Header */}

        <div
          className="
          p-6
          border-b
          border-slate-700
          flex
          items-center
          justify-between
        "
        >
          <div>
            <h1 className="text-2xl font-bold text-sky-400">
              CareOS
            </h1>

            <p className="text-xs text-slate-400">
              Healthcare ERP
            </p>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>

        {/* Role Badge */}

        <div className="px-4 py-3">
          <div
            className="
            bg-sky-500/20
            text-sky-300
            rounded-xl
            p-3
            text-sm
            font-medium
          "
          >
            Logged in as Super Admin
          </div>
        </div>

        {/* Menu */}

        <div
          className="
          flex-1
          overflow-y-auto
          px-3
          pb-4
        "
        >
          {menuItems.map((group) => (
            <div key={group.title} className="mb-6">

              <p
                className="
                text-xs
                uppercase
                tracking-wider
                text-slate-500
                mb-3
                px-3
              "
              >
                {group.title}
              </p>

              <div className="space-y-1">

                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) =>
                        `
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        rounded-xl
                        transition-all
                        duration-200
                        ${
                          isActive
                            ? "bg-sky-600 text-white shadow-lg"
                            : "hover:bg-slate-800 hover:translate-x-1"
                        }
                      `
                      }
                    >
                      <Icon size={20} />

                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

        {/* Footer User Card */}

        <div
          className="
          border-t
          border-slate-700
          p-4
        "
        >
          <div
            className="
            flex
            items-center
            gap-3
            bg-slate-800
            p-3
            rounded-xl
          "
          >
            <div
              className="
              w-10
              h-10
              rounded-full
              bg-sky-600
              flex
              items-center
              justify-center
              font-bold
            "
            >
              H
            </div>

            <div className="flex-1">
              <p className="font-semibold text-sm">
                Het Limbani
              </p>

              <p className="text-xs text-slate-400">
                Super Admin
              </p>
            </div>

            <button
              className="
              p-2
              rounded-lg
              hover:bg-slate-700
              transition
            "
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;