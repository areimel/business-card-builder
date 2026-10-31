import { cx } from '../../../server/components/core.jsx';

// Numbered section kicker: "01 / PROFILE".
export const Kicker = ({ index, className, children }) => (
  <p className={cx('kicker', className)}>
    {index && <span className="kicker-index">{index}</span>}
    {index && <span className="kicker-sep"> / </span>}
    <span className="kicker-text">{children}</span>
  </p>
);
