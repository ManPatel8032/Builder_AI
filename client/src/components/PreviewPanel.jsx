import React, { useState, useMemo, useEffect, useRef } from 'react';
import {SandpackProvider,SandpackLayout,SandpackCodeEditor,SandpackPreview,useSandpack} from '@codesandbox/sandpack-react';
import { useAppContext } from '../context/AppContext';
import { detectDependencies } from '../utils/sandpackUtils';

// Helper 1: Watches for file edits inside Sandpack editor and saves changes to DB and live state
function SandpackFileWatcher({ onLiveFilesChange }) {
  const { sandpack } = useSandpack();
  const { activeProject, updateProjectFiles } = useAppContext();
  const activeProjectRef = useRef(activeProject);

  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject]);

  useEffect(() => {
    const project = activeProjectRef.current;
    if (!project) return;

    const updatedFiles = {};
    let hasChanges = false;

    for (const [path, fileObject] of Object.entries(sandpack.files)) {
      const fileCode = fileObject.code;
      updatedFiles[path] = fileCode;

      const originalContent = typeof project.files[path] === 'string'
        ? project.files[path]
        : project.files[path]?.content;

      if (originalContent !== undefined && originalContent !== fileCode) {
        hasChanges = true;
      }
    }

    onLiveFilesChange(updatedFiles);
    if (hasChanges) {
      updateProjectFiles(updatedFiles);
    }
  }, [sandpack.files, onLiveFilesChange, updateProjectFiles]);

  return null;
}

// Helper 2: Suppresses specific Sandpack network/bundler errors that aren't critical
function SandpackErrorMonitor({ onErrorChange }) {
  const { sandpack } = useSandpack();
  const error = sandpack.error;

  useEffect(() => {
    if (error) {
      const message = error.message || '';
      const isNetworkError = 
        message.includes('failed to fetch') ||
        message.includes('csb.io') ||
        message.includes('timeout') ||
        message.includes('net::ERR');

      if (isNetworkError) {
        onErrorChange(false);
        return;
      }
      onErrorChange(true);
    } else {
      onErrorChange(false);
    }
  }, [error, onErrorChange]);

  return null;
}

export default function PreviewPanel({ project, activeFile, showCode }) {
  const [showErrorOverlay, setShowErrorOverlay] = useState(true);
  
  // Keep local state of files that updates as user types
  const [liveFiles, setLiveFiles] = useState(project.files);
  const [previousProjectKey, setPreviousProjectKey] = useState(`${project._id}-${project.version}`);

  const currentKey = `${project._id}-${project.version}`;
  if (previousProjectKey !== currentKey) {
    setPreviousProjectKey(currentKey);
    setLiveFiles(project.files);
  }

  // Convert liveFiles to Sandpack format
  const sandpackFiles = useMemo(() => {
    const spFiles = {};
    for (const [path, content] of Object.entries(liveFiles)) {
      const fileCode = typeof content === "string" ? content : content?.content || "";
      spFiles[path] = {
        code: fileCode,
        active: path === activeFile
      };
    }
    return spFiles;
  }, [liveFiles, activeFile]);

  // Detect dependencies from import statements using liveFiles
  const dependencies = useMemo(() => {
    return detectDependencies(liveFiles);
  }, [liveFiles]);

  const handleLiveFilesChange = (newFiles) => {
    setLiveFiles((prev) => {
      let changed = false;
      for (const [p, code] of Object.entries(newFiles)) {
        if (prev[p] !== code) {
          changed = true;
          break;
        }
      }
      return changed ? newFiles : prev;
    });
  };

  return (
    <div className="w-full h-full">
      <SandpackProvider
        key={project._id}
        template="react"
        files={sandpackFiles}
        customSetup={{ dependencies }}
        options={{
          externalResources: [
            'https://cdn.tailwindcss.com',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.3/css/all.min.css'
          ],
          classes:{
            "sp-wrapper" : "sp-wrapper",
            "sp-layout" : "sp-layout",
            "sp-preview" : "sp-preview",
          },
          logLevel: 0
        }}
        theme = {{
            colors: {
                surface1: "#ffffff",
                surface2: "#f4f4f5",
                surface3: "#e4e4e7",
                clickable: "#71717a",
                base: "#09090b",
                disabled: "#a1a1aa",
                hover: "#18181b",
                accent: "#18181b",
                error: "#ef4444",
                errorSurface: "#fef2f2",
            },

            font: {
                body: "'Urbanist', system-ui, -apple-system, sans-serif",
                mono: "'Geist Mono', ui-monospace, monospace",
                size: "13px",
                lineHeight: "1.6",
            }
        }}>

        <SandpackFileWatcher onLiveFilesChange={handleLiveFilesChange} />
        <SandpackErrorMonitor onErrorChange={setShowErrorOverlay} />
        
        <SandpackLayout className="h-full border-none bg-transparent">
          {showCode && (
            <SandpackCodeEditor
              showTabs={true}
              showLineNumbers={true}
              showInlineErrors={true}
              wrapContent={true}
              style={{ height: '100%', flex: 1, minWidth: 0 }}
            />
          )}
          
          <SandpackPreview
            showNavigator={false}
            showRefreshButton={true}
            showOpenInCodeSandbox={false}
            showSandpackErrorOverlay={showErrorOverlay}
            style={{ height: '100%', flex: showCode ? 1 : 2, minWidth: 0 }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}