// Theme-neutral core shared by every theme: class helpers plus the page-geometry
// components base.css and the preview paginator depend on. Everything visual lives
// in themes/<name>/components/.
// One factory makes every block/inline wrapper: <Tag class="<name> <extra> [page-break] [fill]">.
export const cx = (...parts) => parts.filter(Boolean).join(' ');

export const make = (name, Tag = 'div') => {
  const Component = ({ className, pageBreak, fill, children }) => (
    <Tag className={cx(name, className, pageBreak && 'page-break', fill && 'fill')}>{children}</Tag>
  );
  Component.displayName = name;
  return Component;
};

export const Page = make('page');
export const PageBreak = () => <div className="page-break" />;
