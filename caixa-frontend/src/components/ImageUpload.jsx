import { useState, useRef } from 'react'
import { X, Image } from 'lucide-react'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || null)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Selecione apenas imagens')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const data = await response.json()

      if (data.secure_url) {
        setPreview(data.secure_url)
        onChange(data.secure_url)
      } else {
        alert('Erro ao fazer upload da imagem')
      }
    } catch (_error) {
      alert('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const remover = () => {
    setPreview(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {preview ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-brand-tan">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={remover}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="w-full h-40 rounded-xl border-2 border-dashed border-brand-tan hover:border-brand-teal flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-brand-sand/30"
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-brand-brown/50">Enviando imagem...</p>
            </>
          ) : (
            <>
              <div className="bg-brand-sand p-3 rounded-xl">
                <Image size={24} className="text-brand-teal" />
              </div>
              <p className="text-sm font-medium text-brand-brown">
                Clique para selecionar
              </p>
              <p className="text-xs text-brand-brown/50">
                ou arraste a imagem aqui
              </p>
              <p className="text-xs text-brand-tan">
                JPG, PNG, WEBP
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}