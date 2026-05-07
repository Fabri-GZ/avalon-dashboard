"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, UserCheck } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ROLE_LABELS = {
  cm: "Community Manager",
  pm: "Project Manager",
  comercial: "Comercial",
};

export default function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("cm");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const response = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar invitación");
      }

      toast.success(`Invitación enviada a ${email}`);
      setEmail("");
      setRole("cm");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background rounded-2xl shadow-xl max-w-md w-full p-8"
      >
        <div className="text-center mb-6">
          <UserCheck className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invitar Usuario Interno</h1>
          <p className="text-muted-foreground text-sm">
            Enviá un email de invitación a un miembro del equipo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
                className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground shadow-sm transition-all disabled:opacity-50"
                placeholder="usuario@avalon.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Rol *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              disabled={isPending}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground shadow-sm transition-all disabled:opacity-50"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <motion.button
            type="submit"
            disabled={isPending}
            whileHover={{ scale: isPending ? 1 : 1.01 }}
            whileTap={{ scale: isPending ? 1 : 0.99 }}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg mt-2 disabled:opacity-50 transition-all"
          >
            {isPending ? "Enviando..." : "Enviar Invitación"}
          </motion.button>
        </form>

        <ToastContainer position="bottom-right" theme="dark" />
      </motion.div>
    </div>
  );
}
