interface Mega30CapaProps {
  src: string;
  alt: string;
}

export default function Mega30Capa({ src, alt }: Mega30CapaProps) {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#000" }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
    </div>
  );
}
