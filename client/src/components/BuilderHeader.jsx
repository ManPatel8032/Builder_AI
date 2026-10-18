import { ArrowLeftIcon, Code2Icon, DownloadIcon, ExternalLinkIcon, EyeIcon, GlobeIcon, Loader2Icon } from 'lucide-react'
import React from 'react'

const BuilderHeader = ({
    projectName,
    version,
    showCode,
    publishing,
    onToggleShowCode,
    onOpenPreview,
    onPublish,
    onDownload,
    onBack,
    onLogout,
}) => {
    return (
        <header className='h-12 shrink-0 flex items-center justify-between px-3 border-b border-zinc-200 bg-white'>

            {/* Left — back button + logo + project name */}
            <div className='flex items-center gap-2 min-w-0'>
                <button
                    onClick={onBack}
                    className='shrink-0 p-1.5 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 cursor-pointer'>
                    <ArrowLeftIcon size={16} />
                </button>
                <img src="/logo.svg" alt="" className='invert size-5 shrink-0' />
                <span className='text-sm font-semibold truncate max-w-24 sm:max-w-38 md:max-w-50'>{projectName}</span>
                <span className='shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium'>v{version}</span>
            </div>

            {/* Right — action buttons
                On mobile  : icon only (labels hidden with hidden sm:inline)
                On desktop : icon + label                                     */}
            <div className='flex items-center gap-1'>

                {/* Code ↔ Preview toggle */}
                <button
                    onClick={onToggleShowCode}
                    className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 sm:px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white transition-colors ${showCode ? "bg-zinc-100 text-zinc-900" : ""}`}>
                    {showCode
                        ? <><EyeIcon size={13} /><span className='hidden sm:inline'>Preview</span></>
                        : <><Code2Icon size={13} /><span className='hidden sm:inline'>Code</span></>
                    }
                </button>

                {/* Open in new tab */}
                <button
                    onClick={onOpenPreview}
                    className='inline-flex items-center justify-center gap-1.5 py-1.5 px-2 sm:px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white transition-colors'>
                    <ExternalLinkIcon size={13} />
                    <span className='hidden md:inline'>Open</span>
                </button>

                {/* Publish */}
                <button
                    onClick={onPublish}
                    disabled={publishing}
                    className='inline-flex items-center justify-center gap-1.5 py-1.5 px-2 sm:px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white transition-colors'>
                    {publishing ? <Loader2Icon size={13} className='animate-spin' /> : <GlobeIcon size={13} />}
                    <span className='hidden sm:inline'>Publish</span>
                </button>

                {/* Export / Download */}
                <button
                    onClick={onDownload}
                    className='inline-flex items-center justify-center gap-1.5 py-1.5 px-2 sm:px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white transition-colors'>
                    <DownloadIcon size={13} />
                    <span className='hidden md:inline'>Export</span>
                </button>

                {/* Sign Out — icon only on mobile, full label on md+ */}
                <button
                    onClick={onLogout}
                    className='inline-flex items-center justify-center gap-1.5 py-1.5 px-2 sm:px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white transition-colors'>
                    <span className='hidden md:inline'>Sign Out</span>
                    {/* Small screens: show a minimal exit icon substitute using text */}
                    <span className='md:hidden text-[10px] font-semibold'>Sign Out</span>
                </button>

            </div>
        </header>
    )
}

export default BuilderHeader