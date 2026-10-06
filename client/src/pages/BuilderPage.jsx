import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import BuilderHeader from '../components/BuilderHeader';
import { FolderTreeIcon, MessageSquareIcon } from 'lucide-react';
import ChatPanel from '../components/ChatPanel';
import { useEffect } from 'react';
const BuilderPage = () => {

  const { id } = useParams()
  const navigate = useNavigate()
  const [leftTab, setLeftTab] = useState("chat");
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState(null);
  const { activeProject, loadingActiveProject, activeFile, showCode, setActiveFile, setShowCode, loadProject, logout , chatLoading,handleChat} = useAppContext();

  useEffect(() => {
    if (!id) return;
    loadProject(id)
  }, [id])

  useEffect(() => {
    if (!id || !activeProject) return;
    if (activeProject.status === "pending" || activeProject.status === "generating") {
      const interval = setInterval(() => {
        loadProject(id, true)
      }, 1500)
      return () => { clearInterval(interval) }
    }
  }, [id, loadProject, activeProject])



  
  const handleOpenPreview = () => {
    if (!id) return;
    window.open(`/preview/${id}`, "_blank")
  }
  const handlePublish = async () => {

  }
  const handleDownload = () => {

  }

  if (loadingActiveProject || !activeProject) {
    return <Loading />
  }

  return (
    <div className='h-screen flex flex-col bg-white overflow-hidden text-zinc-900 relative'>
      {/* Top bar for header */}
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

      {/* Main layout */}
      <div className='flex-1 flex overflow-hidden'>
        {/* Left Sidebar */}
        <div className='w-[320px] shrink-0 flex flex-col border-r border-zinc-200 bg-white'>
          {/* Sidebar tabs */}
          <div className='flex border-b border-zinc-100'>
            <button onClick={() => { setLeftTab("chat") }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "chat" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}>
              <MessageSquareIcon size={13} />Chat
            </button>

            <button onClick={() => { setLeftTab("files") }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "files" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}>
              <FolderTreeIcon size={13} /> Files
            </button>
          </div>
          {/* Sidebar content */}
          <div className='flex-1 overflow-hidden'>
            {
              leftTab === 'chat' ? (
                <ChatPanel
                  messages={activeProject.messages} onSend={handleChat}
                  loading={chatLoading} />) : (
                <div> File explorer</div>
              )
            }

          </div>
        </div>
        {/* Preview/ Code Area */}
      </div>
    </div>
  )
}

export default BuilderPage