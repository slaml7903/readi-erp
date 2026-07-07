interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {description && <p className="text-sm text-gray-400">{description}</p>}
    </div>
  );
}