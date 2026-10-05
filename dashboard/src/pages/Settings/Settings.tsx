import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";

/** ---- Types & Config ---- */
type TabKey =
  | "general"
  | "branding"
  | "seo"
  | "integrations"
  | "payments"
  | "notifications"
  | "roles"
  | "security"
  | "advanced";

const TABS: { key: TabKey; label: string; description?: string }[] = [
  { key: "general", label: "General", description: "Site name, URL, basics" },
  { key: "branding", label: "Branding", description: "Logo, colors, theme" },
  { key: "seo", label: "SEO", description: "Meta, sitemap, robots" },
  { key: "integrations", label: "Integrations", description: "Keys & webhooks" },
  { key: "payments", label: "Payments", description: "Gateways & currency" },
  { key: "notifications", label: "Notifications", description: "Email & in-app" },
  { key: "roles", label: "Roles & Permissions", description: "Access control" },
  { key: "security", label: "Security", description: "2FA, sessions" },
  { key: "advanced", label: "Advanced", description: "Danger zone" },
];

/** ---- Small helpers ---- */
function useQueryParam(name: string) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name), [search]);
}

function setQueryParam(navigate: ReturnType<typeof useNavigate>, key: string, value: string) {
  const params = new URLSearchParams(window.location.search);
  params.set(key, value);
  navigate({ search: params.toString() }, { replace: true });
}

/** ---- Section Components (stubs; replace with your real forms) ---- */
const SectionCard: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="space-y-4">{children ?? <Placeholder />}</div>
  </div>
);

const Placeholder = () => (
  <div className="text-gray-500">
    {/* Replace this with your actual fields/forms for each section */}
    <p>Build your form for this section here.</p>
  </div>
);

const GeneralSettings = () => (
  <SectionCard title="General Settings">
    {/* Example fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-700">Site Name</span>
        <input className="border rounded-lg px-3 py-2" placeholder="Foliomax" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-700">Base URL</span>
        <input className="border rounded-lg px-3 py-2" placeholder="https://example.com" />
      </label>
    </div>
    <div>
      <button className="mt-2 rounded-lg px-4 py-2 bg-black text-white">Save</button>
    </div>
  </SectionCard>
);

const BrandingSettings = () => (
  <SectionCard title="Branding">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-700">Primary Color</span>
        <input type="color" className="h-10 w-16 p-0 border rounded-lg" defaultValue="#0061ff" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-700">Logo</span>
        <input type="file" accept="image/*" className="border rounded-lg px-3 py-2" />
      </label>
    </div>
  </SectionCard>
);

const SEOSettings = () => (
  <SectionCard title="SEO">
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">Default Meta Title</span>
      <input className="border rounded-lg px-3 py-2" placeholder="Your awesome site" />
    </label>
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">Default Meta Description</span>
      <textarea className="border rounded-lg px-3 py-2" rows={4} placeholder="Short description..." />
    </label>
  </SectionCard>
);

const IntegrationsSettings = () => (
  <SectionCard title="Integrations">
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">Webhook URL</span>
      <input className="border rounded-lg px-3 py-2" placeholder="https://api.example.com/hook" />
    </label>
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">API Key</span>
      <input className="border rounded-lg px-3 py-2" placeholder="sk_live_********" />
    </label>
  </SectionCard>
);

const PaymentsSettings = () => (
  <SectionCard title="Payments">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-700">Default Currency</span>
        <select className="border rounded-lg px-3 py-2">
          <option>INR</option>
          <option>USD</option>
          <option>EUR</option>
        </select>
      </label>
      <label className="flex items-center gap-2 mt-6">
        <input type="checkbox" className="h-4 w-4" />
        <span className="text-sm text-gray-700">Enable Test Mode</span>
      </label>
    </div>
  </SectionCard>
);

const NotificationsSettings = () => (
  <SectionCard title="Notifications">
    <label className="flex items-center gap-2">
      <input type="checkbox" className="h-4 w-4" />
      <span>Email alerts for new orders</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" className="h-4 w-4" />
      <span>In-app alerts</span>
    </label>
  </SectionCard>
);

const RolesSettings = () => (
  <SectionCard title="Roles & Permissions">
    <p className="text-sm text-gray-600">Create roles and toggle permissions here.</p>
  </SectionCard>
);

const SecuritySettings = () => (
  <SectionCard title="Security">
    <label className="flex items-center gap-2">
      <input type="checkbox" className="h-4 w-4" />
      <span>Require 2FA for admins</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" className="h-4 w-4" />
      <span>Auto-logout after 15 minutes idle</span>
    </label>
  </SectionCard>
);

const AdvancedSettings = () => (
  <SectionCard title="Advanced">
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      Danger zone – proceed with caution.
    </div>
  </SectionCard>
);

/** ---- Main Page ---- */
const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const tabParam = (useQueryParam("tab") as TabKey | null) || "general";

  const ActiveView = useMemo(() => {
    switch (tabParam) {
      case "general":
        return <GeneralSettings />;
      case "branding":
        return <BrandingSettings />;
      case "seo":
        return <SEOSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      case "payments":
        return <PaymentsSettings />;
      case "notifications":
        return <NotificationsSettings />;
      case "roles":
        return <RolesSettings />;
      case "security":
        return <SecuritySettings />;
      case "advanced":
        return <AdvancedSettings />;
      default:
        return <GeneralSettings />;
    }
  }, [tabParam]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Settings mini-sidebar */}
        <aside className="col-span-12 md:col-span-3">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <ul className="flex md:block gap-2 md:gap-0 overflow-auto">
              {TABS.map((t) => {
                const active = t.key === tabParam;
                return (
                  <li key={t.key}>
                    <button
                      onClick={() => setQueryParam(navigate, "tab", t.key)}
                      className={[
                        "w-full text-left px-3 py-2 rounded-lg transition",
                        active
                          ? "bg-gray-900 text-white"
                          : "hover:bg-gray-100 text-gray-800",
                      ].join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      <div className="text-sm font-medium">{t.label}</div>
                      {t.description && (
                        <div className="text-xs opacity-70">{t.description}</div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Right: Content */}
        <section className="col-span-12 md:col-span-9">
          {ActiveView}
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
