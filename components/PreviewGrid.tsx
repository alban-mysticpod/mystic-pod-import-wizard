import Image from 'next/image';
import { DriveFile } from '@/types';
import { truncateFilename } from '@/lib/utils';
import { FileImage } from 'lucide-react';

interface PreviewGridProps {
  files: DriveFile[];
  isLoading?: boolean;
}

export function PreviewGrid({ files, isLoading = false }: PreviewGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-2" />
            <div className="bg-gray-200 h-4 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No files found in the folder</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file, index) => (
        <div
          key={file.id}
          className="group cursor-pointer animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 transition-transform group-hover:scale-105">
            {file.thumbnailUrl ? (
              <Image
                src={file.thumbnailUrl}
                alt={file.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileImage className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <p
            className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors"
            title={file.name}
          >
            {truncateFilename(file.name)}
          </p>
        </div>
      ))}
    </div>
  );
}
