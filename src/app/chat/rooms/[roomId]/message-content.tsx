'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FileText, Download } from 'lucide-react';
import type { Message } from '@/lib/data';

type MessageContentProps = {
  message: Message;
};

export function MessageContent({ message }: MessageContentProps) {
  const { content, fileUrl, fileName, fileType } = message;

  const isImage = fileType?.startsWith('image/');

  return (
    <div>
      {fileUrl && (
        <div className="mb-2">
          {isImage ? (
            <Link href={fileUrl} target="_blank" rel="noopener noreferrer">
              <Image
                src={fileUrl}
                alt={fileName || 'Uploaded image'}
                width={200}
                height={200}
                className="rounded-lg object-cover"
              />
            </Link>
          ) : (
            <Link href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors">
              <FileText className="h-6 w-6" />
              <div className="flex-1">
                <p className="text-sm font-medium break-all">{fileName}</p>
              </div>
              <Download className="h-5 w-5" />
            </Link>
          )}
        </div>
      )}
      {content && <p className="text-sm break-words">{content}</p>}
    </div>
  );
}
