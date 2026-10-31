import { cx } from '../../../server/components/core.jsx';

// <strong class="label">Text:</strong>; colon appended unless colon={false}.
export const Label = ({ children, className, colon = true }) => (
  <strong className={cx('label', className)}>
    {children}
    {colon && ':'}
  </strong>
);

// Factory for <p class=cls><Label/></p> headings.
const heading = (cls) => ({ children, colon = true }) => (
  <p className={cls}>
    <Label colon={colon}>{children}</Label>
  </p>
);

export const CellHeading = heading('cell-heading');
export const CellSubHeading = heading('cell-subheading');

// Name line: "Name, Title".
export const NameHeading = ({ name, title }) => (
  <h1 className="name-heading">
    {name}
    {title && <span className="name-title">, {title}</span>}
  </h1>
);

// One "Label: value" contact item; consecutive items get " // " separators via CSS.
export const ContactField = ({ label, children }) => (
  <span className="contact-field">
    <Label>{label}</Label> {children}
  </span>
);
