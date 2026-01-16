const HeroImage: React.FC<{
  src?: string;
  alt: string;
  title?: string;
  pos?: string;
  className?: string;
}> = ({ src = "", alt, title, pos = "object-center", className = "" }) => (
  <img
    src={src}
    alt={alt}
    title={title}
    className={`h-full w-full object-cover block ${pos} ${className}`}
    loading="lazy"
  />
);

export default function DecklistImages({
  name,
  imgs,
}: {
  name: string;
  imgs: string[];
}) {
  if (imgs.length === 1) {
    return <HeroImage src={imgs[0]} alt={`${name} commander`} />;
  }

  if (imgs.length === 2) {
    return (
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: "polygon(0 0, 45% 0, 55% 100%, 0 100%)" }}
        >
          <img
            src={imgs[0]}
            alt={`${name} commander 1`}
            className="absolute inset-0 h-full w-full object-cover block"
            style={{
              transform: "translateX(-10%) scale(1.05)",
              transformOrigin: "center",
            }}
            loading="lazy"
          />
        </div>

        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: "polygon(45% 0, 100% 0, 100% 100%, 55% 100%)",
          }}
        >
          <img
            src={imgs[1]}
            alt={`${name} commander 2`}
            className="absolute inset-0 h-full w-full object-cover block"
            style={{
              transform: "translateX(25%) scale(1.05)",
              transformOrigin: "center",
            }}
            loading="lazy"
          />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[50%] top-0 h-full w-px bg-black/15" />
        </div>
      </div>
    );
  }

  if (imgs.length === 3) {
    return (
      <div className="absolute inset-0 grid grid-rows-[3fr_2fr]">
        <div className="overflow-hidden">
          <HeroImage
            src={imgs[0]}
            alt={`${name} commander 1`}
            pos="object-[50%_25%]"
          />
        </div>
        <div className="grid grid-cols-2">
          <div className="overflow-hidden border-t border-r border-black/10">
            <HeroImage src={imgs[1]} alt={`${name} commander 2`} />
          </div>
          <div className="overflow-hidden border-t border-black/10">
            <HeroImage src={imgs[2]} alt={`${name} commander 3`} />
          </div>
        </div>
      </div>
    );
  }

  if (imgs.length === 4) {
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2">
        <div className="overflow-hidden border-r border-b border-black/10">
          <HeroImage src={imgs[0]} alt={`${name} commander 1`} />
        </div>
        <div className="overflow-hidden border-b border-black/10">
          <HeroImage src={imgs[1]} alt={`${name} commander 2`} />
        </div>
        <div className="overflow-hidden border-r border-black/10">
          <HeroImage src={imgs[2]} alt={`${name} commander 3`} />
        </div>
        <div className="overflow-hidden">
          <HeroImage src={imgs[3]} alt={`${name} commander 4`} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center text-sm text-zinc-600">
      No image
    </div>
  );
}
