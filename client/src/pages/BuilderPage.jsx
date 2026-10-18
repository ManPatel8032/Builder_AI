import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import BuilderHeader from '../components/BuilderHeader';
import { FolderTreeIcon, MessageSquareIcon, EyeIcon } from 'lucide-react';
import ChatPanel from '../components/ChatPanel';
import { useEffect } from 'react';
import FileExplorer from '../components/FileExplorer';
import PreviewPanel from '../components/PreviewPanel';
import AgentProgressDashboard from '../assets/builder-ai-assets/components/AgentProgressDashboard';
import PublishModal from '../components/PublishModal';
import api from '../api/api';
import { exportProjectZip } from '../utils/exportProject';
import { toast } from 'react-hot-toast';

const BuilderPage = () => {

  const { id } = useParams()
  const navigate = useNavigate()
  const [leftTab, setLeftTab] = useState("chat");
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState(null);
  const { activeProject, loadingActiveProject, activeFile, showCode, setActiveFile, setShowCode, loadProject, logout, chatLoading, handleChat } = useAppContext();

  useEffect(() => {
    if (!id) return;
    loadProject(id)
  }, [id, loadProject])

  const handleOpenPreview = () => {
    if (!id) return;
    window.open(`/preview/${id}`, "_blank")
  }

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true)
    try {
      await api.post(`/api/projects/${id}/publish`);
      const url = `${window.location.origin}/publish/${id}`;
      setPublishUrl(url);
      toast.success("Website published successfully")
    } catch (error) {
      console.error("Publish failed:", error);
      toast.error(error?.response?.data?.error || "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  const handleDownload = async () => {
    if (!activeProject) return;
    try {
      await exportProjectZip(activeProject);
      toast.success("Project exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export project");
    }
  }

  if (loadingActiveProject || !activeProject) {
    return <Loading />
  }

  // On mobile, "preview" is a 3rd tab that reveals the right panel full-height
  const showingMobilePreview = leftTab === "preview";

  return (
    <div className='h-screen flex flex-col bg-white overflow-hidden text-zinc-900 relative'>

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <BuilderHeader
        projectName={activeProject.name}
        version={activeProject.version}
        showCode={showCode}
        publishing={publishing}
        onToggleShowCode={() => { setShowCode(!showCode) }}
        onOpenPreview={handleOpenPreview}
        onPublish={handlePublish}
        onDownload={handleDownload}
        onBack={() => { navigate("/") }}
        onLogout={logout}
      />

      {/* ── Main body ───────────────────────────────────────────────────────
          Desktop (md+): side-by-side row — sidebar 320px | preview flex-1
          Mobile        : stacked column — sidebar on top | preview below
                          user switches between them via the tab bar          */}
      <div className='flex-1 flex flex-col md:flex-row overflow-hidden min-h-0'>

        {/* ── Left Sidebar ─────────────────────────────────────────────────
            Mobile : full width, 46 vh tall; hidden when Preview tab active
            Desktop: fixed 320 px, full height, always visible              */}
        <div className={`
          w-full md:w-[320px] md:shrink-0
          flex flex-col
          border-b md:border-b-0 md:border-r border-zinc-200 bg-white
          transition-all
          ${showingMobilePreview ? 'hidden md:flex' : 'flex'}
          h-[46vh] md:h-auto md:max-h-none
        `}>

          {/* Tab bar — Chat | Files | Preview(mobile-only) */}
          <div className='flex shrink-0 border-b border-zinc-100'>
            <button
              onClick={() => setLeftTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer transition-colors
                ${leftTab === "chat" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}>
              <MessageSquareIcon size={13} /> Chat
            </button>

            <button
              onClick={() => setLeftTab("files")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer transition-colors
                ${leftTab === "files" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}>
              <FolderTreeIcon size={13} /> Files
            </button>

            {/* Preview tab — renders only on mobile (md:hidden) */}
            <button
              onClick={() => setLeftTab("preview")}
              className={`md:hidden flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer transition-colors
                ${showingMobilePreview ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}>
              <EyeIcon size={13} /> Preview
            </button>
          </div>

          {/* Sidebar panel content */}
          <div className='flex-1 overflow-hidden min-h-0'>
            {leftTab === 'chat' ? (
              <ChatPanel
                messages={activeProject.messages}
                onSend={handleChat}
                loading={chatLoading}
              />
            ) : (
              <FileExplorer
                files={activeProject.files}
                activeFile={activeFile}
                onFileSelect={(path) => {
                  setActiveFile(path);
                  setShowCode(true);
                }}
              />
            )}
          </div>
        </div>

        {/* ── Preview / Code Area ──────────────────────────────────────────
            Mobile : only shown when "Preview" tab is active, takes remaining height
            Desktop: always visible, takes flex-1                            */}
        <div className={`flex-1 overflow-hidden min-h-0 ${showingMobilePreview ? 'block' : 'hidden md:block'}`}>
          {activeProject.status === "pending" || activeProject.status === "generating" || activeProject.status === "failed" ? (
            <AgentProgressDashboard project={activeProject} />
          ) : (
            <PreviewPanel
              project={activeProject}
              activeFile={activeFile}
              showCode={showCode}
            />
          )}
        </div>

      </div>

      {publishUrl && (
        <PublishModal
          publishUrl={publishUrl}
          onClose={() => setPublishUrl(null)}
        />
      )}
    </div>
  )
}

export default BuilderPage