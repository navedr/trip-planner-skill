import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="font-display mb-2 text-3xl font-medium tracking-tight">
          Settings
        </h1>
        <p className="mb-8 text-muted-foreground">
          Manage your profile, API keys, and preferences
        </p>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Settings className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display mb-2 text-xl font-medium">
            Settings
          </h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Profile, API key management, and password settings
            will be available when the backend API is connected.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
