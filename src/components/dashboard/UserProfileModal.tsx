import React from "react";
import Link from "next/link";
import { ChevronRight, LogOut, Settings, Tags } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { SafeUser } from "@/types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: SafeUser | null;
}

const ROW =
  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-sunken";

/** Profile summary plus the account links that have no slot in the phone tab bar. */
export function UserProfileModal({ isOpen, onClose, onLogout, user }: UserProfileModalProps) {
  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Baru saja";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Akun" maxWidth="sm">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.name || "Pengguna"} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-ink">{user.name}</p>
            <p className="truncate text-sm text-ink-3">{user.email}</p>
            <p className="mt-0.5 text-xs text-ink-3">Terdaftar sejak {joinDate}</p>
          </div>
        </div>

        <ul className="divide-y divide-rule-soft overflow-hidden rounded-xl border border-rule">
          <li>
            <Link href="/categories" onClick={onClose} className={ROW}>
              <Tags className="h-4 w-4 text-ink-3" />
              <span className="flex-1">Kategori</span>
              <ChevronRight className="h-4 w-4 text-ink-3" />
            </Link>
          </li>
          <li>
            <Link href="/settings" onClick={onClose} className={ROW}>
              <Settings className="h-4 w-4 text-ink-3" />
              <span className="flex-1">Pengaturan akun</span>
              <ChevronRight className="h-4 w-4 text-ink-3" />
            </Link>
          </li>
          <li>
            <button type="button" onClick={onLogout} className={`${ROW} text-neg hover:bg-neg-soft`}>
              <LogOut className="h-4 w-4" />
              <span className="flex-1">Keluar</span>
            </button>
          </li>
        </ul>
      </div>
    </Modal>
  );
}
