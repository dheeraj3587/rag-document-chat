'use client'

import React from 'react'
import { useParams } from 'next/navigation'
const page = () => {
  const { fileId } = useParams();
  return (
    <div>{fileId}</div>
  )
}

export default page