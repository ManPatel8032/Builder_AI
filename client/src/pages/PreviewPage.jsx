import { AlertCircleIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import FullPagePreview from '../components/FullPagePreview'
import api from '../api/api'
import Loading from '../components/Loading'
import { AlertCircleIcon } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const PreviewPage = () => {
  const { id } = useParams()
  const { activeProject: project, loadingActiveProject: loading, loadingProject } = useAppContext()

  useEffect(() => {
    if (id) { 
      loadingProject(id)
    }

  }, [id,loadingProject])

  if (loading || !project) {
    return <Loading />
  }
  
  return (
    <FullPagePreview files={project.files} />
  )
}

export default PreviewPage