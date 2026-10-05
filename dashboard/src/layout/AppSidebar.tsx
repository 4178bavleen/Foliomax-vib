import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ImBlogger } from "react-icons/im";
import { FaFilePdf } from "react-icons/fa";
import { IoDocumentText } from "react-icons/io5";
import { FaFileExcel } from "react-icons/fa6";
import { FaMoneyBill } from "react-icons/fa6";
// React Icons (Font Awesome)
import { // Dashboard
  // FaCreditCard, // Manage Plan
  // FaFolder, // Manage Category
  // FaBox, // Manage Product
  // FaShoppingCart, // Manage Order
  // FaList, // Forms
  // FaTable, // Tables
  // FaFileAlt, // Pages
  // FaChartPie, // Charts
  // FaCube, // UI Elements
  // FaPlug, // Authentication
  FaEllipsisH, // Dots icon for collapsed sidebar
  FaChevronDown, // Dropdown arrow
} from "react-icons/fa";
// import { RxDashboard } from "react-icons/rx";

import { FaVideo } from "react-icons/fa";
import { MdQuiz } from "react-icons/md";
import { BsFillGridFill } from "react-icons/bs";

import { FaQuestionCircle } from "react-icons/fa";
import { RiCustomerService2Fill } from "react-icons/ri";
import { MdOutlineContentPasteSearch } from "react-icons/md";
import { RiFundsFill } from "react-icons/ri";
type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  badge?: number;
};

type NavItem = {
  name?: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
  {
    icon: <BsFillGridFill />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <FaFileExcel/>,
    name: "Excel Upload",
    path: "/excel-upload",
  },
  {
    icon: <IoDocumentText/>,
    name: "Word Upload",
    path: "/word-upload",
  },
  {
    icon: <FaVideo/>,
    name: "Vedio Upload",
    path: "/video-upload",
  },
  {
    icon: <FaFilePdf/>,
    name: "PDF Upload",
    path: "/pdf-upload",
  },
  {
    icon: <MdQuiz/>,
    name: "Quiz",
    subItems: [{ name: "Add Company", path: "/add-company", pro: false },
      {name:"Add Quiz",path:"/add-quiz"},
      {name:"All Quizzes", path:"/all-quiz"}
    ],
  },
  {
    icon:<FaMoneyBill/>,
    name:"Subscription",
    subItems: [
      {name:"Subscription Plans",path:"/subscriptions"},
      {name:"PDF Upload", path:"/subs-pdf-upload"},
      {name:"Excel Upload", path:"/excel-upload"}
    ],
   
  },
  {
    icon: <ImBlogger />,
    name: "Blog",
    subItems: [{ name: "Add Category", path: "/add-blog-category", pro: false },
      {name:"Add Blog",path:"/add-blog"},
      {name:"All Blog", path:"/all-blog"}
    ],
  },
   {
    icon: <RiFundsFill />,
    name: "ETF & Mutual Fund ",
    subItems: [{ name: "Add Category", path: "/add-insights-category", pro: false },
      {name:"Add Insights",path:"/add-insights"},
      {name:"All Insights", path:"/all-insights"}
    ],
  },
  {
    icon: <FaQuestionCircle />,
    name: "FAQ",
    path: "/add-faq",
  },
   {
    icon: <MdOutlineContentPasteSearch />,
    name: "Site Content",
    path: "/site-content",
  },
  {
    icon: <RiCustomerService2Fill />,
    name: "Customer Message",
    path: "/customer-message",
  },
  // {
  //   icon: <FaShoppingCart />,
  //   name: "Manage Order",
  //   path: "/manage-order",
  // },
  // {
  //   icon: <SlSettings/>,
  //   name: "Website Settings",
  //   path: "/settings",
  // },
  // {
  //   name: "Forms",
  //   icon: <FaList />,
  //   subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
  // },
  // {
  //   name: "Tables",
  //   icon: <FaTable />,
  //   subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
  // },
  // {
  //   name: "Pages",
  //   icon: <FaFileAlt />,
  //   subItems: [
  //     { name: "Blank Page", path: "/blank", pro: false },
  //     { name: "404 Error", path: "/error-404", pro: false },
  //   ],
  // },
];

const othersItems: NavItem[] = [
  // {
  //   icon: <FaChartPie />,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart", pro: false },
  //     { name: "Bar Chart", path: "/bar-chart", pro: false },
  //   ],
  // },
  // {
  //   icon: <FaCube />,
  //   name: "UI Elements",
  //   subItems: [
  //     { name: "Alerts", path: "/alerts", pro: false },
  //     { name: "Avatar", path: "/avatars", pro: false },
  //     { name: "Badge", path: "/badge", pro: false },
  //     { name: "Buttons", path: "/buttons", pro: false },
  //     { name: "Images", path: "/images", pro: false },
  //     { name: "Videos", path: "/videos", pro: false },
  //   ],
  // },
  // {
  //   icon: <FaPlug />,
  //   name: "Authentication",
  //   subItems: [
  //     { name: "Sign In", path: "/signin", pro: false },
  //     { name: "Sign Up", path: "/signup", pro: false },
  //   ],
  // },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // open submenu if current path matches any subitem
  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "others", index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev && prev.type === menuType && prev.index === index
        ? null
        : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={(nav.name || index) as string}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              } w-full`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text ml-3">{nav.name}</span>
              )}

              {(isExpanded || isHovered || isMobileOpen) && (
                <FaChevronDown
                  className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span className="menu-item-icon-size">{nav.icon}</span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text ml-3">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {/* submenu */}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item flex items-center justify-between px-2 py-1 rounded-md ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      <span className="text-sm">{subItem.name}</span>

                      <span className="flex items-center gap-2">
                        {/* badge (count) */}
                        {typeof subItem.badge === "number" && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded-lg font-medium ${
                              isActive(subItem.path)
                                ? "bg-brand-500 text-white"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {subItem.badge}
                          </span>
                        )}

                        {/* new / pro */}
                        {subItem.new && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded-lg font-medium ${
                              isActive(subItem.path)
                                ? "bg-brand-500 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded-lg font-medium ${
                              isActive(subItem.path)
                                ? "bg-brand-500 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              src="/images/logo/updated-logo.svg"
              alt="Logo"
              width={150}
              height={40}
              className="dark:hidden"
            />
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar pb-8">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <FaEllipsisH className="text-gray-400" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {/* {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <FaEllipsisH className="text-gray-400" />
                )} */}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
