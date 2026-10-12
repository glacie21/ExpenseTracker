import React from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SafeUser } from "@/types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SafeUser | null;
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Baru saja";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil" maxWidth="md">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name || "Pengguna"} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-serif text-lg text-ink">{user.name}</p>
            <p className="truncate text-sm text-ink-3">{user.email}</p>
          </div>
        </div>

        <dl className="border-t border-rule-soft text-sm">
          <div className="flex justify-between gap-4 border-b border-rule-soft py-2.5">
            <dt className="text-ink-3">Terdaftar sejak</dt>
            <dd className="text-ink">{joinDate}</dd>
          </div>
        </dl>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <Link
            href="/settings"
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-sm border border-rule bg-surface px-3 text-xs font-medium text-ink transition-colors hover:bg-sunken"
          >
            Pengaturan akun
          </Link>
        </div>
      </div>
    </Modal>
  );
}
