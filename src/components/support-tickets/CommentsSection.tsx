'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { TicketStatus } from '@prisma/client';
import { Send, Lock, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';

interface TicketUser {
  id: string;
  name: string | null;
  email: string;
  role?: string;
}

interface TicketAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

interface TicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  author: TicketUser;
  attachments: TicketAttachment[];
  createdAt: string;
}

interface SelectedFile {
  file: File;
  preview?: string;
}

interface CommentsSectionProps {
  ticketId: string;
  comments: TicketComment[];
  isAdmin: boolean;
  ticketStatus: TicketStatus;
  onCommentAdded?: () => void;
}

export function CommentsSection({
  ticketId,
  comments,
  isAdmin,
  ticketStatus,
  onCommentAdded,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: SelectedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Nedozvoljen tip fajla');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Fajl je prevelik (max 10MB)');
        continue;
      }

      const selectedFile: SelectedFile = { file };
      if (file.type.startsWith('image/')) {
        selectedFile.preview = URL.createObjectURL(file);
      }
      newFiles.push(selectedFile);
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/support-tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          isInternal: isAdmin && isInternal,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Greška pri dodavanju komentara');
      }

      const commentId = result.data.id;

      for (const selectedFile of selectedFiles) {
        const formData = new FormData();
        formData.append('file', selectedFile.file);
        formData.append('commentId', commentId);

        await fetch(`/api/support-tickets/${ticketId}/attachments`, {
          method: 'POST',
          body: formData,
        });
      }

      setNewComment('');
      setIsInternal(false);
      setSelectedFiles([]);
      onCommentAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri dodavanju komentara');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  const canComment = isAdmin || ticketStatus !== 'CLOSED';

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-6">
      <h2 className="text-sm font-medium text-slate-900 mb-4">
        Komentari ({comments.length})
      </h2>

      {/* Comments list */}
      <div className="space-y-3 mb-6">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-lg">
            Nema komentara
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg ${
                comment.isInternal
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-slate-50 border border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {comment.author.name || comment.author.email}
                  </span>
                  {comment.author.role === 'ADMIN' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                      IT
                    </span>
                  )}
                  {comment.isInternal && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-200 text-amber-800">
                      <Lock className="w-2.5 h-2.5" />
                      Interno
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>

              {comment.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {comment.attachments.map((attachment) => {
                    const FileIcon = getFileIcon(attachment.fileType);
                    const isImage = attachment.fileType.startsWith('image/');
                    return (
                      <a
                        key={attachment.id}
                        href={attachment.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        {isImage ? (
                          <img
                            src={attachment.filePath}
                            alt={attachment.fileName}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                            <FileIcon className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <span className="text-xs text-slate-700 truncate max-w-[100px]">
                          {attachment.fileName}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      {canComment ? (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Napišite komentar..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none"
            />

            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((selectedFile, index) => {
                  const FileIcon = getFileIcon(selectedFile.file.type);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      {selectedFile.preview ? (
                        <img
                          src={selectedFile.preview}
                          alt={selectedFile.file.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center">
                          <FileIcon className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <span className="text-xs text-slate-700 truncate max-w-[80px]">
                        {selectedFile.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                  Dodaj prilog
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {isAdmin && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Interni komentar
                    </span>
                  </label>
                )}
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-slate-900 hover:bg-slate-800"
              >
                <Send className="w-4 h-4 mr-1.5" />
                {isSubmitting ? 'Slanje...' : 'Pošalji'}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
          Tiket je zatvoren. Samo admin može dodavati komentare.
        </p>
      )}
    </div>
  );
}
