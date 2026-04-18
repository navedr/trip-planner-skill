import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogOut, Save, KeyRound, User as UserIcon, Cpu } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Settings {
  llm_provider: string | null;
  llm_model: string | null;
  has_api_key: boolean;
  name: string;
  email: string;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "azure_openai", label: "Azure OpenAI" },
  { value: "anthropic", label: "Anthropic" },
] as const;

export function SettingsPage() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState<string>("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    apiFetch<Settings>("/settings")
      .then((s) => {
        setName(s.name);
        setEmail(s.email);
        setProvider(s.llm_provider ?? "");
        setModel(s.llm_model ?? "");
        setHasApiKey(s.has_api_key);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string | null> = {
        name,
        llm_provider: provider || null,
        llm_model: model || null,
      };
      if (apiKey.trim()) body.llm_api_key = apiKey.trim();
      const s = await apiFetch<Settings>("/settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setHasApiKey(s.has_api_key);
      setApiKey("");
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="font-display mb-2 text-3xl font-medium tracking-tight">
          Settings
        </h1>
        <p className="mb-8 text-muted-foreground">
          Manage your profile and AI provider
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            <Section title="Profile" icon={UserIcon}>
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Email">
                <Input value={email} readOnly disabled />
              </Field>
            </Section>

            <Section title="AI Provider" icon={Cpu}>
              <Field label="Provider">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">(none)</option>
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Model" hint="Defaults: gpt-5 (OpenAI), gpt-4o (Azure), claude-sonnet-4">
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. gpt-5, claude-sonnet-4-20250514"
                />
              </Field>
            </Section>

            <Section title="API Key" icon={KeyRound}>
              <Field
                label={hasApiKey ? "Replace API key" : "API key"}
                hint={hasApiKey ? "Leave blank to keep the existing key." : "Stored encrypted at rest."}
              >
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasApiKey ? "••••••••••••••••" : "sk-..."}
                  autoComplete="new-password"
                />
              </Field>
            </Section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={logout}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
