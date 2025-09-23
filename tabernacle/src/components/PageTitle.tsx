
interface PageTitleProps{ 
  title: string;
}

export default function PageTitle({ title }: PageTitleProps) {
  return (
    <div
      className="text-3xl sm:text-4xl mb-4 font-bold"
      style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)" }}
    >
      {title}
    </div>
  );
}
