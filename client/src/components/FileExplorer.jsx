import React, { useMemo } from 'react';
import { FolderOpenIcon, FileText, FileCode } from 'lucide-react';

function getFileIcon(name) {
  if (name.endsWith('.css')) return <FileText size={14} className="text-blue-500" />;
  if (name.endsWith('.jsx') || name.endsWith('.js')) return <FileCode size={14} className="text-sky-500" />;
  if (name.endsWith('.json')) return <FileText size={14} className="text-green-500" />;
  return <FileText size={14} className="text-zinc-500" />;
}

// Helper to convert flat paths object to a nested directory structure
function buildTree(paths, files) {
  const root = [];
  for (const filePath of paths.sort()) {
    const parts = filePath.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = '/' + parts.slice(0, i + 1).join('/');
      
      let existing = current.find(n => n.name === name);
      if (!existing) {
        existing = {
          name,
          path: fullPath,
          isDirectory: !isLast,
          children: []
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }
  return root;
}

// Recursive component to render folders and files
function TreeItem({ node, activeFile, onFileSelect, depth = 0 }) {
  const isActive = node.path === activeFile;

  if (node.isDirectory) {
    return (
      <div>
        <div 
          className="flex items-center gap-2 py-1 px-2 text-xs text-zinc-400 font-medium select-none"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <FolderOpenIcon size={14} className="text-zinc-800 opacity-60" />
          <span>{node.name}</span>
        </div>
        <div>
          {node.children.map(child => (
            <TreeItem 
              key={child.path} 
              node={child} 
              activeFile={activeFile} 
              onFileSelect={onFileSelect} 
              depth={depth + 1} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(node.path)}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      className={`w-full flex items-center gap-2 py-1.5 px-2 text-xs transition-colors rounded-md cursor-pointer ${
        isActive 
          ? 'bg-zinc-50 text-zinc-950 font-medium' 
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
      }`}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export default function FileExplorer({ files, activeFile, onFileSelect }) {
  // Memoize tree building so it doesn't recalculate on every render
  const tree = useMemo(() => buildTree(Object.keys(files || {})), [files]);

  return (
    <div className="hide-scrollbar overflow-y-auto py-2">
      <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
        Files
      </p>
      {tree.map(node => (
        <TreeItem 
          key={node.path} 
          node={node} 
          activeFile={activeFile} 
          onFileSelect={onFileSelect} 
        />
      ))}
    </div>
  );
}