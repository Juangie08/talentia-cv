'use client';

import { useState, useRef, DragEvent } from 'react';
import { 
  Dialog, DialogContent, DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, Camera, PenTool, Share2, Copy, Check, Github, Layout, UserCircle, Loader2, Wand2, ImagePlus, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { CVData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUiText } from '@/lib/i18n/uiText';
import { getAIConfig } from '@/lib/aiClient';

interface Props {
  cvData: CVData;
  onPhotoGenerated?: (url: string) => void;
}

type TransformationId = 'linkedin' | 'dev' | 'signature-simple' | 'signature-stamp' | 'social-circle' | 'banner-header';

interface Transformation {
  id: TransformationId;
  category: 'RETOQUE PROFESIONAL' | 'FIRMA DIGITAL' | 'REDES SOCIALES' | 'PERSONAL BRANDING';
  icon: React.ReactNode;
  title: string;
  desc: string;
  prompt: string;
}

export default function ImageStudioDialog({ cvData, onPhotoGenerated }: Props) {
  const tr = useUiText();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<TransformationId>('linkedin');
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const userName = cvData.personalInfo.fullName || 'Tu Nombre';
  const userRole = cvData.personalInfo.title || 'Tu Rol Profesional';

  const TRANSFORMATIONS: Transformation[] = [
    {
      id: 'linkedin',
      category: 'RETOQUE PROFESIONAL',
      icon: <UserCircle className="w-4 h-4" />,
      title: 'Estilo LinkedIn / Corporativo',
      desc: 'Mantiene tu cara pero te pone en un estudio con luz profesional y fondo neutro.',
      prompt: `Actúa como un experto en retoque fotográfico profesional con IA.
Toma la foto de referencia que voy a subir y mejora solo la calidad, sin cambiar mi identidad: mantén exactamente mi rostro, mis rasgos faciales, proporciones, color de piel y expresión natural. No reemplaces mi cara por la de otra persona ni la conviertas en caricatura.
Transforma la imagen en un retrato profesional tipo LinkedIn/hoja de vida, encuadre desde el pecho hacia arriba, mirando a cámara con expresión segura y amable. Aplica iluminación suave de estudio, piel realista sin efecto plástico, y limpia pequeñas imperfecciones de forma sutil. Cambia el fondo por un fondo gris claro liso o ligeramente desenfocado, sin elementos distractores. Ajusta el color y el contraste para que la imagen se vea nítida y elegante, lista para usar en mi currículum y perfil profesional.`
    },
    {
      id: 'dev',
      category: 'RETOQUE PROFESIONAL',
      icon: <Layout className="w-4 h-4" />,
      title: 'Versión Startupero / Dev',
      desc: 'Un look más moderno con hoodie o camisa, ideal para el sector tech.',
      prompt: `Usa la foto que voy a subir como referencia obligatoria y respeta completamente mi rostro y mis rasgos reales. No cambies de persona.
Convierte esta foto en un retrato profesional moderno de desarrollador / fundador de startup: encuadre medio (cabeza y parte del torso), ligera sonrisa confiada, mirada directa a cámara. Iluminación suave tipo estudio, con un ligero efecto de luz lateral para dar profundidad. Fondo minimalista estilo oficina tecnológica desenfocada, con tonos azules oscuros muy suaves. Vísteme con camisa lisa y chaqueta o hoodie discreta en colores neutros. La imagen final debe ser limpia, nítida y creíble, perfecta para usar en LinkedIn, portafolio web y redes profesionales.`
    },
    {
      id: 'signature-simple',
      category: 'FIRMA DIGITAL',
      icon: <PenTool className="w-4 h-4" />,
      title: 'Firma Elegante en Esquina',
      desc: 'Añade tu nombre manuscrito en la esquina de tu foto ya retocada.',
      prompt: `Toma la foto profesional que voy a subir (ya retocada) y añade una firma digital elegante sin alterar mi rostro ni el fondo.
Crea una firma manuscrita de estilo profesional con mi nombre "${userName}", en un trazo fino, fluido y legible, usando un color blanco que contraste pero no distraiga. Coloca la firma en la esquina inferior derecha de la imagen, con un tamaño discreto que no tape la cara ni el texto importante. La firma debe verse integrada en la foto, con ligera sombra suave si es necesario, como si estuviera impresa sobre la imagen, reforzando mi branding personal sin restar profesionalismo.`
    },
    {
      id: 'signature-stamp',
      category: 'FIRMA DIGITAL',
      icon: <Check className="w-4 h-4" />,
      title: 'Firma con Sello Personal',
      desc: 'Firma moderna acompañada de un símbolo minimalista de tu sector.',
      prompt: `Edita la foto profesional que voy a subir sin tocar mi rostro ni cambiar el fondo.
Diseña una firma digital compuesta por mi nombre "${userName}" escrito a mano en estilo script moderno, acompañada de un pequeño símbolo minimalista relacionado con mi sector: ${userRole}. Coloca la firma cerca de la parte inferior izquierda, manteniendo suficiente espacio alrededor para que no se vea saturada. Usa un color blanco o gris muy claro con opacidad ligera para que se vea elegante y no agresiva. La firma debe parecer parte del diseño gráfico de la foto, ideal para usar en mi web personal, portafolio o presentación de hoja de vida.`
    },
    {
      id: 'social-circle',
      category: 'REDES SOCIALES',
      icon: <Share2 className="w-4 h-4" />,
      title: 'Foto Circular para Perfil',
      desc: 'Optimizado para WhatsApp/Telegram con marco y firma visible.',
      prompt: `A partir de la foto que voy a subir, genera una imagen cuadrada pensada para fotos de perfil de redes sociales, manteniendo exactamente mi cara y mis rasgos reales. No cambies de persona.
Coloca mi rostro dentro de un círculo centrado, con un marco fino de color azul oscuro alrededor del círculo. Fuera del círculo, mantén un fondo liso en tono gris claro minimalista. Añade mi firma digital con mi nombre "${userName}" en estilo manuscrito moderno, ubicada por fuera del círculo, en la parte inferior derecha del cuadrado, en un tamaño moderado y color blanco o gris muy claro. El resultado debe verse profesional y coherente cuando se recorte en formato redondo en WhatsApp, Facebook o LinkedIn, con mi cara centrada y la firma aún parcialmente visible.`
    },
    {
      id: 'banner-header',
      category: 'PERSONAL BRANDING',
      icon: <Layout className="w-4 h-4" />,
      title: 'Banner / Cabecera LinkedIn',
      desc: 'Crea una cabecera horizontal con tu foto a un lado y tu firma al otro.',
      prompt: `Usa mi retrato profesional (foto de referencia) y crea una imagen horizontal tipo banner para usar como cabecera en LinkedIn / web personal. Mantén fielmente mi rostro, mis rasgos y proporciones. Sitúa mi retrato en el lado izquierdo del banner, con fondo degradado suave en tonos azul oscuro a azul medio que transmita profesionalismo. En el lado derecho, deja espacio limpio y añade mi firma manuscrita "${userName}" grande, elegante, en blanco, junto con un texto pequeño debajo que diga "${userRole}" en tipografía sans serif. La composición debe verse moderna, minimalista y lista para usar como imagen de portada profesional.`
    }
  ];

  const currentTransformation = TRANSFORMATIONS.find(t => t.id === selectedId);

  const handleCopyPrompt = () => {
    if (!currentTransformation) return;
    navigator.clipboard.writeText(customPrompt || currentTransformation.prompt);
    setCopied(true);
    toast.success(tr('Prompt copiado al portapapeles'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateImage = async () => {
    const config = getAIConfig();

    if (!config || config.provider === 'local') {
      toast.error(tr('Configura una API key en el botón "IA" para generar imágenes'));
      return;
    }

    const apiKey = config.provider === 'gemini' 
      ? config.geminiApiKey 
      : config.provider === 'openai' 
        ? config.openaiApiKey 
        : config.zaiApiKey;

    if (!apiKey) {
      toast.error(tr('Falta la API key. Configúrala en el botón "IA"'));
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = customPrompt || currentTransformation?.prompt || '';
      
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          apiKey,
          prompt,
          model: config.model,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error al generar imagen');
      }

      setGeneratedImage(data.url);
      toast.success(tr('Imagen generada exitosamente'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(tr('Por favor selecciona un archivo de imagen'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      if (onPhotoGenerated) {
        onPhotoGenerated(generatedImage);
      } else {
        // Fallback to event dispatch
        const event = new CustomEvent('setPhotoUrl', { detail: generatedImage });
        window.dispatchEvent(event);
      }
      toast.success(tr('Imagen añadida a tu hoja de vida'));
      setIsOpen(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `talentia-${selectedId}-${Date.now()}.png`;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden lg:flex text-slate-500 hover:text-blue-500 gap-1.5 font-bold transition-all">
          <Camera className="w-4 h-4" />
          {tr('Estudio Foto IA')}
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[1100px] bg-slate-950 text-white border-white/10 p-0 overflow-hidden max-h-[90vh]">
        <div className="flex flex-col lg:flex-row h-full max-h-[85vh] overflow-hidden">
          {/* Sidebar: Opciones */}
          <aside className="w-full lg:w-72 border-r border-white/10 bg-slate-900/50 p-4 overflow-y-auto shrink-0">
            <div className="mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">{tr('Editor de Imagen IA')}</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                Selecciona una transformación y genera imágenes con IA.
              </p>
            </div>

            {/* Upload section */}
            <div 
              className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-white/5"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Label className="text-[10px] font-bold text-slate-400 uppercase">{tr('1. Sube tu foto')}</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="studio-upload"
                  ref={fileInputRef}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full border-white/10 text-slate-300 hover:bg-white/5 transition-all",
                    isDragging && "border-blue-400 bg-blue-500/20"
                  )}
                  onClick={() => document.getElementById('studio-upload')?.click()}
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  {isDragging ? "Suelta la imagen aquí" : "Seleccionar o arrastrar foto"}
                </Button>
                {uploadedImage && (
                  <div className="mt-2 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedImage} alt={tr('Subida')} className="w-full h-24 object-cover rounded-lg" />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {TRANSFORMATIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedId(t.id);
                    setGeneratedImage(null);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all border-2 group",
                    selectedId === t.id 
                      ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/40" 
                      : "bg-slate-800/50 border-transparent hover:border-white/10"
                  )}
                >
                  <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", selectedId === t.id ? "text-blue-200" : "text-slate-500")}>
                    {t.category}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={cn("shrink-0", selectedId === t.id ? "text-white" : "text-blue-500")}>
                      {t.icon}
                    </div>
                    <span className="text-xs font-bold truncate">{t.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content: Prompt & Output */}
          <main className="flex-1 p-6 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent)]">
            {currentTransformation && (
              <div className="max-w-2xl mx-auto space-y-6">
                <header className="text-center lg:text-left">
                  <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3 justify-center lg:justify-start leading-none uppercase">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    {currentTransformation.title}
                  </h2>
                  <p className="text-slate-400 font-medium text-sm italic">
                    {currentTransformation.desc}
                  </p>
                </header>

                {/* Custom Prompt Input */}
                <Card className="bg-slate-900 border-white/10 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-4 h-4 text-blue-400" />
                    <Label className="text-xs font-bold text-slate-300">{tr('Personalizar Prompt (opcional)')}</Label>
                  </div>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={currentTransformation.prompt}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-[11px] text-slate-300 placeholder:text-slate-600 resize-none h-24"
                  />
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl h-11 font-bold shadow-lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generar con IA
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyPrompt}
                    className="border-white/10 text-slate-300 hover:bg-white/5 rounded-xl"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Generated Image */}
                {generatedImage && (
                  <Card className="bg-slate-900 border-blue-500/30 p-4 rounded-2xl space-y-4">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={generatedImage} 
                        alt={tr('Generada')} 
                        className="w-full rounded-xl border border-white/10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUseImage}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                      >
                        <ImagePlus className="w-4 h-4 mr-2" />
                        Usar en mi Hoja de Vida
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownload}
                        className="border-white/10 text-slate-300 hover:bg-white/5 rounded-xl"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Info */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-2">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-[10px]">i</div>
                  <p className="text-[10px] text-amber-200/80 font-medium leading-relaxed">
                    <strong>{tr('Nota:')}</strong> La generación de imágenes usa tu API key configurada. 
                    Asegúrate de tener saldo disponible en OpenAI o Gemini.
                  </p>
                </div>

                {/* Alternative Tools */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <a 
                    href="https://www.krea.ai/apps/image-enhancer" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex flex-col items-center p-4 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-2xl transition-all group"
                  >
                    <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black text-sm mb-2 group-hover:scale-110 transition-transform">K</div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Krea.ai</span>
                    <span className="text-[9px] text-slate-500 font-medium mt-1 text-center">{tr('Mejora fotos')}</span>
                  </a>
                  
                  <a 
                    href="https://chat.openai.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex flex-col items-center p-4 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-2xl transition-all group"
                  >
                    <div className="w-8 h-8 bg-[#74aa9c] text-white rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Github className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">ChatGPT</span>
                    <span className="text-[9px] text-slate-500 font-medium mt-1 text-center">DALL-E 3</span>
                  </a>
                </div>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
