// src/components/Sidebar.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import companyLoge from "../data/images/mtn_logo_large.png";

const Sidebar = () => {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Navigation items
  const navItems = [
    { name: "Objective", path: "/objective" },
    // { name: "State Level Crop Calendar", path: "/crop-calendar" },
    // { name: "State Comparisons", path: "/state-comparisons" },
    { name: "State Level Crop Calendar", path: "/state-comparisons" },
    { name: "About MTN", path: "/about" },
  ];

  const isActive = (itemPath) => {
    if (itemPath === pathname) return true;
    if (itemPath === "/crop-calendar" && pathname.startsWith("/crop-calendar/"))
      return true;
    return false;
  };

  return (
    <div className="min-h-screen w-72 bg-mtn-green-800 text-white">
      <div className="p-4 flex justify-center">
        <Link href="/">
          <div className="relative h-32 w-32">
            <Image
              src={companyLoge}
              alt="MTN Earth Logo"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </Link>
      </div>

      <nav className="mt-6">
        <ul>
          {navItems.map((item) => {
            const active = isActive(item.path);
            const isHovered = hoveredItem === item.name;

            return (
              <li key={item.name}>
                {/* Navigation item with orange bar */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Orange indicator bar - only spans the navigation text */}
                  {(active || isHovered) && (
                    <div className="absolute left-0 top-0 w-2 h-full bg-orange-500 rounded-l-sm"></div>
                  )}

                  <Link
                    href={item.path}
                    className={`block py-4 pl-8 ${active ? "bg-mtn-green-900 rounded-r-sm" : isHovered ? "bg-mtn-green-700 rounded-r-sm" : ""}`}
                  >
                    {item.name}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
