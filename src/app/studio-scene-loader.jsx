'use client'

import dynamic from 'next/dynamic'

const StudioScene = dynamic(() => import('./studio-scene'), { ssr: false })

export default function StudioSceneLoader(props) {
  return <StudioScene {...props} />
}
