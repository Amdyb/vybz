'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Camera, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddStoryModal({ userId, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const pickFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Seules les images sont acceptées pour le moment.')
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 50 Mo).')
      return
    }
    setFile(f)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const publish = async () => {
    if (!file || !userId || uploading) return
    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('stories')
      .upload(path, file, { contentType: file.type })

    if (upErr) {
      setError('Erreur lors du téléchargement. Veuillez réessayer.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(path)

    const { error: insErr } = await supabase.from('stories').insert({
      user_id: userId,
      media_url: publicUrl,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as never)

    if (insErr) {
      setError('Erreur lors de la publication. Veuillez réessayer.')
      setUploading(false)
      return
    }

    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-purple-900/30 rounded-3xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <h2 className="text-white font-black text-base">Ajouter une story</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          {/* Preview or file picker */}
          {preview ? (
            <div
              className="relative rounded-2xl overflow-hidden mb-4 bg-zinc-900"
              style={{ aspectRatio: '9/16', maxHeight: 320 }}
            >
              <Image src={preview} alt="Aperçu" fill className="object-cover" />
              <button
                onClick={() => { setFile(null); setPreview(null) }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-purple-900/30 hover:border-fuchsia-500/40 flex flex-col items-center justify-center gap-3 py-10 mb-4 transition-colors active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-full bg-fuchsia-500/10 flex items-center justify-center">
                <Camera className="w-7 h-7 text-fuchsia-400" />
              </div>
              <div className="text-center">
                <p className="text-white/70 text-sm font-semibold">Choisir une photo</p>
                <p className="text-white/30 text-xs mt-1">JPG, PNG, WebP · Max 50 Mo</p>
              </div>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
          />

          {error && (
            <p className="text-rose-400 text-xs mb-3 text-center">{error}</p>
          )}

          {/* Duration notice */}
          <p className="text-white/20 text-[10px] text-center mb-3">
            Expire après 24 heures
          </p>

          <button
            onClick={publish}
            disabled={!file || uploading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Publier la story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
