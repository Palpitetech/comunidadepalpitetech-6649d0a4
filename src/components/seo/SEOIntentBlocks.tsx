import { cn } from "@/lib/utils";

interface SnippetProps {
  children: React.ReactNode;
  className?: string;
}

export const SnippetAnswer = ({ children, className }: SnippetProps) => (
  <div className={cn("snippet-answer", className)} id="snippet-answer">
    {children}
  </div>
);

export const MetaUpdate = ({ date }: { date: string }) => (
  <div className="meta-update">
    Atualizado em: {date}
  </div>
);

export const TrustBox = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("trust-box", className)}>
    {children}
  </div>
);

export const ResultNumber = ({ number, label }: { number: string | number, label?: string }) => (
  <div className="text-center my-4">
    {label && <span className="text-sm text-gray-600 block">{label}</span>}
    <span className="result-number">{number}</span>
  </div>
);

export const FAQSection = ({ items }: { items: { q: string; a: string }[] }) => (
  <section className="faq-seo" id="faq-seo">
    <h2>Dúvidas Frequentes</h2>
    {items.map((item, index) => (
      <div key={index} className="mb-4">
        <h3>{item.q}</h3>
        <p>{item.a}</p>
      </div>
    ))}
  </section>
);

export const VideoExplanation = ({ videoId, title }: { videoId: string; title?: string }) => (
  <div className="video-explanation" id="video-explanation">
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      title={title || "Explicação em vídeo"}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
);
