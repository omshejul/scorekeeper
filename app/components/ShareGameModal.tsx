"use client";

import { Game } from "@/app/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Users, Plus, Trash2, Loader } from "lucide-react";
import { useState, useEffect } from "react";

interface ShareGameModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareGameModal({
  game,
  isOpen,
  onClose,
}: ShareGameModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    successful: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    if (game && isOpen) {
      loadShareInfo();
      const siteUrl = window.location.origin;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        siteUrl
      )}`;
      setQrCodeLoading(true);
      setQrCodeUrl(qrUrl);
    }
  }, [game, isOpen]);

  const loadShareInfo = async () => {
    if (!game) return;

    try {
      const response = await fetch(`/api/games/${game.id}/share`);
      if (response.ok) {
        const data = await response.json();
        setSharedWith(data.sharedWith || []);
        setShareUrl(window.location.origin);
      }
    } catch (error) {
      console.error("Failed to load share info:", error);
    }
  };

  const shareWithEmails = async () => {
    if (!game || !newEmail.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/games/${game.id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: [newEmail.trim()],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSharedWith(data.sharedWith);
        setShareUrl(window.location.origin);
        setNewEmail("");

        // Show email status if available
        if (data.emailResults) {
          setEmailStatus(data.emailResults);
          // Clear status after 5 seconds
          setTimeout(() => setEmailStatus(null), 5000);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to share game");
      }
    } catch (error) {
      console.error("Failed to share game:", error);
      alert("Failed to share game");
    } finally {
      setLoading(false);
    }
  };

  const removeSharedUser = async (email: string) => {
    // This would require another API endpoint to remove users
    console.log("Remove user:", email);
  };

  if (!game) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full relative rounded-md max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <Card className="pb-0 rounded-b-md gap-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Share "{game.name}"
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Game Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium mb-2">{game.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    {game.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-1 text-sm"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        {player.name}: {player.score}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New User */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Share with Email
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter email address..."
                      onKeyPress={(e) => e.key === "Enter" && shareWithEmails()}
                    />
                    <Button
                      onClick={shareWithEmails}
                      disabled={loading || !newEmail.trim()}
                      className="shrink-0"
                    >
                      {loading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Email Status */}
                  {emailStatus && (
                    <div
                      className={`text-sm p-2 rounded-md ${
                        emailStatus.failed > 0
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                    >
                      {emailStatus.successful > 0 && (
                        <p>
                          ✅ Successfully sent {emailStatus.successful}{" "}
                          invitation email(s)
                        </p>
                      )}
                      {emailStatus.failed > 0 && (
                        <p>
                          ❌ Failed to send {emailStatus.failed} invitation
                          email(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Currently Shared With */}
                {sharedWith.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Shared with</label>
                    <div className="space-y-2">
                      {sharedWith.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-2"
                        >
                          <span className="text-sm">{email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSharedUser(email)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </label>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      {qrCodeLoading && (
                        <div className="w-32 h-32 flex items-center justify-center">
                          <Loader className="w-8 h-8 animate-spin text-gray-900" />
                        </div>
                      )}
                      <img
                        src={qrCodeUrl}
                        alt="QR Code for site"
                        className={`w-32 h-32 ${qrCodeLoading ? "hidden" : ""}`}
                        onLoad={() => setQrCodeLoading(false)}
                        onError={() => setQrCodeLoading(false)}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Scan to visit site : {window.location.origin}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    💡 Shared users can view and modify this game in real-time.
                  </p>
                  <p>🔄 All changes sync automatically across all devices.</p>
                  <p>⚠️ Only you (the owner) can delete this game.</p>
                </div>
              </CardContent>
              <div className="sticky bottom-0 left-0 right-0 rounded-b-md h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
