import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Mail, Calendar, Key, User } from "lucide-react";
import { SafeUser } from "@/types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SafeUser | null;
}

export function UserProfileModal({
  isOpen,
  onClose,
  user,
}: UserProfileModalProps) {
  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Baru saja";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Pengguna"
      description="Informasi akun dan status keamanan Anda di Expense Tracker"
      maxWidth="md"
    >
      <div className="space-y-6 pt-2">
        {/* Header section with Avatar */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <Avatar name={user.name || "User"} size="lg" />
          <div className="overflow-hidden">
            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {user.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="success" size="sm">
                Akun Aktif
              </Badge>
            </div>
          </div>
        </div>

        {/* Details list */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <User className="w-4 h-4" />
              <span>User ID</span>
            </div>
            <code className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {user.id}
            </code>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <Calendar className="w-4 h-4" />
              <span>Terdaftar Sejak</span>
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {joinDate}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Keamanan Password</span>
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Bcrypt Hash (10 Salt Rounds)
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <Key className="w-4 h-4 text-indigo-500" />
              <span>Sesi Login</span>
            </div>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              HTTP-Only JWT Cookie
            </span>
          </div>
        </div>

        {/* Modal actions */}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
